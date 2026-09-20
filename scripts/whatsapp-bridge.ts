import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import http from 'http';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

const PORT = 3001;
const AUTH_DIR = path.join(process.cwd(), 'data', 'auth_info_baileys');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let latestQrDataUrl: string | null = null;
let latestRawQr: string | null = null;
let connectionStatus: 'INITIALIZING' | 'SCAN_QR' | 'CONNECTED' | 'DISCONNECTED' = 'INITIALIZING';
let connectedPhone: string | null = null;
let currentSock: any = null;

// Start local HTTP server to expose QR and status to Next.js UI
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Bypass-Tunnel-Reminder');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: connectionStatus,
      qr: latestQrDataUrl,
      phone: connectedPhone
    }));
    return;
  }

  if (req.url === '/send' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const { to, text } = JSON.parse(bodyStr);
        if (!to || !text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'to and text are required' }));
          return;
        }
        if (!currentSock || connectionStatus !== 'CONNECTED') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
          return;
        }

        const digits = to.replace(/[^\d]/g, '');
        const jid = digits.includes('@') ? digits : `${digits}@s.whatsapp.net`;
        await currentSock.sendMessage(jid, { text });
        console.log(`\n📤 Outbound WhatsApp notification sent to ${jid}:\n${text}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, jid }));
      } catch (e: any) {
        console.error('Error sending outbound WhatsApp message:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`📡 WhatsApp Web Bridge HTTP server running on http://localhost:${PORT}`);
});

async function syncStatusToCloud() {
  const payload = {
    status: connectionStatus,
    qr: latestQrDataUrl,
    phone: connectedPhone
  };

  const endpoints = [
    'http://127.0.0.1:3000/api/whatsapp/live-qr',
    'https://slowbrowssss.vercel.app/api/whatsapp/live-qr'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        // Drain and execute any queued outbound messages from cloud
        if (data.outboundMessages && Array.isArray(data.outboundMessages) && data.outboundMessages.length > 0) {
          for (const msg of data.outboundMessages) {
            if (!currentSock || connectionStatus !== 'CONNECTED') continue;
            const digits = msg.to.replace(/[^\d]/g, '');
            const jid = digits.includes('@') ? digits : `${digits}@s.whatsapp.net`;
            await currentSock.sendMessage(jid, { text: msg.text });
            console.log(`\n📤 Outbound WhatsApp notification (from cloud queue) sent to ${jid}:\n${msg.text}`);
          }
        }
      }
    } catch {}
  }
}

// Heartbeat sync every 2 seconds
setInterval(syncStatusToCloud, 2000);

async function startWhatsAppBridge() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WhatsApp Web version v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['KiranaPilot Autonomous Operator', 'Desktop', '1.0.0']
  });

  currentSock = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestRawQr = qr;
      latestQrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
      connectionStatus = 'SCAN_QR';
      console.log('\n⚡ Real WhatsApp Web QR Code generated! Scan from WhatsApp > Linked Devices:');
      qrcodeTerminal.generate(qr, { small: true });
      syncStatusToCloud();
    }

    if (connection === 'close') {
      connectionStatus = 'DISCONNECTED';
      syncStatusToCloud();
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`WhatsApp connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        startWhatsAppBridge();
      } else {
        console.log('Logged out. Cleaning credentials directory...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {
          console.error(e);
        }
        startWhatsAppBridge();
      }
    } else if (connection === 'open') {
      connectionStatus = 'CONNECTED';
      latestQrDataUrl = null;
      connectedPhone = sock.user?.id?.split(':')[0] || sock.user?.id || 'Connected';
      console.log(`✅ WhatsApp Web linked successfully! Active on phone: ${connectedPhone}`);
      console.log('🚀 KiranaPilot Autonomous Operator is LIVE and listening for inbound WhatsApp customer messages...');
      syncStatusToCloud();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Inbound Customer Messages: Autonomous Operator Loop
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      // Ignore messages sent by ourselves or group messages
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith('@g.us')) continue; // skip group chats

      // Extract message text and location
      let text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

      const loc = msg.message?.locationMessage || msg.message?.liveLocationMessage;
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationAddress: string | null = null;

      if (loc) {
        latitude = loc.degreesLatitude || null;
        longitude = loc.degreesLongitude || null;
        locationAddress = (loc as any).address || (loc as any).name || (loc as any).caption || `GPS: ${latitude}, ${longitude}`;
        if (!text.trim()) {
          text = `Delivery location: ${locationAddress}`;
        }
      }

      if (!text.trim()) continue;

      const senderPhone = jid.split('@')[0];
      const pushName = msg.pushName || 'Customer';

      console.log(`\n📩 Inbound WhatsApp message from ${pushName} (+${senderPhone}): "${text}"`);

      try {
        // Dynamic import of operator to handle local environment
        const { processCustomerMessage } = await import('../src/lib/operator');

        const result = await processCustomerMessage({
          source: 'whatsapp',
          customerPhone: `+${senderPhone}`,
          message: text,
          externalMessageId: msg.key.id || `baileys_${Date.now()}`,
          customerName: pushName,
          customerAddress: locationAddress || undefined,
          latitude,
          longitude
        });

        console.log(`🤖 KiranaPilot reply (${result.action_taken}):\n${result.reply_message}`);

        // Send automated WhatsApp reply
        await sock.sendMessage(jid, { text: result.reply_message });
        console.log(`✅ Automated WhatsApp reply sent successfully to +${senderPhone}!`);
      } catch (err: any) {
        console.error('Error in autonomous operator reply:', err);
        await sock.sendMessage(jid, {
          text: 'Namaste! Order receive karne me thodi problem hui. Kirana store operator ko alert bhej diya hai.'
        });
      }
    }
  });
}

startWhatsAppBridge().catch((err) => {
  console.error('Fatal error starting WhatsApp Web bridge:', err);
});
