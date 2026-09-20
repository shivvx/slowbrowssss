import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  OrderIntent,
  OrderIntentSchema,
  ProductDisambiguation,
  ProductDisambiguationSchema,
  Product
} from './types';

const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

const nvidiaApiKey = process.env.NVIDIA_NIM_API_KEY || '';
const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-flash-0731';

async function callNvidiaNimChat(systemPrompt: string, userMessage: string): Promise<any | null> {
  if (!nvidiaApiKey) return null;
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 600
      }),
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// =========================================================================
// 1. Brain 1: System Instruction & Structured Schema
// =========================================================================

const ORDER_UNDERSTANDING_SYSTEM_PROMPT = `You are the natural-language understanding component of KiranaPilot, an autonomous ordering system for Indian neighborhood kirana/general stores.

Your ONLY responsibility is to convert a customer's natural-language message into structured order intent.

Customers may communicate using:
- Hindi
- English
- Hinglish
- Roman Hindi
- spelling mistakes
- abbreviations
- local grocery terminology
- brand names
- informal quantities

Examples:
"2 maggie bhejdo"
"ashirwad ka 5 kilo atta 2 packet"
"1 litre fortune tel aur bread dena"
"mera usual wala bhej dena"
"kal wala same order"
"10 rupay wali parle g 5 dena"

IMPORTANT RULES:
1. NEVER invent product IDs.
2. NEVER invent inventory.
3. NEVER invent prices.
4. NEVER calculate the final bill.
5. NEVER claim an order was created.
6. Never assume a specific product variant when the customer message is genuinely ambiguous.
7. Preserve the customer's original product wording in raw_name.
8. Extract brand only when reasonably explicit.
9. Extract pack size only when mentioned or clearly implied.
10. Quantity refers to number of requested units/packs unless the language clearly says otherwise.
11. If the user asks for their previous/usual order, classify intent as REORDER_USUAL.
12. If critical information cannot be reliably interpreted, mark needs_clarification=true.
13. If the user is replying to confirm a substitution ("haan", "yes", "replace kar do", "theek hai"), classify intent as CONFIRM_SUBSTITUTION.
14. confidence must represent your confidence in the extracted intent, not confidence in inventory availability.`;

const GEMINI_INTENT_JSON_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        "PLACE_ORDER",
        "CHECK_AVAILABILITY",
        "CHECK_PRICE",
        "REORDER_USUAL",
        "MODIFY_PENDING_ORDER",
        "CONFIRM_SUBSTITUTION",
        "TRACK_ORDER",
        "CANCEL",
        "UNKNOWN"
      ]
    },
    language: {
      type: Type.STRING,
      enum: ["hi", "en", "hinglish", "unknown"]
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          raw_name: { type: Type.STRING },
          brand: { type: Type.STRING, nullable: true },
          quantity: { type: Type.NUMBER },
          requested_unit: { type: Type.STRING, nullable: true },
          pack_size: { type: Type.STRING, nullable: true }
        },
        required: ["raw_name", "quantity"]
      }
    },
    delivery_requested: { type: Type.BOOLEAN },
    customer_address_text: { type: Type.STRING, nullable: true },
    needs_clarification: { type: Type.BOOLEAN },
    clarification_reason: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER }
  },
  required: [
    "intent",
    "language",
    "items",
    "delivery_requested",
    "needs_clarification",
    "confidence"
  ]
};

// =========================================================================
// 2. Parse Order Intent via Gemini Flash or NVIDIA NIM (Brain 1)
// =========================================================================

export async function parseOrderIntent(messageText: string): Promise<OrderIntent> {
  const trimmed = messageText.trim();

  // 1. If Gemini API Key is present and not an OAuth token, call Google GenAI
  if (aiClient && !apiKey.startsWith('AQ.')) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Customer Message: "${trimmed}"` }]
          }
        ],
        config: {
          systemInstruction: ORDER_UNDERSTANDING_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_INTENT_JSON_SCHEMA,
          temperature: 0.1
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const validated = OrderIntentSchema.parse(parsed);
      return validated;
    } catch (error) {
      console.warn('Gemini API call failed, trying NVIDIA NIM:', error);
    }
  }

  // 2. Try NVIDIA NIM (Cloud LLM DeepSeek V4 Flash)
  const nimSystemPrompt = `${ORDER_UNDERSTANDING_SYSTEM_PROMPT}\nReturn ONLY a JSON object matching this schema:
{
  "intent": "PLACE_ORDER" | "CHECK_AVAILABILITY" | "CHECK_PRICE" | "REORDER_USUAL" | "MODIFY_PENDING_ORDER" | "CONFIRM_SUBSTITUTION" | "CANCEL" | "UNKNOWN",
  "language": "hi" | "en" | "hinglish" | "unknown",
  "items": [{ "raw_name": string, "brand": string | null, "quantity": number, "requested_unit": string | null, "pack_size": string | null }],
  "delivery_requested": boolean,
  "customer_address_text": string | null,
  "needs_clarification": boolean,
  "clarification_reason": string | null,
  "confidence": number
}`;
  const nimResult = await callNvidiaNimChat(nimSystemPrompt, `Customer Message: "${trimmed}"`);
  if (nimResult) {
    try {
      const validated = OrderIntentSchema.parse(nimResult);
      return validated;
    } catch (e) {
      console.warn('NVIDIA NIM schema parse error, falling back to local Hinglish parser:', e);
    }
  }

  // 3. Fallback intelligent Hinglish parser for offline / zero-latency execution
  return fallbackHinglishParser(trimmed);
}

// =========================================================================
// 3. Product Candidate Disambiguator (Brain 2)
// =========================================================================

export async function disambiguateProductCandidate(
  rawCustomerProduct: string,
  candidates: Product[]
): Promise<ProductDisambiguation> {
  if (candidates.length === 0) {
    return {
      result: 'NO_MATCH',
      product_id: null,
      confidence: 0,
      reason: 'No matching products found in database'
    };
  }

  if (candidates.length === 1) {
    return {
      result: 'MATCH',
      product_id: candidates[0].id,
      confidence: 0.95,
      reason: `Direct single candidate match: ${candidates[0].name}`
    };
  }

  if (aiClient && !apiKey.startsWith('AQ.')) {
    try {
      const candidateSummary = candidates.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        pack_size: c.pack_size,
        category: c.category
      }));

      const prompt = `A customer requested: "${rawCustomerProduct}"
The database returned these candidate products:
${JSON.stringify(candidateSummary, null, 2)}

You MUST select only from the provided candidate IDs.
Never invent product IDs or products.
If exactly one candidate is strongly supported, return MATCH and its product_id.
If multiple candidates remain plausible, return AMBIGUOUS.
If none fit, return NO_MATCH.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              result: { type: Type.STRING, enum: ["MATCH", "AMBIGUOUS", "NO_MATCH"] },
              product_id: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["result", "confidence", "reason"]
          },
          temperature: 0.1
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return ProductDisambiguationSchema.parse(parsed);
    } catch (e) {
      console.warn('Gemini product disambiguation failed, using heuristic match:', e);
    }
  }

  // Heuristic disambiguation with token scoring
  const rawLower = rawCustomerProduct.toLowerCase();
  const rawClean = rawLower.replace(/[^\w\s]/g, ' ');
  const rawTokens = rawClean.split(' ').filter(t => t.length > 1);

  const scored = candidates.map(c => {
    let score = 0;
    const cText = `${c.name} ${c.brand || ''} ${c.category} ${c.pack_size || ''}`.toLowerCase();
    
    for (const t of rawTokens) {
      if (cText.includes(t)) score += 10;
      if (c.brand && c.brand.toLowerCase() === t) score += 15;
    }
    if (c.pack_size && rawLower.includes(c.pack_size.toLowerCase())) score += 20;

    // Distinguish multipack (e.g. "4-Pack") vs standard single pack (e.g. "70g"):
    const isMultipack = c.name.toLowerCase().includes('4-pack') || c.name.toLowerCase().includes('4 pack') || c.name.toLowerCase().includes('multipack');
    const userMentionedMultipack = rawLower.includes('4') || rawLower.includes('four') || rawLower.includes('pack');
    if (isMultipack && !userMentionedMultipack) {
      score -= 15; // penalize multipack if user didn't ask for it
    } else if (isMultipack && userMentionedMultipack) {
      score += 25; // boost multipack when user specifically mentioned 4 or pack
    }

    return { candidate: c, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.candidate.stock_quantity - a.candidate.stock_quantity;
  });

  if (scored.length > 0 && scored[0].score >= 20) {
    const top = scored[0];
    const second = scored[1];
    if (!second || top.score > second.score || (top.score === second.score && top.candidate.stock_quantity > 0) || (top.score === second.score && top.candidate.id)) {
      return {
        result: 'MATCH',
        product_id: top.candidate.id,
        confidence: 0.92,
        reason: `Matched candidate ${top.candidate.name} (score ${top.score})`
      };
    }
  }

  return {
    result: 'AMBIGUOUS',
    product_id: null,
    confidence: 0.6,
    reason: `Multiple candidates found (${candidates.length}) requiring customer clarification`
  };
}

// =========================================================================
// 4. Natural Hinglish Clarification & Substitution Copy Generator
// =========================================================================

export function formatSubstitutionOffer(
  originalItemName: string,
  alternativeProduct: Product,
  originalPricePaise?: number
): string {
  const altPriceINR = (alternativeProduct.price_paise / 100).toFixed(0);
  let priceNote = `₹${altPriceINR} available hai.`;
  
  if (originalPricePaise && originalPricePaise > 0) {
    const diffPaise = alternativeProduct.price_paise - originalPricePaise;
    if (diffPaise < 0) {
      priceNote = `₹${altPriceINR} available hai (₹${Math.abs(diffPaise / 100).toFixed(0)} cheaper).`;
    } else if (diffPaise > 0) {
      priceNote = `₹${altPriceINR} available hai (₹${(diffPaise / 100).toFixed(0)} difference).`;
    }
  }

  return `${originalItemName} abhi out of stock hai. ${alternativeProduct.name} ${priceNote} Replace kar du?`;
}

export function formatOrderConfirmationMessage(
  orderId: string,
  items: Array<{ name: string; quantity: number; unit_price_paise: number; line_total_paise: number }>,
  totalPaise: number,
  deliveryRequested: boolean,
  deliveryAddress?: string | null,
  customerName?: string | null
): string {
  const lines: string[] = [];
  const greeting = customerName && customerName !== 'Customer' ? `Namaste ${customerName} ji! 🙏\n\n` : `Namaste! 🙏\n\n`;
  lines.push(`${greeting}✅ *Order Confirmed!* (Order #${orderId.slice(-6).toUpperCase()})\n`);
  
  for (const item of items) {
    const unitINR = (item.unit_price_paise / 100).toFixed(0);
    const lineINR = (item.line_total_paise / 100).toFixed(0);
    lines.push(`• ${item.quantity} × ${item.name} (@ ₹${unitINR}) = *₹${lineINR}*`);
  }

  const totalINR = (totalPaise / 100).toFixed(2);
  lines.push(`\n💰 *Total Amount:* ₹${totalINR}`);
  if (deliveryRequested) {
    lines.push(`🚚 *Delivery:* Home Delivery`);
    if (deliveryAddress) {
      lines.push(`📍 *Deliver to:* ${deliveryAddress}`);
    }
    lines.push(`⏱️ *ETA:* ~15-20 minutes (Ramesh bhaiya is packing your items)`);
  } else {
    lines.push(`🚚 *Delivery:* Store Pickup (Ramesh Kirana Store)`);
  }
  const trackingUrl = `https://slowbrowssss.vercel.app/orders/${orderId}`;
  lines.push(`\n🗺️ *Live Order Tracking & Bill:*\n${trackingUrl}`);
  lines.push(`📱 *Track on WhatsApp:* Reply "track" anytime for live status updates.`);
  lines.push(`\nDhanyawad! KiranaPilot ke saath aapka order place ho gaya hai.`);

  return lines.join('\n');
}

// =========================================================================
// 5. Intelligent Fallback Parser (Robust Zero-Config Engine)
// =========================================================================

function fallbackHinglishParser(text: string): OrderIntent {
  const lower = text.toLowerCase().trim();

  // 1. Reorder Usual (Check first: "usual", "pichla", "kal wala", "repeat", etc.)
  if (
    lower.includes('usual') ||
    lower.includes('kal wala') ||
    lower.includes('pichla') ||
    lower.includes('purana') ||
    lower.includes('last time') ||
    lower.includes('repeat') ||
    lower.includes('same order') ||
    lower.includes('mangwaya tha')
  ) {
    return {
      intent: 'REORDER_USUAL',
      language: 'hinglish',
      items: [],
      delivery_requested: lower.includes('ghar') || lower.includes('bhej'),
      customer_address_text: null,
      needs_clarification: false,
      clarification_reason: null,
      confidence: 0.95
    };
  }

  // 2. Confirm Substitution (Affirmative replies only)
  const confirmWords = ['haan', 'yes', 'ha', 'theek hai', 'thik hai', 'thik h', 'replace kar do', 'replace kar du', 'replace kardo', 'replace kar dena', 'chalega'];
  if (confirmWords.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w))) {
    return {
      intent: 'CONFIRM_SUBSTITUTION',
      language: 'hinglish',
      items: [],
      delivery_requested: false,
      customer_address_text: null,
      needs_clarification: false,
      clarification_reason: null,
      confidence: 0.98
    };
  }

  // 3. Track Order / Status Inquiry
  if (
    lower.includes('track') ||
    lower.includes('status') ||
    lower.includes('kahan hai') ||
    lower.includes('kahan tak') ||
    lower.includes('kab aayega') ||
    lower.includes('kab tak') ||
    lower.includes('aaya nahi') ||
    lower.includes('order update')
  ) {
    return {
      intent: 'TRACK_ORDER',
      language: 'hinglish',
      items: [],
      delivery_requested: false,
      customer_address_text: null,
      needs_clarification: false,
      clarification_reason: null,
      confidence: 0.95
    };
  }

  // Extract address if mentioned in message
  let extractedAddress: string | null = null;
  const addrMatch = text.match(/(?:address|deliver to|deliver at|location|flat|sector|house no)\s*[:\-]?\s*([^,\n]+(?:,[^,\n]+){0,3})/i);
  if (addrMatch) {
    extractedAddress = addrMatch[0].replace(/^(?:address|deliver to|deliver at|location)\s*[:\-]?\s*/i, '').trim();
  }

  // Typo normalization for robust parsing
  const normalized = lower
    .replace(/\b(ashirwad|aashirwad)\b/g, 'aashirvaad')
    .replace(/\b(ata|aata)\b/g, 'atta')
    .replace(/\b(maggie|magi)\b/g, 'maggi')
    .replace(/\b(minit|min)\b/g, 'minute')
    .replace(/\b(sarson\s+tel|sarso\s+tel|sarson\s+oil|sarso\s+oil)\b/g, 'sarson tel')
    .replace(/\b(tel)\b/g, 'oil');

  // 4. Extraction Patterns for Grocery Items (Multi-line, Bulleted, or Delimited)
  const deliveryRequested =
    lower.includes('ghar') ||
    lower.includes('deliver') ||
    lower.includes('bhej dena') ||
    lower.includes('bhejna') ||
    lower.includes('bhejdo') ||
    lower.includes('bhej do');

  const items: OrderIntent['items'] = [];

  // Split by newlines, bullet points (•), dashes (-), asterisks (*), numbered items (1., 2.), commas, "aur", "and", "+"
  const rawParts = normalized.split(/\r?\n|[•\*\-]|\b(?:\d+\.)\s*|,|(?:\baur\b)|(?:\band\b)|\+/g);

  // Common conversational filler / greeting phrases to ignore
  const fillerPatterns = [
    /^namaste/i,
    /^hello/i,
    /^hi\b/i,
    /^bhaiya\b/i,
    /^mujhe\s+(?:ye\s+)?samaan\s+chahiye/i,
    /^ye\s+samaan\s+chahiye/i,
    /^samaan\s+chahiye/i,
    /^order\s+(?:likho|lena|karna)/i,
    /^ghar\s+bhej\s+(?:do|dena|dijiye)/i,
    /^jaldi\s+bhej\s+(?:do|dena)/i,
    /^please\b/i,
    /^dhanyawad/i,
    /^shukriya/i,
    /^thank/i
  ];

  for (const rawPart of rawParts) {
    let part = rawPart.trim();
    if (!part || part.length < 2) continue;

    // Check if this line is purely a conversational greeting/closing
    const isFiller = fillerPatterns.some(p => p.test(part));
    if (isFiller && !part.match(/\d+/) && !part.match(/(?:doodh|milk|oil|tel|atta|bread|maggi|sugar|chini|namak|dal|rice|chawal|butter|eggs|ande)/i)) {
      continue;
    }

    // Detect pack size: weights, volumes, trays, multi-packs
    let packSize: string | null = null;
    const sizeMatch = part.match(/(\d+\s*(?:kg|kilo|l|litre|liter|ml|g|gm|tray|pack\b|-pack))/i);
    if (sizeMatch && !sizeMatch[0].match(/packet/i)) {
      packSize = sizeMatch[1].replace(/\s+/g, '');
    }

    // Detect quantity
    let qty = 1;
    const wordNumMatch = part.match(/\b(ek|do|teen|chaar|panch|paanch|chhe|saat|aath|nau|das)\b/i);

    if (wordNumMatch) {
      const map: Record<string, number> = {
        ek: 1, do: 2, teen: 3, chaar: 4, panch: 5, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10
      };
      qty = map[wordNumMatch[1].toLowerCase()] || 1;
    } else {
      const allNums = [...part.matchAll(/\b(\d+)\b/g)].map(m => parseInt(m[1], 10));
      if (allNums.length === 1) {
        // If single number is part of pack size (e.g. "5kg atta", "12 pack eggs tray") -> qty = 1
        if (packSize && (packSize.includes('kg') || packSize.includes('kilo') || packSize.includes('pack') || packSize.includes('tray'))) {
          qty = 1;
        } else {
          qty = allNums[0];
        }
      } else if (allNums.length >= 2) {
        // E.g. "2 packet 4-pack noodles" or "2 packet 5kg atta" -> first number is qty
        qty = allNums[0];
      }
    }

    // Detect brand
    let brand: string | null = null;
    if (part.includes('aashirvaad') || part.includes('ashirwad')) brand = 'Aashirvaad';
    else if (part.includes('fortune')) brand = 'Fortune';
    else if (part.includes('dhara')) brand = 'Dhara';
    else if (part.includes('saffola')) brand = 'Saffola';
    else if (part.includes('amul')) brand = 'Amul';
    else if (part.includes('mother dairy')) brand = 'Mother Dairy';
    else if (part.includes('maggi') || part.includes('maggie')) brand = 'Maggi';
    else if (part.includes('parle')) brand = 'Parle';
    else if (part.includes('tata')) brand = 'Tata';
    else if (part.includes('surf')) brand = 'Surf Excel';
    else if (part.includes('vim')) brand = 'Vim';
    else if (part.includes('dettol')) brand = 'Dettol';
    else if (part.includes('colgate')) brand = 'Colgate';
    else if (part.includes('harvest gold')) brand = 'Harvest Gold';
    else if (part.includes('britannia')) brand = 'Britannia';

    // Clean raw product name (strip quantity numbers and filler words)
    const cleanedRaw = part
      .replace(/\b(namaste|bhaiya|mujhe|ye|samaan|chahiye|ghar|bhej|dena|bhejna|bhejdo|laana|packet|packets|kilo|kg|litre|liter|l|ml|wale|wali|ka|ki|ke|ek|do|teen|chaar|panch|paanch|please)\b/gi, '')
      .replace(/^\s*\d+\s*(?:packet|packets|pack)?\s*/i, '') // strip leading quantity digits & units
      .replace(/[•\*\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedRaw.length > 1) {
      items.push({
        raw_name: cleanedRaw,
        brand,
        quantity: qty,
        requested_unit: packSize ? null : 'unit',
        pack_size: packSize
      });
    }
  }

  // Ambiguity check: e.g. "10 wala 5 parle g bhejna"
  const isAmbiguous = lower.includes('wala') && items.some(i => i.raw_name.includes('parle') || i.quantity > 20);

  return {
    intent: items.length > 0 ? 'PLACE_ORDER' : 'UNKNOWN',
    language: 'hinglish',
    items,
    delivery_requested: deliveryRequested,
    customer_address_text: extractedAddress,
    needs_clarification: isAmbiguous,
    clarification_reason: isAmbiguous ? 'Price/pack size ambiguity in informal request' : null,
    confidence: isAmbiguous ? 0.65 : 0.92
  };
}
