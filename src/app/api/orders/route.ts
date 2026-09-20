import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrderWithDetails } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const orderData = await getOrderWithDetails(id);
      if (!orderData) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(orderData);
    }

    const orders = await getAllOrders(50);
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      customerPhone = '9981154672',
      customerName,
      deliveryAddress,
      latitude,
      longitude,
      deliveryNotes
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const { getOrCreateCustomer, executeOrderAtomic } = await import('@/lib/db');
    const { calculateDistanceKm } = await import('@/lib/geo');

    const customer = await getOrCreateCustomer(customerPhone, customerName || undefined, deliveryAddress || undefined);
    
    let distanceKm: number | undefined;
    if (latitude && longitude) {
      distanceKm = calculateDistanceKm(latitude, longitude);
    }

    const rawMessage = items.map((i: any) => `${i.quantity}x item (${i.product_id})`).join(', ');

    const result = await executeOrderAtomic({
      customerId: customer.id,
      source: 'web_demo',
      rawMessage: `Web Storefront Order: ${rawMessage}`,
      deliveryAddress: deliveryAddress || customer.address || 'Vijay Nagar, Indore',
      latitude: latitude || null,
      longitude: longitude || null,
      distanceKm: distanceKm || null,
      deliveryNotes: deliveryNotes || null,
      items: items.map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        substituted_for_product_id: i.substituted_for_product_id || null
      }))
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Automatically send full bill & tracking link to customer's WhatsApp!
    try {
      const { sendOrderConfirmationWhatsApp } = await import('@/lib/whatsapp');
      await sendOrderConfirmationWhatsApp({
        orderId: result.order_id!,
        customerPhone,
        customerName: customer.name,
        items: result.items || [],
        totalPaise: result.total_paise!,
        deliveryAddress: deliveryAddress || customer.address
      });
    } catch (waErr) {
      console.warn('Could not send automated WhatsApp confirmation:', waErr);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: result.order_id,
        subtotal_paise: result.subtotal_paise,
        total_paise: result.total_paise,
        delivery_address: deliveryAddress || customer.address,
        distance_km: distanceKm,
        items: result.items
      },
      message: 'Order created, stock locked, and bill sent to customer WhatsApp!'
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 });
    }

    const { updateOrderStatus, getCustomerById } = await import('@/lib/db');
    const updated = await updateOrderStatus(orderId, status);

    // Automatically send dispatch update to customer's WhatsApp!
    if (updated) {
      try {
        const cust = await getCustomerById(updated.customer_id);
        if (cust?.phone) {
          const { sendOrderStatusUpdateWhatsApp } = await import('@/lib/whatsapp');
          await sendOrderStatusUpdateWhatsApp({
            orderId: updated.id,
            customerPhone: cust.phone,
            customerName: cust.name,
            status,
            deliveryAddress: updated.delivery_address || cust.address
          });
        }
      } catch (waErr) {
        console.warn('Could not send WhatsApp dispatch update:', waErr);
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update order status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
