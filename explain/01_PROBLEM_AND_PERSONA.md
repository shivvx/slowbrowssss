# 01. Problem Understanding & User Persona

> **Hackathon Benchmark Target**:  
> **15/15**: *"We designed this specifically for a neighborhood supermarket owner who manages 150–200 credit customers and currently tracks them manually in paper diaries."*  
> **5/15**: *"Our AI platform helps businesses manage their finances."*

---

## 👤 The User Persona: Ramesh Kumar

* **Store**: *Shree Ganesh General Store*, Sector 14, Gurugram.
* **Format**: 350 sq. ft. neighborhood kirana store operating from 7:00 AM to 10:30 PM.
* **Customer Base**: 300+ households in a 1 km radius; **180 active credit (khata / udhar) customers**.
* **Daily Order Volume**:
  * 120 in-store walk-in customers.
  * **60 to 80 WhatsApp messages & voice notes daily** from neighborhood aunties, working professionals, and regulars.
* **Technology Comfort**: High comfort with WhatsApp and phone calls; zero tolerance for complex POS software, terminal commands, or typing long item names.

---

## 🚨 The Pain Points: A Day in the Life of Ramesh

### 1. The WhatsApp Chaos (During Rush Hours)
Between 8:00 AM – 10:30 AM and 6:30 PM – 9:00 PM, customers flood Ramesh's WhatsApp with messages like:
* *"Bhaiya 2 packet Fortune tel, 1 packet tata namak aur 5kg atta bhej do sham tak"*
* *"Ramesh bhai usual wala saman bhej do"*
* Audio voice note in Hinglish: *"Arre bhai 1 bread aur 2 packet amul taaza doodh bhejna"*

While attending to physical counter customers, Ramesh cannot reply in real time. Orders get missed, stock runs out, and angry customers call back.

### 2. The Out-of-Stock Dilemma
When Fortune mustard oil is out of stock, a dumb order taker either ignores the item or cancels the order.
In real kirana operations, **a lost item is a lost sale**. The owner wants to recommend:
> *"Bhaiya Fortune 1L nahi hai, Dhara 1L ₹148 mein hai. Bhej du?"*  
If done automatically, the store retains 100% of the customer's wallet share.

### 3. The 25-Minute Evening Diary Tallying Nightmare (Category 4 Focus)
At 10:30 PM, after closing the rolling shutter, Ramesh cannot go home.
* He sits with a worn-out **red paper diary (Bahi-Khata)**.
* He flips through 60 handwritten chits and WhatsApp chat logs.
* He manually scribbles: *"Sharma ji: ₹340 (Milk, Bread, Atta)"*, *"Verma ji: ₹1,250 (Oil, Rice, Dal)"*.
* **Average time spent**: **25 to 35 minutes every single night**.
* **Error Rate**: 5%–8% missed entries leading to **₹8,000 to ₹15,000 in monthly uncollected credit losses**.

---

## 💡 How KiranaPilot Solves This

1. **Zero-Click WhatsApp Store Operator**:
   Customers text or send voice notes in natural Hinglish. KiranaPilot resolves items, checks live database inventory, calculates totals in paise, and confirms orders immediately.
2. **Autonomous Stock Substitution**:
   Detects out-of-stock items, finds matching alternatives in the same category, and resumes the exact same order when the customer says *"haan"*.
3. **Kirana Khata Engine**:
   Every credit order is instantly logged to the customer's digital Khata.
4. **1-Click Evening Tally**:
   At 10:30 PM, Ramesh taps **"Send Evening Tally"** on the dashboard. In 2 seconds, a structured financial report with total sales, collected cash, outstanding udhar, and low stock warnings is emailed directly to `slowbros@shivvx.in`.
   **Time saved: 25 minutes every single night.**
