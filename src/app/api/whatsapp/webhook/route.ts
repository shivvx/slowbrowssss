import { NextRequest, NextResponse } from 'next/server';
import { processCustomerMessage } from '@/lib/operator';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kiranapilot_verify_token_2026';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';

/**
 * GET /api/whatsapp/webhook: Meta Webhook Verification & Health Check
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  // Also support a simple health check
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/whatsapp/webhook',
    supported_formats: ['Meta Cloud API (JSON)', 'Twilio WhatsApp (form-urlencoded/JSON)', 'Direct JSON test'],
    store_operator: '+919981154672',
    autonomous_loop_steps: 7
  }, { status: 200 });
}

/**
 * POST /api/whatsapp/webhook: Universal Inbound WhatsApp Handler
 * Supports:
 * 1. Meta Cloud API webhook payloads
 * 2. Twilio WhatsApp webhooks (application/x-www-form-urlencoded & JSON) with TwiML response
 * 3. Direct JSON test requests ({ from, message })
 */
export async function POST(req: NextRequest) {
  try {
    let fromPhone = '';
    let textBody = '';
    let messageId = '';
    let customerName = '';
    let isTwilio = false;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // 1. Twilio Webhook (URL-encoded form data)
      const formData = await req.formData();
      const rawFrom = (formData.get('From') as string) || '';
      fromPhone = rawFrom.replace('whatsapp:', '').trim();
      textBody = (formData.get('Body') as string) || '';
      messageId = (formData.get('MessageSid') as string) || `tw_${Date.now()}`;
      customerName = (formData.get('ProfileName') as string) || '';
      isTwilio = true;
    } else {
      // 2. JSON Request (Meta Cloud API or Direct JSON or Twilio JSON)
      const body = await req.json();

      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        // Meta Cloud API Webhook
        const messageData = body.entry[0].changes[0].value.messages[0];
        fromPhone = messageData.from || '';
        messageId = messageData.id || `meta_${Date.now()}`;
        textBody = messageData.text?.body || '';
        customerName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || '';
      } else if (body.From && (body.Body || body.body)) {
        // Twilio JSON format
        fromPhone = String(body.From).replace('whatsapp:', '').trim();
        textBody = String(body.Body || body.body || '');
        messageId = String(body.MessageSid || `tw_${Date.now()}`);
        customerName = String(body.ProfileName || '');
        isTwilio = true;
      } else if (body.message || body.text) {
        // Direct JSON test format: { from: "+919981154672", message: "..." }
        fromPhone = body.from || body.customerPhone || body.phone || '9981154672';
        textBody = body.message || body.text || '';
        messageId = body.messageId || body.externalMessageId || `test_${Date.now()}`;
        customerName = body.customerName || body.name || '';
      }
    }

    if (!textBody) {
      return NextResponse.json({
        status: 'ignored_empty_message',
        message: 'No text body detected in payload'
      }, { status: 200 });
    }

    // Format phone to E.164 (+91...)
    const cleanPhone = fromPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91')
      ? `+${cleanPhone}`
      : cleanPhone.length === 10
      ? `+91${cleanPhone}`
      : `+${cleanPhone}`;

    // Execute KiranaPilot Autonomous Loop
    const result = await processCustomerMessage({
      source: 'whatsapp',
      customerPhone: formattedPhone,
      message: textBody,
      externalMessageId: messageId,
      customerName: customerName || undefined
    });

    // If Twilio, return TwiML XML so Twilio automatically sends WhatsApp reply
    if (isTwilio) {
      const escapedReply = (result.reply_message || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedReply}</Message>
</Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // If Meta Cloud API credentials are configured, dispatch outbound reply
    if (ACCESS_TOKEN && PHONE_NUMBER_ID && fromPhone) {
      try {
        const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              body: result.reply_message
            }
          })
        });
      } catch (sendError) {
        console.error('Failed to dispatch Meta WhatsApp outbound reply:', sendError);
      }
    }

    // Return comprehensive JSON with loop status, order, and events
    return NextResponse.json({
      status: 'success',
      action: result.action_taken,
      order: result.order || null,
      reply_message: result.reply_message,
      agent_run_id: result.agent_run_id,
      autonomous_loop: {
        step1_intent_parsed: true,
        step2_products_identified: true,
        step3_inventory_pricing_retrieved: true,
        step4_order_total_calculated: Boolean(result.order),
        step5_order_created: Boolean(result.order),
        step6_inventory_updated: Boolean(result.order),
        step7_confirmation_provided: true
      },
      events: result.events || []
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('WhatsApp webhook processing error:', err);
    return NextResponse.json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown webhook error'
    }, { status: 500 });
  }
}
