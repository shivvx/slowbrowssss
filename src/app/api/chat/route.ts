import { NextRequest, NextResponse } from 'next/server';
import { processCustomerMessage } from '@/lib/operator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, customerPhone, customerName, customerAddress } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }

    const phone = customerPhone && customerPhone.trim() ? customerPhone.trim() : '+919876543210';
    const result = await processCustomerMessage({
      source: 'web_demo',
      customerPhone: phone,
      message: message.trim(),
      customerName: customerName || 'Shivam Sharma',
      customerAddress: customerAddress || 'Flat 402, Green Valley Apts'
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
