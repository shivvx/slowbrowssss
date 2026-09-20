import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone = '9981154672', message } = body;

    const testText =
      message ||
      `🎉 *KiranaPilot WhatsApp Automation is Active!*
Ramesh Kirana Store (Vijay Nagar, Indore)
Device linked & ready to take automated customer orders 24/7.
Reply with any grocery list to test live ordering!`;

    const sent = await sendWhatsAppMessage(phone, testText);

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Test WhatsApp message delivered to +91 ${phone}!`,
        phone
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Local WhatsApp bridge did not respond. Ensure `npm run whatsapp-bridge` is running on port 3001.'
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send WhatsApp message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
