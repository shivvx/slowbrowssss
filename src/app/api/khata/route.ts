import { NextRequest, NextResponse } from 'next/server';
import { getKhataCustomers, recordKhataPayment, generateEveningTallyAndEmail } from '@/lib/khata';

export async function GET() {
  try {
    const customers = await getKhataCustomers();
    const totalOutstandingPaise = customers.reduce((acc, c) => acc + c.totalCreditPaise, 0);

    return NextResponse.json({
      customers,
      totalOutstandingPaise,
      totalOutstandingINR: (totalOutstandingPaise / 100).toFixed(2),
      creditCustomerCount: customers.filter(c => c.totalCreditPaise > 0).length
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch khata';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, customerId, amountPaise } = body;

    if (action === 'SETTLE_PAYMENT') {
      if (!customerId || typeof amountPaise !== 'number') {
        return NextResponse.json({ error: 'customerId and amountPaise are required' }, { status: 400 });
      }
      const updated = await recordKhataPayment(customerId, amountPaise);
      return NextResponse.json({ success: true, customer: updated });
    } else if (action === 'SEND_EVENING_TALLY' || action === 'SEND_TALLY_EMAIL' || action === 'TALLY') {
      const emailResult = await generateEveningTallyAndEmail();
      if (!emailResult.success) {
        return NextResponse.json({ error: emailResult.error || 'Failed to send email' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Daily evening tally report successfully calculated and emailed to store owner via Purelymail SMTP!',
        messageId: emailResult.messageId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process khata action';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
