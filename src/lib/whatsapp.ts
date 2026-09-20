import { formatOrderConfirmationMessage } from './gemini';

/**
 * Send an outbound WhatsApp message via the local Baileys bridge.
 */
export async function sendWhatsAppMessage(toPhone: string, text: string): Promise<boolean> {
  const digitsOnly = toPhone.replace(/[^\d]/g, '');
  const cleanPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

  // 1. Try local bridge on port 3001 (fastest for local environment)
  try {
    const res = await fetch('http://127.0.0.1:3001/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: cleanPhone, text }),
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Try global tunnel endpoint (works from Vercel serverless in production)
  const tunnelEndpoints = [
    process.env.WHATSAPP_BRIDGE_URL,
    'https://ramesh-kirana-bridge.loca.lt'
  ].filter(Boolean) as string[];

  for (const endpoint of tunnelEndpoints) {
    try {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      const res = await fetch(`${cleanEndpoint}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
          'Bypass-Tunnel-Reminder': '1'
        },
        body: JSON.stringify({ to: cleanPhone, text }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Send order confirmation bill and live tracking link to customer's WhatsApp
 */
export async function sendOrderConfirmationWhatsApp(params: {
  orderId: string;
  customerPhone: string;
  customerName?: string | null;
  items: Array<{ name: string; quantity: number; unit_price_paise: number; line_total_paise: number }>;
  totalPaise: number;
  deliveryAddress?: string | null;
}): Promise<boolean> {
  const { orderId, customerPhone, customerName, items, totalPaise, deliveryAddress } = params;

  const message = formatOrderConfirmationMessage(
    orderId,
    items,
    totalPaise,
    true, // delivery
    deliveryAddress || 'Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore',
    customerName
  );

  return sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send order status progression updates to customer's WhatsApp
 */
export async function sendOrderStatusUpdateWhatsApp(params: {
  orderId: string;
  customerPhone: string;
  customerName?: string | null;
  status: 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | string;
  deliveryAddress?: string | null;
}): Promise<boolean> {
  const { orderId, customerPhone, customerName, status, deliveryAddress } = params;
  const shortId = orderId.slice(-6).toUpperCase();
  const greeting = customerName && customerName !== 'Customer' ? `Namaste ${customerName} ji! 🙏` : `Namaste! 🙏`;
  const trackingUrl = `https://slowbrowssss.vercel.app/orders/${orderId}`;

  let statusText = '';
  if (status === 'PACKED') {
    statusText = `📦 *Order Update: #${shortId} is PACKED!*
Ramesh bhaiya ne aapke items pack kar diye hain. Rider thodi der mein nikal raha hai.
⏱️ ETA: ~15-20 mins`;
  } else if (status === 'OUT_FOR_DELIVERY') {
    statusText = `🛵 *Order Update: #${shortId} is OUT FOR DELIVERY!*
Rider Sonu Kumar aapke address par nikal chuke hain.
📍 Deliver to: ${deliveryAddress || 'Vijay Nagar, Indore'}
⏱️ ETA: ~10-12 mins
💰 Cash/UPI on Delivery`;
  } else if (status === 'DELIVERED') {
    statusText = `🎉 *Order Delivered! #${shortId}*
Aapka order successfully deliver ho gaya hai.
Ramesh Kirana Store (Vijay Nagar, Indore) se shopping karne ke liye dhanyawad! 🙏
Agla order WhatsApp par kabhi bhi message karke mangwayein.`;
  } else {
    statusText = `ℹ️ *Order Update: #${shortId}*
Status: ${status}`;
  }

  const fullMessage = `${greeting}\n\n${statusText}\n\n🗺️ *Live Order Tracking:*\n${trackingUrl}\n📱 Reply "track" anytime for live status.`;

  return sendWhatsAppMessage(customerPhone, fullMessage);
}
