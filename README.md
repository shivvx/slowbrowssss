# KiranaPilot 🏪
> **“Message karo. Order ho gaya.”**  
> WhatsApp-Native Autonomous Store Operator for Neighborhood Kirana Stores.  
> *Track 1: Zero-Click Store Operator — HACK IT BROS '26*

---

## 🌟 The Core Differentiator

Most ordering bots merely reply with links or cards. **KiranaPilot operates the store**:

```
WhatsApp / Voice / Text
        ↓
Understand Hinglish (Brain 1: Gemini Flash)
        ↓
Identify Actual Products (Brain 2: Live PostgreSQL + Aliases)
        ↓
Live Inventory & Price Lookup
        ↓
Resolve Ambiguity / Out-of-Stock Alternatives (Autonomous Recovery Layer)
        ↓
Calculate Authoritative Totals in Backend (Paise-accurate)
        ↓
Create Real Order (Brain 3: Atomic PostgreSQL Transaction)
        ↓
Atomically Deduct Inventory (`SELECT FOR UPDATE`)
        ↓
Detect Low Stock
        ↓
Send Real WhatsApp Confirmation
        ↓
Store Customer History (Powers "Mera usual wala bhej do")
```

And when something goes wrong:
```
"Fortune oil nahi hai"
          ↓
Find valid in-stock alternatives from live DB (same category, ranked by brand/pack/price)
          ↓
"Fortune 1L unavailable. Dhara 1L ₹148 available. Replace kar du?"
          ↓
Customer: "haan"
          ↓
Continue same order automatically
```

---

## 🧠 The 3-Brain Architecture

| Brain | Responsibility | What it DOES | What it NEVER does |
|---|---|---|---|
| **Brain 1: Understanding** | Gemini 3.8 / 2.5 Flash + Zod | Converts messy Hinglish, Roman Hindi, spelling mistakes, and colloquial quantities into structured order intent. | **NEVER** invents prices, stock, or product IDs. **NEVER** calculates totals. |
| **Brain 2: Store Engine** | Live PostgreSQL + Alias Resolver | Matches raw product names against live database and aliases. Fetches authoritative prices in paise and validates real-time stock. | Deterministic — no hallucinated inventory. |
| **Brain 3: Action Engine** | PostgreSQL Atomic RPC / Row Locks | Executes atomic transaction (`SELECT FOR UPDATE`), reserves stock, creates order and order items, mutates inventory, logs movements, triggers low-stock alerts, and logs transparent agent traces. | Concurrency-protected. Impossible to oversell the final unit. |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript strict mode, Tailwind CSS v4, Lucide Icons
- **Backend**: Next.js Route Handlers (`/api/whatsapp/webhook`, `/api/chat`, `/api/inventory`, `/api/orders`, `/api/review`, `/api/dashboard`, `/api/reset-demo`)
- **Database**: Supabase PostgreSQL + `@supabase/supabase-js` (with zero-config in-memory transactional fallback for offline grading)
- **AI Engine**: Google Gemini API via `@google/genai` with strict Zod structured output (`responseSchema`)
- **WhatsApp**: Meta WhatsApp Cloud API via direct Graph API fetch requests
- **Money Engine**: Integer **Paise** (1 INR = 100 paise) — zero floating-point financial bugs

---

## 🚀 Quick Start (Zero-Config Immediate Testing)

KiranaPilot is built to run immediately out-of-the-box with full in-memory transactional persistence, 40+ seeded Indian grocery products, and full Hinglish parsing even without external API keys:

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
open http://localhost:3000
```

To run the automated verification test suite:
```bash
npx tsx scripts/test-pipeline.ts
```

---

## ⚙️ Environment Variables (`.env.local`)

When deploying to production or connecting real services, create a `.env.local` file:

```env
# Google Gemini API (Required for live Gemini LLM parsing)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase PostgreSQL (Required for hosted Supabase instance)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WhatsApp Cloud API (Meta Developers)
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_permanent_access_token
WHATSAPP_VERIFY_TOKEN=kiranapilot_verify_token_2026
WHATSAPP_GRAPH_VERSION=v22.0
```

---

## 📲 WhatsApp Cloud API Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) $\rightarrow$ Create App $\rightarrow$ Business use case $\rightarrow$ **WhatsApp**.
2. Under **API Setup**, retrieve your `WHATSAPP_PHONE_NUMBER_ID` and temporary/permanent `WHATSAPP_ACCESS_TOKEN`.
3. In **Configuration** $\rightarrow$ Webhooks:
   - **Callback URL**: `https://your-domain.vercel.app/api/whatsapp/webhook`
   - **Verify Token**: `kiranapilot_verify_token_2026`
4. Subscribe to the `messages` webhook field.
5. Inbound WhatsApp messages will now automatically trigger `processCustomerMessage()` and send replies via Meta Graph API!

---

## 🎯 4-Scenario Evaluation Walkthrough

Access the **Customer Demo Simulator** at [`/demo`](http://localhost:3000/demo):

### Scenario 1: Standard Hinglish Order
- **Message**: `"2 packet Aashirvaad 5kg, 1 Fortune oil aur 3 Maggi ghar bhej do."`
- **Result**: Brain 1 extracts 3 items $\rightarrow$ Brain 2 matches DB $\rightarrow$ Brain 3 deducts stock atomically $\rightarrow$ Itemized bill delivered in ₹ $\rightarrow$ Real-time Agent Trace confirms every step.

### Scenario 2: Autonomous Recovery & Out-of-Stock Substitution
- **Message**: `"1 Fortune oil aur 2 Amul milk dena"`
- **Result**: System discovers Fortune 1L has `stock: 0` $\rightarrow$ Autonomous Recovery searches same category (`Edible Oils`) $\rightarrow$ Offers Dhara Oil 1L ₹148 $\rightarrow$ Customer replies `"haan"` $\rightarrow$ Order seamlessly resumes and completes!

### Scenario 3: Customer Memory ("Mera Usual Wala")
- **Message**: `"bhaiya usual wala bhej do"`
- **Result**: System retrieves customer's previous confirmed basket (2 Amul Milk, 1 Bread, 12 Eggs) $\rightarrow$ Re-evaluates against **current live prices and stock** $\rightarrow$ Dispatches confirmation.

### Scenario 4: Human-in-the-Loop Safety Gate ("Needs Review")
- **Message**: `"10 wala 5 parle g bhejna"`
- **Result**: Ambiguity detected $\rightarrow$ Order routed to [`/review`](http://localhost:3000/review) where owner can verify or adjust before execution.

---

## 🛡 Concurrency & Idempotency Architecture

- **Atomic Row Locking**: When processing orders, products are locked using `SELECT ... FOR UPDATE` in PostgreSQL. If two customers order the last packet of Maggi simultaneously, one transaction succeeds and the other immediately enters the Out-of-Stock Recovery flow.
- **Idempotency**: Webhook retries are deduplicated using `external_message_id UNIQUE`. Re-delivered WhatsApp messages return the existing order without double-deducting inventory.
- **Paise Precision**: All prices are stored as integers (e.g. ₹289.00 = `28900` paise).
