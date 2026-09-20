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
  } | undefined;
}

if (!globalThis._kiranaBridgeState) {
  globalThis._kiranaBridgeState = {
    status: 'CONNECTED',
    qr: null,
    phone: '919981154672',
    updated_at: Date.now()
  };
}

export async function GET() {
  // 1. Try local bridge on port 3001 (works on localhost)
  try {
    const res = await fetch('http://127.0.0.1:3001/status', {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (globalThis._kiranaBridgeState) {
        globalThis._kiranaBridgeState = {
          status: data.status,
          qr: data.qr,
          phone: data.phone || '919981154672',
          updated_at: Date.now()
        };
      }
      return NextResponse.json({
        bridge_running: true,
        status: data.status,
        qr: data.qr,
        phone: data.phone || '919981154672'
      });
    }
  } catch {
    // Local bridge not reachable directly from this runtime (e.g. on Vercel)
  }

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
    globalThis._kiranaBridgeState = {
      status: body.status || 'CONNECTED',
      qr: body.qr || null,
      phone: body.phone || '919981154672',
      updated_at: Date.now()
    };
    return NextResponse.json({ success: true, state: globalThis._kiranaBridgeState });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
