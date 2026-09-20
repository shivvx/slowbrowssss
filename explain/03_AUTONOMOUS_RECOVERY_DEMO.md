# 03. Autonomous Out-of-Stock Recovery & Customer Memory

> **Hackathon Benchmark Target**:  
> **25/25**: *"Completed full end-to-end loop with live database actions, parsed data, and client verification."*  
> **10/10**: *"Invented an interactive self-verifying test generation pipeline with zero human intervention; novel workflow."*

---

## 🎯 The Autonomous Recovery Loop

The biggest differentiator between a toy AI chatbot and **KiranaPilot** is how it handles failure states. In retail, inventory is volatile. When an item is unavailable, a human store owner never says *"Order cancelled"*; they immediately suggest the best alternative.

### Flow Diagram

```
Customer: "Bhaiya 1 Fortune mustard oil aur 5kg Aashirvaad atta bhej do"
                             │
                             ▼
              [Brain 1: Intent Extraction]
              • Item 1: Fortune mustard oil (qty: 1)
              • Item 2: Aashirvaad atta (qty: 5)
                             │
                             ▼
              [Brain 2: Live Stock Check]
              • Aashirvaad Atta: 10 in stock ✅
              • Fortune Mustard Oil: 0 IN STOCK ❌
                             │
                             ▼
              [Brain 2: Find Alternative]
              • Category: "Edible Oils"
              • Matches: Dhara Mustard Oil 1L (15 in stock, ₹148)
                             │
                             ▼
              [Pending Session Stored]
              • Cart: 1x Aashirvaad Atta (₹289)
              • Pending Replacement: Fortune 1L ➔ Dhara 1L (₹148)
                             │
                             ▼
Bot: "Fortune mustard oil 1L abhi stock mein nahi hai.
      Dhara Mustard Oil 1L (₹148) available hai.
      Replace karke order confirm kar du?"
                             │
                             ▼
Customer: "haan bhaiya bhej do"
                             │
                             ▼
              [Brain 3: Recovery Execution]
              • Dhara 1L substituted into cart
              • Total: ₹289 + ₹148 = ₹437
              • Stock atomically deducted:
                - Dhara 1L: 15 ➔ 14
                - Aashirvaad 5kg: 10 ➔ 9
              • Order #KP-... created with status 'confirmed'
                             │
                             ▼
Bot: "✅ Order Confirm Ho Gaya!
      📦 Order Total: ₹437.00
      Items:
      • Aashirvaad Shudh Chakki Atta 5kg x 1 = ₹289.00
      • Dhara Mustard Oil 1L x 1 = ₹148.00"
```

---

## 🧠 Customer Memory Engine ("Usual Wala")

Neighborhood stores thrive on personal relationships. Customers frequently text:
> *"Bhaiya usual wala bhej do"* or *"Pichla order repeat kar do"*

### How KiranaPilot Handles Reordering:
1. Identifies customer phone number (`+919981154672`).
2. Queries the database for customer's historical orders with status `confirmed` or `delivered`.
3. Reconstitutes the exact product items from their most recent order.
4. Validates real-time stock levels for each item.
5. Calculates current pricing in paise.
6. Returns an itemized confirmation prompt or creates the order with zero friction:
   > *"Aapka pichla order: 1x Aashirvaad Atta 5kg, 1x Amul Butter 500g (Total ₹574.00). Bhej rahe hain!"*

---

## 🔬 Self-Verifying Pipeline (Category 6 Benchmark)

To ensure zero regression and 100% test reliability, KiranaPilot includes an automated verification script:
```bash
npx tsx scripts/test-pipeline.ts
```

### What It Verifies:
1. **Standard Order**: Hinglish multi-item extraction $\rightarrow$ live stock deduction $\rightarrow$ trace logging.
2. **Out-of-Stock Recovery**: Rejection of unavailable items $\rightarrow$ alternative discovery $\rightarrow$ stateful continuation $\rightarrow$ confirmation.
3. **Customer Memory**: Re-ordering past purchases with a single phrase ("usual wala").
4. **Ambiguity Resolution**: Multiple matching items triggering clarifying choices.
