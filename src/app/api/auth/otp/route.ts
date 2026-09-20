import { NextRequest, NextResponse } from 'next/server';
import { generateAndSendOtp, verifyOtp } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalizedAction = action?.toUpperCase();

    if (normalizedAction === 'SEND') {
      const result = await generateAndSendOtp(phone);
      return NextResponse.json(result);
    } else if (normalizedAction === 'VERIFY') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      const result = verifyOtp(phone, otp);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful! Store operator session initialized.'
      });

      // Set session cookie
      response.cookies.set('kirana_session', `auth_${phone}_${Date.now()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
