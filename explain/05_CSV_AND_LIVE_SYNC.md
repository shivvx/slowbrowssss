# 05. CSV Catalog Sync, WhatsApp QR & Purelymail Integration

> **Implementation Details**: Real data ingestion, hardware-free WhatsApp integration, and automated transactional emails.

---

## 📊 1. Real CSV Catalog Sync

Kirana stores manage inventory through distributor spreadsheets or simple CSV files. KiranaPilot supports **full bi-directional CSV synchronization**:

### CSV Schema (`data/inventory_seed.csv`):
```csv
sku,name,brand,category,pack_size,mrp,price,cost_price,stock_quantity,reorder_level,aliases
OIL-DHARA-1L,Dhara Mustard Oil,Dhara,Edible Oils,1L,155,148,135,15,5,"mustard oil,sarson tel,sarson oil"
OIL-FORTUNE-1L,Fortune Mustard Oil,Fortune,Edible Oils,1L,160,150,138,0,5,"mustard oil,sarson tel,fortune tel"
ATTA-AASH-5KG,Aashirvaad Shudh Chakki Atta,Aashirvaad,Staples,5kg,310,289,260,10,4,"atta,gehu atta,wheat flour"
```

### Features:
1. **Live CSV Export**: Clicking **"Export CSV"** in the Inventory page instantly streams the entire live catalog from the database.
2. **Live CSV Import**: Store owners can upload a distributor CSV or paste CSV text directly into the modal to overwrite/update stock, pricing, and Hinglish aliases in real time.
3. **Paise Conversion**: All CSV rupee values (`148.00`) are automatically parsed and multiplied by 100 into integer paise (`14800`) to ensure 100% financial precision.

---

## 📱 2. WhatsApp QR Mechanism (No Costly Cloud API Required)

Kirana store owners cannot afford expensive WhatsApp Business Cloud API setup fees ($0.05/conversation + Meta verification hassles). KiranaPilot provides two complementary QR mechanisms:

### Mode A: WhatsApp Web Pairing QR
* Generates a pair code / QR code that connects KiranaPilot directly to the store's existing WhatsApp account.
* Eliminates Meta API overhead and allows the bot to run natively from the store's number.

### Mode B: Countertop Printable QR Poster
* Generates a high-resolution, printable countertop QR standee.
* When a customer walks into the store or visits, scanning the QR opens a direct WhatsApp chat:
  ```
  https://wa.me/919981154672?text=Bhaiya%20order%20likho:
  ```
* Displays store name (*Shree Ganesh General Store*), UPI payment ID, and helpline number.

---

## 📧 3. Purelymail SMTP Integration

KiranaPilot integrates directly with **Purelymail SMTP** using secure SSL on port 465:

* **Host**: `smtp.purelymail.com`
* **Port**: `465` (SSL/TLS)
* **Sender Address**: `slowbros@shivvx.in`
* **Automated Dispatches**:
  1. **Order Confirmation Invoices**: Sent to customers with itemized totals, delivery estimates, and payment status.
  2. **Low-Stock Warnings**: Sent to store management when inventory drops below `reorder_level`.
  3. **Daily Evening Tally (Khata)**: 1-click end-of-day reconciliation sent to `slowbros@shivvx.in` with cash collected, credit issued, and outstanding balances.
  4. **Owner Auth OTPs**: Instant 6-digit OTP delivery for secure phone login.

---

## 🔐 4. Store Owner Authentication (Phone + OTP)

* **Target Owner Phone**: `9981154672`
* **Pre-configured Master PIN / Fast Demo OTP**: `8817`
* **Email Verification**: Live OTPs are also dispatched directly via Purelymail to `slowbros@shivvx.in`.
* **Session Persistence**: Secured with HTTP-only cookies and cryptographic signatures.
