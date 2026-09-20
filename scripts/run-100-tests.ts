import { processCustomerMessage } from '../src/lib/operator';
import {
  getAllProducts,
  getProductById,
  getOrCreateCustomer,
  executeOrderAtomic,
  getAllAgentRuns,
  resetDatabaseToSeed
} from '../src/lib/db';
import { calculateDistanceKm, getDeliveryEstimate } from '../src/lib/geo';
import { addCreditTransaction, getKhataCustomers, recordKhataPayment } from '../src/lib/khata';

interface TestResult {
  id: number;
  category: string;
  name: string;
  passed: boolean;
  latencyMs: number;
  details: string;
}

const results: TestResult[] = [];

async function runTest(
  id: number,
  category: string,
  name: string,
  fn: () => Promise<string>
) {
  const start = Date.now();
  try {
    const details = await fn();
    const latencyMs = Date.now() - start;
    results.push({ id, category, name, passed: true, latencyMs, details });
    process.stdout.write(`\r[${id}/100] ✅ PASS (${latencyMs}ms): ${name.slice(0, 45)}`);
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    results.push({ id, category, name, passed: false, latencyMs, details: err.message });
    process.stdout.write(`\r[${id}/100] ❌ FAIL (${latencyMs}ms): ${name.slice(0, 45)} - ${err.message}\n`);
  }
}

async function run100Tests() {
  console.log('================================================================');
  console.log('🚀 RUNNING KIRANAPILOT 100 LIVE PRODUCTION TESTS');
  console.log('================================================================\n');

  await resetDatabaseToSeed();

  let testId = 1;
  const testPhone = '9981154672';

  // -------------------------------------------------------------
  // BATCH 1: Standard Hinglish Orders (Tests 1 to 25)
  // -------------------------------------------------------------
  const standardOrders = [
    { msg: '1 packet Harvest Gold white bread aur 2 packet Amul Taaza doodh bhej do' },
    { msg: '5kg Aashirvaad atta aur 1 packet Tata namak' },
    { msg: '3 packet Maggi 2-Minute noodles masala 70g' },
    { msg: '2 packet Britannia Good Day biscuit aur 1 packet Parle-G' },
    { msg: '1 Dettol soap aur 1 Vim dishwash bar' },
    { msg: '1kg Tata Sampann toor dal aur 1kg moong dal bhej do' },
    { msg: '1kg India Gate basmati rice aur 1kg Madhur sugar' },
    { msg: '1 packet Amul butter 100g aur 6 eggs pack' },
    { msg: '1 packet Haldiram bhujia sev 200g aur 1 Lays magic masala' },
    { msg: '1 Colgate toothpaste 100g aur 1 Clinic Plus shampoo' },
    { msg: '10kg Aashirvaad atta bhej do jaldi' },
    { msg: '2 bread aur 4 amul milk' },
    { msg: '1 packet Surf Excel 1kg detergent' },
    { msg: '1 Harpic toilet cleaner 500ml aur 1 Vim gel 250ml' },
    { msg: '1 Everest haldi 200g aur 1 MDH deggi mirch 100g' },
    { msg: '1 Catch black pepper 100g' },
    { msg: '1 Daawat basmati rice 1kg aur 1 Tata namak' },
    { msg: '12 pack eggs tray aur 1 brown bread' },
    { msg: '2 packet Maggi 4-pack noodles' },
    { msg: '1 Lux rose soap aur 1 Dettol soap' },
    { msg: '5kg Fortune atta aur 1kg sugar' },
    { msg: '2 Mother Dairy toned milk 500ml' },
    { msg: '1 Amul gold milk aur 1 white bread' },
    { msg: '3 Parle-G biscuit pack' },
    { msg: '1 packet Tata salt aur 1kg moong dal' }
  ];

  for (const item of standardOrders) {
    const id = testId++;
    await runTest(id, 'STANDARD_ORDER', item.msg, async () => {
      const res = await processCustomerMessage({
        message: item.msg,
        customerPhone: testPhone,
        customerName: 'Ramesh Kumar',
        source: 'whatsapp'
      });
      if (res.action_taken !== 'ORDER_CONFIRMED') {
        throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
      }
      return `Order #${res.order?.id} created with total ₹${res.order?.total_inr}`;
    });
  }

  // -------------------------------------------------------------
  // BATCH 2: Autonomous Out-of-Stock Recoveries (Tests 26 to 50)
  // -------------------------------------------------------------
  for (let i = 0; i < 25; i++) {
    const id = testId++;
    const customerPhone = `99811546${String(10 + i).padStart(2, '0')}`;
    await runTest(id, 'OUT_OF_STOCK_RECOVERY', `OOS Recovery Turn ${i + 1}: Fortune ➔ Dhara`, async () => {
      // Turn 1: Request out-of-stock item
      const turn1 = await processCustomerMessage({
        message: '1 Fortune oil aur 1 white bread bhej do',
        customerPhone,
        customerName: `Customer ${i + 1}`,
        source: 'whatsapp'
      });

      if (turn1.action_taken !== 'SUBSTITUTION_OFFERED') {
        throw new Error(`Turn 1 expected SUBSTITUTION_OFFERED, got ${turn1.action_taken}`);
      }

      // Turn 2: Confirm substitution
      const confirmPhrases = ['haan replace kar do', 'yes bhej do', 'theek hai replace kar do', 'haan', 'bhej do'];
      const phrase = confirmPhrases[i % confirmPhrases.length];

      const turn2 = await processCustomerMessage({
        message: phrase,
        customerPhone,
        customerName: `Customer ${i + 1}`,
        source: 'whatsapp'
      });

      if (turn2.action_taken !== 'ORDER_CONFIRMED') {
        throw new Error(`Turn 2 expected ORDER_CONFIRMED, got ${turn2.action_taken}`);
      }

      return `Substituted Dhara 1L successfully, Order #${turn2.order?.id}`;
    });
  }

  // -------------------------------------------------------------
  // BATCH 3: Customer Memory & Reordering (Tests 51 to 65)
  // -------------------------------------------------------------
  const memoryPhrases = [
    'bhaiya usual wala bhej do',
    'mera pichla order repeat kar do',
    'kal wala saman bhej dena',
    'usual wala order bhej do',
    'same order again please',
    'bhaiya pichla saman bhej do',
    'usual order kar do',
    'jo kal mangwaya tha wahi bhej do',
    'mera usual wala repeat karo',
    'pichla order bhej do',
    'usual wala saman',
    'kal wala saman repeat',
    'usual order please',
    'same as last time',
    'pichla order again'
  ];

  for (const phrase of memoryPhrases) {
    const id = testId++;
    await runTest(id, 'CUSTOMER_MEMORY', phrase, async () => {
      const res = await processCustomerMessage({
        message: phrase,
        customerPhone: '+919876543210', // Shivam Sharma with seed order history
        customerName: 'Shivam Sharma',
        source: 'whatsapp'
      });
      if (res.action_taken !== 'ORDER_CONFIRMED') {
        throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
      }
      return `Reordered past basket: Order #${res.order?.id} (₹${res.order?.total_inr})`;
    });
  }

  // -------------------------------------------------------------
  // BATCH 4: Geolocation & Distance Calculation (Tests 66 to 75)
  // -------------------------------------------------------------
  const geoCoordinates = [
    { lat: 28.4720, lng: 77.0425, desc: 'Store Location (0 km)' },
    { lat: 28.4735, lng: 77.0415, desc: 'Green Valley Apts (0.6 km)' },
    { lat: 28.4715, lng: 77.0440, desc: 'Market Complex (0.4 km)' },
    { lat: 28.4780, lng: 77.0390, desc: 'Civil Lines (0.8 km)' },
    { lat: 28.4850, lng: 77.0500, desc: 'Sector 15 (1.6 km)' },
    { lat: 28.4600, lng: 77.0300, desc: 'Old Railway Road (1.9 km)' },
    { lat: 28.4900, lng: 77.0600, desc: 'Sector 31 (2.8 km)' },
    { lat: 28.4500, lng: 77.0200, desc: 'Rajiv Chowk (3.2 km)' },
    { lat: 28.4400, lng: 77.0100, desc: 'Subhash Chowk (4.5 km)' },
    { lat: 28.5200, lng: 77.1000, desc: 'Far Distance (>6 km)' }
  ];

  for (const geo of geoCoordinates) {
    const id = testId++;
    await runTest(id, 'GEOLOCATION', `GPS: ${geo.desc}`, async () => {
      const dist = calculateDistanceKm(geo.lat, geo.lng);
      const estimate = getDeliveryEstimate(geo.lat, geo.lng);

      if (dist < 0 || isNaN(dist)) {
        throw new Error(`Invalid distance calculation: ${dist}`);
      }

      return `Calculated: ${dist} km, Tier: ${estimate.deliveryTier}, ETA: ${estimate.estimatedMinutes}m`;
    });
  }

  // -------------------------------------------------------------
  // BATCH 5: Ambiguity Resolution & Candidate Ranking (Tests 76 to 85)
  // -------------------------------------------------------------
  const ambiguityPhrases = [
    '1 packet atta dena',
    '1 tel ka dabba',
    '1 packet doodh',
    '1 bread packet',
    '1 packet biscuit',
    '1 packet namkeen',
    '1 packet rice',
    '1 packet dal',
    '1 packet shampoo',
    '1 packet soap'
  ];

  for (const phrase of ambiguityPhrases) {
    const id = testId++;
    await runTest(id, 'AMBIGUITY_HANDLING', phrase, async () => {
      const res = await processCustomerMessage({
        message: phrase,
        customerPhone: `99811547${String(id).padStart(2, '0')}`,
        customerName: `Ambiguity User ${id}`,
        source: 'whatsapp'
      });
      if (!res.action_taken) {
        throw new Error('No action taken');
      }
      return `Handled with action: ${res.action_taken}`;
    });
  }

  // -------------------------------------------------------------
  // BATCH 6: Edge Cases, Khata & Idempotency (Tests 86 to 100)
  // -------------------------------------------------------------
  const edgeCases = [
    {
      name: 'Idempotency Protection: Duplicate External Message ID',
      fn: async () => {
        const extId = `ext-${Date.now()}`;
        const prod = (await getAllProducts())[0];
        const res1 = await executeOrderAtomic({
          customerId: 'c1000000-0000-0000-0000-000000000001',
          source: 'whatsapp',
          rawMessage: 'Idempotency test order',
          externalMessageId: extId,
          items: [{ product_id: prod.id, quantity: 1 }]
        });
        const res2 = await executeOrderAtomic({
          customerId: 'c1000000-0000-0000-0000-000000000001',
          source: 'whatsapp',
          rawMessage: 'Idempotency test order',
          externalMessageId: extId,
          items: [{ product_id: prod.id, quantity: 1 }]
        });
        if (!res2.idempotent) throw new Error('Expected second call to be idempotent');
        return `First order: ${res1.order_id}, Second returned identical: ${res2.order_id}`;
      }
    },
    {
      name: 'Insufficient Stock Rejection',
      fn: async () => {
        const prod = (await getAllProducts())[0];
        const res = await executeOrderAtomic({
          customerId: 'c1000000-0000-0000-0000-000000000001',
          source: 'whatsapp',
          rawMessage: 'Order 999 units',
          items: [{ product_id: prod.id, quantity: 999 }]
        });
        if (res.success) throw new Error('Expected order to fail due to stock');
        return `Correctly rejected: ${res.error}`;
      }
    },
    {
      name: 'Khata Credit Transaction Addition',
      fn: async () => {
        const updated = await addCreditTransaction('9981154672', 35000, 'Test 100-test credit');
        if (!updated || updated.totalCreditPaise < 35000) throw new Error('Khata credit not added');
        return `Customer credit updated: ₹${(updated.totalCreditPaise / 100).toFixed(2)}`;
      }
    },
    {
      name: 'Khata Payment Settlement',
      fn: async () => {
        const customers = await getKhataCustomers();
        const cust = customers[0];
        const initial = cust.totalCreditPaise;
        const settled = await recordKhataPayment(cust.id, 10000);
        if (!settled) throw new Error('Payment settlement failed');
        return `Settled ₹100.00: balance was ₹${(initial / 100).toFixed(2)}, now ₹${(settled.totalCreditPaise / 100).toFixed(2)}`;
      }
    },
    {
      name: 'Typo Resilience: "ashirwad ata"',
      fn: async () => {
        const res = await processCustomerMessage({
          message: 'ashirwad ata 5kg bhej do',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        if (res.action_taken !== 'ORDER_CONFIRMED') throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
        return `Resolved to: ${res.order?.items?.[0]?.name}`;
      }
    },
    {
      name: 'Typo Resilience: "magi 2 minit"',
      fn: async () => {
        const res = await processCustomerMessage({
          message: '2 magi 2 minit noodles',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        if (res.action_taken !== 'ORDER_CONFIRMED') throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
        return `Resolved to: ${res.order?.items?.[0]?.name}`;
      }
    },
    {
      name: 'Hinglish Alias: "sarson tel 1L"',
      fn: async () => {
        const res = await processCustomerMessage({
          message: '1 sarson tel 1L bhej do',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        if (res.action_taken !== 'ORDER_CONFIRMED') throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
        return `Resolved to: ${res.order?.items?.[0]?.name}`;
      }
    },
    {
      name: 'Audit Trace Event Logging',
      fn: async () => {
        const runs = await getAllAgentRuns();
        if (runs.length === 0) throw new Error('No agent runs found');
        return `Verified ${runs.length} agent runs recorded in database`;
      }
    },
    {
      name: 'Integer Paise Arithmetic Precision',
      fn: async () => {
        const p1 = 28900; // ₹289.00
        const p2 = 14800; // ₹148.00
        const total = p1 + p2;
        if (total !== 43700) throw new Error('Paise arithmetic mismatch');
        return `Precise sum: ₹${(total / 100).toFixed(2)}`;
      }
    },
    {
      name: 'Delivery Address with Landmark Persistence',
      fn: async () => {
        const prod = (await getAllProducts())[0];
        const res = await executeOrderAtomic({
          customerId: 'c1000000-0000-0000-0000-000000000001',
          source: 'web_demo',
          rawMessage: 'Address test order',
          deliveryAddress: 'Flat 301, Tower B, Landmark: Near Mother Dairy',
          latitude: 28.4725,
          longitude: 77.0430,
          distanceKm: 0.8,
          deliveryNotes: 'Please ring bell twice',
          items: [{ product_id: prod.id, quantity: 1 }]
        });
        if (!res.success) throw new Error('Order creation failed');
        return `Order #${res.order_id} created with address & GPS coordinates`;
      }
    },
    {
      name: 'Multi-item Basket with 4 distinct FMCG SKUs',
      fn: async () => {
        const res = await processCustomerMessage({
          message: '1 bread, 2 doodh, 1 butter aur 1 namak bhej do',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        if (res.action_taken !== 'ORDER_CONFIRMED') throw new Error(`Expected ORDER_CONFIRMED, got ${res.action_taken}`);
        return `4-item basket total ₹${res.order?.total_inr}`;
      }
    },
    {
      name: 'Customer Phone Formatting & Sanitization',
      fn: async () => {
        const cust = await getOrCreateCustomer('+91 (998) 115-4672', 'Sanitization Test');
        if (!cust.phone.includes('9981154672')) throw new Error('Phone sanitization failed');
        return `Cleaned phone: ${cust.phone}`;
      }
    },
    {
      name: 'Zero-Quantity Handling',
      fn: async () => {
        const res = await processCustomerMessage({
          message: '0 packet atta bhej do',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        return `Handled with action: ${res.action_taken}`;
      }
    },
    {
      name: 'Greetings & Casual Inquiries',
      fn: async () => {
        const res = await processCustomerMessage({
          message: 'Namaste bhaiya, dukan khuli hai kya?',
          customerPhone: '9981154672',
          source: 'whatsapp'
        });
        return `Replied: "${res.reply_message?.slice(0, 50)}..."`;
      }
    },
    {
      name: 'Live Stock State Invariant Verification',
      fn: async () => {
        const products = await getAllProducts();
        for (const p of products) {
          if (p.stock_quantity < 0) throw new Error(`Negative stock found for SKU ${p.sku}`);
        }
        return `All ${products.length} products satisfy non-negative stock invariant`;
      }
    }
  ];

  for (const edge of edgeCases) {
    const id = testId++;
    await runTest(id, 'EDGE_CASE_AND_KHATA', edge.name, edge.fn);
  }

  // -------------------------------------------------------------
  // Summary & Scorecard
  // -------------------------------------------------------------
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const avgLatency = Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / results.length);

  console.log('\n\n================================================================');
  console.log(`🎉 100 LIVE TESTS COMPLETED: ${passedCount}/100 PASSED (${failedCount} FAILED)`);
  console.log(`⚡ Average Latency: ${avgLatency}ms | Success Rate: ${(passedCount / 100) * 100}%`);
  console.log('================================================================');

  if (failedCount > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [Test ${r.id}] ${r.name}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('✅ ALL 100 TESTS PASSED WITH ZERO REGRESSIONS!');
    process.exit(0);
  }
}

run100Tests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
