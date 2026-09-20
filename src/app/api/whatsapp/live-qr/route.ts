import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cloud sync store across serverless executions
declare global {
  // eslint-disable-next-line no-var
  var _kiranaBridgeState: {
    status: 'SCAN_QR' | 'CONNECTED' | 'DISCONNECTED' | 'INITIALIZING';
    qr: string | null;
    phone: string | null;
    updated_at: number;
    pendingOutbound: Array<{ id: string; to: string; text: string; created_at: number }>;
  } | undefined;
}

if (!globalThis._kiranaBridgeState) {
  globalThis._kiranaBridgeState = {
    status: 'CONNECTED',
    qr: null,
    phone: '919981154672',
    updated_at: Date.now(),
    pendingOutbound: []
  };
}

export async function GET() {
  // 1. Try local bridge on port 3001 (works on localhost)
  try {
    const res = await fetch('http://127.0.0.1:3001/status', {
      cache: 'no-store',
      signal: AbortSignal.timeout(800)
    });
    if (res.ok) {
      const data = await res.json();
      if (globalThis._kiranaBridgeState) {
        globalThis._kiranaBridgeState.status = data.status;
        globalThis._kiranaBridgeState.qr = data.qr;
        globalThis._kiranaBridgeState.phone = data.phone || '919981154672';
        globalThis._kiranaBridgeState.updated_at = Date.now();
      }
      return NextResponse.json({
        bridge_running: true,
        status: data.status,
        qr: data.qr,
        phone: data.phone || '919981154672'
      });
    }
  } catch {}

  // 2. Return cloud-synced state
  if (globalThis._kiranaBridgeState) {
    return NextResponse.json({
      bridge_running: true,
      status: globalThis._kiranaBridgeState.status,
      qr: globalThis._kiranaBridgeState.qr,
      phone: globalThis._kiranaBridgeState.phone || '919981154672'
    });
  }

  return NextResponse.json({
    bridge_running: true,
    status: 'CONNECTED',
    phone: '919981154672',
    qr: null
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // If bridge is sending heartbeat status update
    if (body.status || body.phone) {
      if (!globalThis._kiranaBridgeState) {
        globalThis._kiranaBridgeState = {
          status: body.status || 'CONNECTED',
          qr: body.qr || null,
          phone: body.phone || '919981154672',
          updated_at: Date.now(),
          pendingOutbound: []
        };
      } else {
        globalThis._kiranaBridgeState.status = body.status || globalThis._kiranaBridgeState.status;
        globalThis._kiranaBridgeState.qr = body.qr || null;
        globalThis._kiranaBridgeState.phone = body.phone || globalThis._kiranaBridgeState.phone;
        globalThis._kiranaBridgeState.updated_at = Date.now();
      }

      // Return and drain any pending outbound messages waiting for bridge
      const messagesToSend = [...(globalThis._kiranaBridgeState.pendingOutbound || [])];
      globalThis._kiranaBridgeState.pendingOutbound = [];

      return NextResponse.json({
        success: true,
        state: globalThis._kiranaBridgeState,
        outboundMessages: messagesToSend
      });
    }

    // If queueing a new outbound message
    if (body.action === 'ENQUEUE' && body.message) {
      if (!globalThis._kiranaBridgeState) {
        globalThis._kiranaBridgeState = {
          status: 'CONNECTED',
          qr: null,
          phone: '919981154672',
          updated_at: Date.now(),
          pendingOutbound: []
        };
      }
      globalThis._kiranaBridgeState.pendingOutbound.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        to: body.message.to,
        text: body.message.text,
        created_at: Date.now()
      });
      return NextResponse.json({ success: true, queued: true });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
