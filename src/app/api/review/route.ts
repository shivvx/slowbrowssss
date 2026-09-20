import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, executeOrderAtomic, getOrderWithDetails } from '@/lib/db';

export async function GET() {
  try {
    const all = await getAllOrders();
    const needsReview = all.filter(o => o.status === 'NEEDS_REVIEW');
    return NextResponse.json({ orders: needsReview });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch review queue';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action, modifiedItems } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'orderId and action are required' }, { status: 400 });
    }

    const orderData = await getOrderWithDetails(orderId);
    if (!orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      orderData.order.status = 'CONFIRMED';
      return NextResponse.json({ success: true, status: 'CONFIRMED' });
    } else if (action === 'REJECT') {
      orderData.order.status = 'CANCELLED';
      return NextResponse.json({ success: true, status: 'CANCELLED' });
    } else if (action === 'EDIT_AND_APPROVE' && modifiedItems) {
      // Re-run atomic deduction with modified items
      const result = await executeOrderAtomic({
        customerId: orderData.order.customer_id,
        source: orderData.order.source,
        rawMessage: `[Owner Edited]: ${orderData.order.raw_message}`,
        externalMessageId: `edit_${Date.now()}`,
        items: modifiedItems
      });
      orderData.order.status = 'CONFIRMED';
      return NextResponse.json({ success: true, order: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process review action';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
