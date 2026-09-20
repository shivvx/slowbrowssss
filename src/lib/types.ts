import { z } from 'zod';

// ==========================================
// 1. Gemini Structured Output Schemas
// ==========================================

export const OrderItemIntentSchema = z.object({
  raw_name: z.string().describe("Customer's exact raw product phrase, e.g. 'Aashirvaad atta' or 'Fortune tel'"),
  brand: z.string().nullable().describe("Extracted brand if mentioned, e.g. 'Aashirvaad', 'Fortune', 'Amul', or null"),
  quantity: z.number().positive().describe("Requested quantity in units/packs"),
  requested_unit: z.string().nullable().describe("Requested unit if mentioned, e.g. 'packet', 'litre', 'kilo', 'piece', or null"),
  pack_size: z.string().nullable().describe("Specific pack size if mentioned, e.g. '5kg', '1L', '500ml', or null")
});

export const OrderIntentSchema = z.object({
  intent: z.enum([
    "PLACE_ORDER",
    "CHECK_AVAILABILITY",
    "CHECK_PRICE",
    "REORDER_USUAL",
    "MODIFY_PENDING_ORDER",
    "CONFIRM_SUBSTITUTION",
    "TRACK_ORDER",
    "CANCEL",
    "GREETING",
    "UNKNOWN"
  ]).describe("Classified intent of the customer message"),

  language: z.enum([
    "hi",
    "en",
    "hinglish",
    "unknown"
  ]).describe("Language detected in the message"),

  items: z.array(OrderItemIntentSchema).describe("List of grocery items extracted from message"),

  delivery_requested: z.boolean().describe("True if customer requested home delivery ('ghar bhej do', 'deliver karna')"),

  customer_address_text: z.string().nullable().describe("Address mentioned in message, if any"),

  needs_clarification: z.boolean().describe("True if information is too vague or ambiguous to process safely"),

  clarification_reason: z.string().nullable().describe("Reason for clarification if needed"),

  confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0")
});

export type OrderIntent = z.infer<typeof OrderIntentSchema>;
export type OrderItemIntent = z.infer<typeof OrderItemIntentSchema>;

// Product Disambiguation Schema for constrained selection
export const ProductDisambiguationSchema = z.object({
  result: z.enum(["MATCH", "AMBIGUOUS", "NO_MATCH"]),
  product_id: z.string().nullable().describe("Selected product ID from candidates list, or null if ambiguous/no match"),
  confidence: z.number().min(0).max(1),
  reason: z.string().describe("Concise internal reason for choice")
});

export type ProductDisambiguation = z.infer<typeof ProductDisambiguationSchema>;

// ==========================================
// 2. Database Models
// ==========================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string;
  variant: string | null;
  pack_size: string | null;
  price_paise: number;
  stock_quantity: number;
  reorder_level: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAlias {
  id: string;
  product_id: string;
  alias: string;
  normalized_alias: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  language: string | null;
  substitution_preference: 'AUTO_ACCEPT' | 'ASK' | 'NO_SUBSTITUTE' | string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  source: 'whatsapp' | 'web_demo' | 'voice';
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'NEEDS_REVIEW' | 'CANCELLED' | 'DELIVERED';
  subtotal_paise: number;
  total_paise: number;
  raw_message: string;
  external_message_id: string | null;
  delivery_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  delivery_notes?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  substituted_for_product_id: string | null;
  product?: Product;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  order_id: string | null;
  type: 'ORDER_SALE' | 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'ORDER_CANCEL';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  created_at: string;
  product?: Product;
}

export interface AgentRun {
  id: string;
  customer_id: string | null;
  source: string;
  raw_input: string;
  intent: string | null;
  confidence: number | null;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'NEEDS_REVIEW' | 'FAILED';
  latency_ms: number | null;
  created_at: string;
}

export interface AgentEvent {
  id: string;
  agent_run_id: string;
  step: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface PendingConversation {
  id: string;
  customer_phone: string;
  pending_state: {
    type: 'SUBSTITUTION_PROPOSAL' | 'CLARIFICATION';
    original_intent: OrderIntent;
    original_message: string;
    resolved_items: Array<{
      product_id: string;
      quantity: number;
      product: Product;
    }>;
    proposed_substitution?: {
      original_item_name: string;
      original_product_id: string;
      alternative_product: Product;
      quantity: number;
    };
    created_at: string;
  };
  expires_at: string;
  updated_at: string;
}

// ==========================================
// 3. Execution & Orchestration Results
// ==========================================

export interface OrderProcessItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  stock_after: number;
  is_substitution?: boolean;
  original_product_name?: string;
}

export interface LowStockAlert {
  product_id: string;
  name: string;
  current_stock: number;
  reorder_level: number;
}

export interface ProcessMessageResult {
  success: boolean;
  action_taken: 'ORDER_CONFIRMED' | 'SUBSTITUTION_OFFERED' | 'CLARIFICATION_REQUIRED' | 'NEEDS_REVIEW' | 'INFO_REPLY' | 'ERROR';
  reply_message: string;
  order?: {
    id: string;
    total_paise: number;
    total_inr: string;
    items: OrderProcessItem[];
    low_stock_alerts: LowStockAlert[];
  };
  agent_run_id: string;
  events: AgentEvent[];
  needs_review_reason?: string;
}
