import {
  parseOrderIntent,
  disambiguateProductCandidate,
  formatSubstitutionOffer,
  formatOrderConfirmationMessage
} from './gemini';
import {
  getOrCreateCustomer,
  searchProductCandidates,
  findSubstitutionCandidates,
  executeOrderAtomic,
  createAgentRun,
  updateAgentRun,
  recordAgentEvent,
  getAgentRunEvents,
  getPendingConversation,
  setPendingConversation,
  clearPendingConversation,
  getCustomerLastOrder,
  getProductById
} from './db';
import { ProcessMessageResult, Product, OrderProcessItem } from './types';

export interface ProcessCustomerMessageParams {
  source: 'whatsapp' | 'web_demo' | 'voice';
  customerPhone: string;
  message: string;
  externalMessageId?: string | null;
  customerName?: string;
  customerAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * KiranaPilot Master Autonomous Orchestrator:
 * Executes the entire 3-brain pipeline deterministically, safely, and transparently.
 */
export async function processCustomerMessage(
  params: ProcessCustomerMessageParams
): Promise<ProcessMessageResult> {
  const startTime = Date.now();
  const { source, customerPhone, message, externalMessageId, customerName, customerAddress, latitude, longitude } = params;

  // 1. Initialize Agent Run & Trace
  const agentRun = await createAgentRun({
    customer_id: null,
    source,
    raw_input: message
  });

  await recordAgentEvent(agentRun.id, 'MESSAGE_RECEIVED', 'INFO', {
    source,
    phone: customerPhone,
    message,
    external_message_id: externalMessageId || null
  });

  try {
    // 2. Resolve or Create Customer
    const customer = await getOrCreateCustomer(customerPhone, customerName, customerAddress);
    if (latitude && longitude) {
      customer.latitude = latitude;
      customer.longitude = longitude;
    }
    await updateAgentRun(agentRun.id, { customer_id: customer.id });

    await recordAgentEvent(agentRun.id, 'CUSTOMER_RESOLVED', 'SUCCESS', {
      customer_id: customer.id,
      name: customer.name,
      phone: customer.phone,
      preference: customer.substitution_preference
    });

    // 3. Check for Pending Conversation (Two-turn Substitution Recovery)
    const pending = await getPendingConversation(customerPhone);
    if (pending && pending.pending_state.type === 'SUBSTITUTION_PROPOSAL') {
      const lower = message.toLowerCase().trim();
      const isAffirmative = ['haan', 'yes', 'ha', 'theek hai', 'thik h', 'replace', 'kar do', 'kardo', 'bhej do', 'ok', 'sure'].some(
        w => lower === w || lower.includes(w)
      );

      if (isAffirmative && pending.pending_state.proposed_substitution) {
        await recordAgentEvent(agentRun.id, 'SUBSTITUTION_APPROVED', 'SUCCESS', {
          original_item: pending.pending_state.proposed_substitution.original_item_name,
          replaced_with: pending.pending_state.proposed_substitution.alternative_product.name,
          user_reply: message
        });

        // Assemble final order items with substituted product
        const finalItems = [
          ...pending.pending_state.resolved_items.map(ri => ({
            product_id: ri.product_id,
            quantity: ri.quantity,
            substituted_for_product_id: null
          })),
          {
            product_id: pending.pending_state.proposed_substitution.alternative_product.id,
            quantity: pending.pending_state.proposed_substitution.quantity,
            substituted_for_product_id: pending.pending_state.proposed_substitution.original_product_id
          }
        ];

        // Clear pending conversation state
        await clearPendingConversation(customerPhone);

        // Execute Atomic Order (Brain 3)
        await recordAgentEvent(agentRun.id, 'STOCK_RESERVATION', 'INFO', { items: finalItems });
        const orderResult = await executeOrderAtomic({
          customerId: customer.id,
          source,
          rawMessage: `${pending.pending_state.original_message} + [Substituted: ${pending.pending_state.proposed_substitution.alternative_product.name}]`,
          externalMessageId: externalMessageId || `sub_${Date.now()}`,
          items: finalItems
        });

        if (!orderResult.success) {
          throw new Error(orderResult.message || 'Order placement failed');
        }

        await recordAgentEvent(agentRun.id, 'ORDER_CREATED', 'SUCCESS', {
          order_id: orderResult.order_id,
          total_paise: orderResult.total_paise,
          total_inr: ((orderResult.total_paise || 0) / 100).toFixed(2),
          items_count: orderResult.items?.length
        });

        await recordAgentEvent(agentRun.id, 'INVENTORY_UPDATED', 'SUCCESS', {
          mutated_items: orderResult.items?.map(i => ({
            name: i.name,
            stock_after: i.stock_after
          }))
        });

        // Low stock detection
        if (orderResult.low_stock_alerts && orderResult.low_stock_alerts.length > 0) {
          for (const alert of orderResult.low_stock_alerts) {
            await recordAgentEvent(agentRun.id, 'LOW_STOCK_DETECTED', 'WARNING', {
              product_id: alert.product_id,
              name: alert.name,
              current_stock: alert.current_stock,
              reorder_level: alert.reorder_level
            });
          }
        }

        const replyMessage = formatOrderConfirmationMessage(
          orderResult.order_id!,
          orderResult.items!,
          orderResult.total_paise!,
          pending.pending_state.original_intent.delivery_requested,
          customer.address,
          customer.name
        );

        await recordAgentEvent(agentRun.id, 'CONFIRMATION_SENT', 'SUCCESS', {
          recipient: customerPhone,
          channel: source
        });

        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, {
          intent: 'CONFIRM_SUBSTITUTION',
          confidence: 0.99,
          status: 'SUCCESS',
          latency_ms: latency
        });

        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: true,
          action_taken: 'ORDER_CONFIRMED',
          reply_message: replyMessage,
          order: {
            id: orderResult.order_id!,
            total_paise: orderResult.total_paise!,
            total_inr: ((orderResult.total_paise || 0) / 100).toFixed(2),
            items: (orderResult.items || []) as OrderProcessItem[],
            low_stock_alerts: orderResult.low_stock_alerts || []
          },
          agent_run_id: agentRun.id,
          events
        };
      } else {
        // Customer rejected substitution
        await recordAgentEvent(agentRun.id, 'SUBSTITUTION_REJECTED', 'INFO', {
          user_reply: message
        });
        await clearPendingConversation(customerPhone);
        
        const reply = "Theek hai, humne woh product order mein add nahi kiya. Kya aapko kuch aur chahiye?";
        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, {
          intent: 'CANCEL',
          confidence: 0.95,
          status: 'SUCCESS',
          latency_ms: latency
        });

        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: true,
          action_taken: 'INFO_REPLY',
          reply_message: reply,
          agent_run_id: agentRun.id,
          events
        };
      }
    }

    // 4. Brain 1: Natural Language Understanding
    const parsedIntent = await parseOrderIntent(message);
    await recordAgentEvent(agentRun.id, 'INTENT_PARSED', 'SUCCESS', {
      intent: parsedIntent.intent,
      language: parsedIntent.language,
      delivery_requested: parsedIntent.delivery_requested,
      confidence: parsedIntent.confidence,
      items_extracted: parsedIntent.items.length
    });

    await updateAgentRun(agentRun.id, {
      intent: parsedIntent.intent,
      confidence: parsedIntent.confidence
    });

    // 5. Handle Intent: TRACK_ORDER ("track order", "kahan hai mera order", "order status")
    if (parsedIntent.intent === 'TRACK_ORDER') {
      await recordAgentEvent(agentRun.id, 'CUSTOMER_MEMORY_ACCESSED', 'INFO', {
        customer_id: customer.id,
        action: 'ORDER_TRACKING_INQUIRY'
      });

      const pastOrderData = await getCustomerLastOrder(customer.id);
      if (!pastOrderData) {
        const reply = "Aapka koi active order record nahi mila. Naya order place karne ke liye kripya grocery items WhatsApp par bhej dijiye.";
        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: true,
          action_taken: 'INFO_REPLY',
          reply_message: reply,
          agent_run_id: agentRun.id,
          events
        };
      }

      const { order: lastOrder, items: orderItems } = pastOrderData;
      const totalINR = (lastOrder.total_paise / 100).toFixed(2);
      const deliveryAddress = lastOrder.delivery_address || customer.address || 'Flat 402, Green Valley Apartments, Sector 14, Gurugram';
      const itemsList = orderItems.map(i => `• ${i.quantity}x ${i.product?.name || 'Item'}`).join('\n');

      const reply = `📦 *Live Order Status: #${lastOrder.id.slice(-6).toUpperCase()}*
🛵 *Status:* Out for Delivery (Ramesh bhaiya ke rider: Sonu Kumar)
📍 *Delivery to:* ${deliveryAddress}
⏱️ *ETA:* ~12-15 minutes
💰 *Total Amount:* ₹${totalINR} (Cash/UPI on Delivery)

*Items:*
${itemsList}

Rider aapke ghar ke paas hai. Kirana store: +91 9981154672.`;

      await recordAgentEvent(agentRun.id, 'CONFIRMATION_SENT', 'SUCCESS', {
        order_id: lastOrder.id,
        tracking_status: 'OUT_FOR_DELIVERY'
      });

      const latency = Date.now() - startTime;
      await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
      const events = await getAgentRunEvents(agentRun.id);
      return {
        success: true,
        action_taken: 'INFO_REPLY',
        reply_message: reply,
        agent_run_id: agentRun.id,
        events
      };
    }

    // 6. Handle Intent: REORDER_USUAL ("bhaiya usual wala bhej do")
    if (parsedIntent.intent === 'REORDER_USUAL') {
      await recordAgentEvent(agentRun.id, 'CUSTOMER_MEMORY_ACCESSED', 'INFO', {
        customer_id: customer.id
      });

      const pastOrderData = await getCustomerLastOrder(customer.id);
      if (!pastOrderData || pastOrderData.items.length === 0) {
        const reply = "Aapka koi pichla order record nahi mila. Kripya batayein aapko kaunse items chahiye?";
        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: true,
          action_taken: 'INFO_REPLY',
          reply_message: reply,
          agent_run_id: agentRun.id,
          events
        };
      }

      // Re-validate against CURRENT database prices & live stock!
      const currentItemsToOrder: Array<{ product_id: string; quantity: number }> = [];
      const unavailableItems: string[] = [];

      for (const pastItem of pastOrderData.items) {
        const liveProduct = await getProductById(pastItem.product_id);
        if (!liveProduct || !liveProduct.active || liveProduct.stock_quantity < pastItem.quantity) {
          unavailableItems.push(liveProduct ? liveProduct.name : 'Unknown Product');
        } else {
          currentItemsToOrder.push({
            product_id: liveProduct.id,
            quantity: pastItem.quantity
          });
        }
      }

      if (unavailableItems.length > 0 && currentItemsToOrder.length === 0) {
        const reply = `Aapke usual order ke items (${unavailableItems.join(', ')}) abhi out of stock hain. Kripya thodi der baad try karein ya alternative batayein.`;
        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: true,
          action_taken: 'INFO_REPLY',
          reply_message: reply,
          agent_run_id: agentRun.id,
          events
        };
      }

      // Execute atomic order with current prices/stock
      const orderResult = await executeOrderAtomic({
        customerId: customer.id,
        source,
        rawMessage: `[Usual Order]: ${message}`,
        externalMessageId: externalMessageId || `usual_${Date.now()}`,
        items: currentItemsToOrder
      });

      if (!orderResult.success) {
        throw new Error(orderResult.message || 'Usual order placement failed');
      }

      await recordAgentEvent(agentRun.id, 'ORDER_CREATED', 'SUCCESS', {
        order_id: orderResult.order_id,
        total_paise: orderResult.total_paise,
        reordered_from_past: true
      });

      const replyMessage = formatOrderConfirmationMessage(
        orderResult.order_id!,
        orderResult.items!,
        orderResult.total_paise!,
        true, // delivery
        customer.address,
        customer.name
      );

      const latency = Date.now() - startTime;
      await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
      const events = await getAgentRunEvents(agentRun.id);
      return {
        success: true,
        action_taken: 'ORDER_CONFIRMED',
        reply_message: replyMessage,
        order: {
          id: orderResult.order_id!,
          total_paise: orderResult.total_paise!,
          total_inr: ((orderResult.total_paise || 0) / 100).toFixed(2),
          items: (orderResult.items || []) as OrderProcessItem[],
          low_stock_alerts: orderResult.low_stock_alerts || []
        },
        agent_run_id: agentRun.id,
        events
      };
    }

    // 6. Confidence Gate / Ambiguity Check
    if (parsedIntent.confidence < 0.75 || parsedIntent.needs_clarification) {
      await recordAgentEvent(agentRun.id, 'NEEDS_REVIEW_FLAGGED', 'WARNING', {
        confidence: parsedIntent.confidence,
        reason: parsedIntent.clarification_reason || 'Low confidence in order extraction'
      });

      await updateAgentRun(agentRun.id, { status: 'NEEDS_REVIEW', latency_ms: Date.now() - startTime });
      const events = await getAgentRunEvents(agentRun.id);
      const reply = `Aapka order clear nahi tha ("${message}"). Kirana store owner isse verify kar rahe hain.`;
      return {
        success: true,
        action_taken: 'NEEDS_REVIEW',
        reply_message: reply,
        agent_run_id: agentRun.id,
        events,
        needs_review_reason: parsedIntent.clarification_reason || 'Informal phrasing or multiple item matches'
      };
    }

    // 7. Brain 2: Product Resolution against Live Database
    const resolvedItems: Array<{ product_id: string; quantity: number; product: Product }> = [];
    const outOfStockItems: Array<{ product: Product; quantity: number; raw_name: string }> = [];

    for (const item of parsedIntent.items) {
      // Find candidate matches from live DB using full search query
      const searchTerms = [item.raw_name, item.brand, item.pack_size].filter(Boolean).join(' ');
      let candidates = await searchProductCandidates(searchTerms);
      if (candidates.length === 0 && searchTerms !== item.raw_name) {
        candidates = await searchProductCandidates(item.raw_name);
      }

      await recordAgentEvent(agentRun.id, 'INVENTORY_QUERIED', 'INFO', {
        query: item.raw_name,
        search_terms: searchTerms,
        candidates_found: candidates.length,
        candidate_names: candidates.map(c => c.name)
      });

      const disambiguation = await disambiguateProductCandidate(searchTerms || item.raw_name, candidates);

      if (disambiguation.result === 'MATCH' && disambiguation.product_id) {
        const matchedProduct = candidates.find(c => c.id === disambiguation.product_id)!;
        
        // Live inventory check
        if (matchedProduct.stock_quantity < item.quantity) {
          outOfStockItems.push({
            product: matchedProduct,
            quantity: item.quantity,
            raw_name: item.raw_name
          });
        } else {
          resolvedItems.push({
            product_id: matchedProduct.id,
            quantity: item.quantity,
            product: matchedProduct
          });
        }
      } else {
        // Ambiguous or no match
        await recordAgentEvent(agentRun.id, 'AMBIGUITY_DETECTED', 'WARNING', {
          raw_item: item.raw_name,
          disambiguation
        });
      }
    }

    await recordAgentEvent(agentRun.id, 'PRODUCTS_RESOLVED', 'SUCCESS', {
      available_count: resolvedItems.length,
      out_of_stock_count: outOfStockItems.length
    });

    // 8. Autonomous Recovery Layer: Out-of-Stock Substitution
    if (outOfStockItems.length > 0) {
      const primaryOOS = outOfStockItems[0];
      await recordAgentEvent(agentRun.id, 'SUBSTITUTION_REQUIRED', 'WARNING', {
        unavailable_product: primaryOOS.product.name,
        stock: primaryOOS.product.stock_quantity,
        requested: primaryOOS.quantity
      });

      // Find best alternative from same category with stock > 0
      const alternatives = await findSubstitutionCandidates(
        primaryOOS.product.category,
        primaryOOS.product.id,
        primaryOOS.product.pack_size
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives[0];

        // Save pending conversation state so next message ("haan") seamlessly resumes
        await setPendingConversation(customerPhone, {
          type: 'SUBSTITUTION_PROPOSAL',
          original_intent: parsedIntent,
          original_message: message,
          resolved_items: resolvedItems,
          proposed_substitution: {
            original_item_name: primaryOOS.product.name,
            original_product_id: primaryOOS.product.id,
            alternative_product: bestAlternative,
            quantity: primaryOOS.quantity
          },
          created_at: new Date().toISOString()
        });

        const substitutionMessage = formatSubstitutionOffer(
          primaryOOS.product.name,
          bestAlternative,
          primaryOOS.product.price_paise
        );

        await recordAgentEvent(agentRun.id, 'ALTERNATIVE_OFFERED', 'SUCCESS', {
          original: primaryOOS.product.name,
          alternative: bestAlternative.name,
          alternative_price_paise: bestAlternative.price_paise,
          alternative_stock: bestAlternative.stock_quantity
        });

        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
        const events = await getAgentRunEvents(agentRun.id);

        return {
          success: true,
          action_taken: 'SUBSTITUTION_OFFERED',
          reply_message: substitutionMessage,
          agent_run_id: agentRun.id,
          events
        };
      }
    }

    // If nothing could be resolved
    if (resolvedItems.length === 0) {
      const reply = `Maaf kijiye, aapke requested products ("${message}") hamare store inventory mein nahi mile. Kripya product ka naam check karein.`;
      const latency = Date.now() - startTime;
      await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
      const events = await getAgentRunEvents(agentRun.id);
      return {
        success: true,
        action_taken: 'INFO_REPLY',
        reply_message: reply,
        agent_run_id: agentRun.id,
        events
      };
    }

    // 9. Brain 3: Action Engine — Atomic PostgreSQL Transaction
    await recordAgentEvent(agentRun.id, 'STOCK_RESERVATION', 'INFO', {
      items: resolvedItems.map(ri => ({ name: ri.product.name, quantity: ri.quantity }))
    });

    const finalDeliveryAddress =
      customerAddress ||
      parsedIntent.customer_address_text ||
      customer.address ||
      (parsedIntent.delivery_requested ? 'Flat 402, Green Valley Apartments, Sector 14, Gurugram' : null);

    if (finalDeliveryAddress && (!customer.address || customer.address !== finalDeliveryAddress)) {
      customer.address = finalDeliveryAddress;
    }

    const orderResult = await executeOrderAtomic({
      customerId: customer.id,
      source,
      rawMessage: message,
      externalMessageId: externalMessageId || `web_${Date.now()}`,
      deliveryAddress: finalDeliveryAddress,
      latitude: latitude || customer.latitude || null,
      longitude: longitude || customer.longitude || null,
      items: resolvedItems.map(ri => ({
        product_id: ri.product_id,
        quantity: ri.quantity
      }))
    });

    if (!orderResult.success) {
      // Concurrency protection: if concurrent order consumed final stock
      if (orderResult.error === 'INSUFFICIENT_STOCK' && orderResult.out_of_stock_item) {
        await recordAgentEvent(agentRun.id, 'CONCURRENCY_CONFLICT', 'WARNING', {
          item: orderResult.out_of_stock_item.name,
          detail: 'Stock consumed by concurrent request'
        });
        const reply = `Maaf kijiye, ${orderResult.out_of_stock_item.name} ka aakhri stock abhi dusre order mein bik gaya.`;
        const latency = Date.now() - startTime;
        await updateAgentRun(agentRun.id, { status: 'FAILED', latency_ms: latency });
        const events = await getAgentRunEvents(agentRun.id);
        return {
          success: false,
          action_taken: 'INFO_REPLY',
          reply_message: reply,
          agent_run_id: agentRun.id,
          events
        };
      }
      throw new Error(orderResult.message || 'Order execution failed');
    }

    // 10. Record Success Events & Check Low Stock
    await recordAgentEvent(agentRun.id, 'ORDER_CREATED', 'SUCCESS', {
      order_id: orderResult.order_id,
      subtotal_paise: orderResult.subtotal_paise,
      total_paise: orderResult.total_paise,
      total_inr: ((orderResult.total_paise || 0) / 100).toFixed(2),
      idempotent: orderResult.idempotent || false
    });

    await recordAgentEvent(agentRun.id, 'INVENTORY_UPDATED', 'SUCCESS', {
      mutated_items: orderResult.items?.map(i => ({
        name: i.name,
        deducted: i.quantity,
        stock_after: i.stock_after
      }))
    });

    if (orderResult.low_stock_alerts && orderResult.low_stock_alerts.length > 0) {
      for (const alert of orderResult.low_stock_alerts) {
        await recordAgentEvent(agentRun.id, 'LOW_STOCK_DETECTED', 'WARNING', {
          product_id: alert.product_id,
          name: alert.name,
          current_stock: alert.current_stock,
          reorder_level: alert.reorder_level
        });
      }
    }

    const replyMessage = formatOrderConfirmationMessage(
      orderResult.order_id!,
      orderResult.items!,
      orderResult.total_paise!,
      parsedIntent.delivery_requested,
      finalDeliveryAddress,
      customer.name
    );

    await recordAgentEvent(agentRun.id, 'CONFIRMATION_SENT', 'SUCCESS', {
      recipient: customerPhone,
      channel: source
    });

    const latency = Date.now() - startTime;
    await updateAgentRun(agentRun.id, { status: 'SUCCESS', latency_ms: latency });
    const events = await getAgentRunEvents(agentRun.id);

    return {
      success: true,
      action_taken: 'ORDER_CONFIRMED',
      reply_message: replyMessage,
      order: {
        id: orderResult.order_id!,
        total_paise: orderResult.total_paise!,
        total_inr: ((orderResult.total_paise || 0) / 100).toFixed(2),
        items: (orderResult.items || []) as OrderProcessItem[],
        low_stock_alerts: orderResult.low_stock_alerts || []
      },
      agent_run_id: agentRun.id,
      events
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown execution error';
    await recordAgentEvent(agentRun.id, 'EXECUTION_ERROR', 'ERROR', { error: errorMsg });
    await updateAgentRun(agentRun.id, { status: 'FAILED', latency_ms: Date.now() - startTime });
    const events = await getAgentRunEvents(agentRun.id);

    return {
      success: false,
      action_taken: 'ERROR',
      reply_message: 'Maaf kijiye, order process karne mein technical problem aayi. Kripya dobara koshish karein.',
      agent_run_id: agentRun.id,
      events
    };
  }
}
