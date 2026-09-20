import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('http://127.0.0.1:3001/status', {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        bridge_running: true,
        status: data.status,
        qr: data.qr,
        phone: data.phone
      });
    }
  } catch {
    // Bridge not running locally
  }

  return NextResponse.json({
    bridge_running: false,
    status: 'BRIDGE_OFFLINE',
    message: 'Local WhatsApp Web bridge not detected on port 3001. Run "npm run whatsapp-bridge" to link.'
  });
}
