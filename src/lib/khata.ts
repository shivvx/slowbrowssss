import { sendDailyKhataTallyEmail } from './mail';

export interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalCreditPaise: number; // outstanding balance
  lastTransactionDate: string;
  transactions: Array<{
    id: string;
    type: 'CREDIT_PURCHASE' | 'PAYMENT_RECEIVED';
    amountPaise: number;
    description: string;
    date: string;
  }>;
}

const INITIAL_KHATA: KhataCustomer[] = [
  {
    id: 'kh-1',
    name: 'Shivam Sharma',
    phone: '+91 98765 43210',
    address: 'Flat 402, Green Valley Apts',
    totalCreditPaise: 84000, // ₹840.00
    lastTransactionDate: new Date(Date.now() - 86400000).toISOString(),
    transactions: [
      { id: 'tx-1', type: 'CREDIT_PURCHASE', amountPaise: 54000, description: 'Aashirvaad Atta 10kg', date: new Date(Date.now() - 172800000).toISOString() },
      { id: 'tx-2', type: 'CREDIT_PURCHASE', amountPaise: 30000, description: '2 Amul Milk + Bread', date: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  {
    id: 'kh-2',
    name: 'Pooja Verma',
    phone: '+91 91234 56789',
    address: 'House 12, Gali 4, Shanti Nagar',
    totalCreditPaise: 125000, // ₹1,250.00
    lastTransactionDate: new Date(Date.now() - 43200000).toISOString(),
    transactions: [
      { id: 'tx-3', type: 'CREDIT_PURCHASE', amountPaise: 125000, description: 'Monthly Staples (Rice, Dal, Oil)', date: new Date(Date.now() - 43200000).toISOString() }
    ]
  },
  {
    id: 'kh-3',
    name: 'Rohan Mehta',
    phone: '+91 99887 76655',
    address: 'B-104, Sunrise Residency',
    totalCreditPaise: 35000, // ₹350.00
    lastTransactionDate: new Date(Date.now() - 21600000).toISOString(),
    transactions: [
      { id: 'tx-4', type: 'CREDIT_PURCHASE', amountPaise: 85000, description: 'Weekly groceries', date: new Date(Date.now() - 172800000).toISOString() },
      { id: 'tx-5', type: 'PAYMENT_RECEIVED', amountPaise: 50000, description: 'UPI Payment received', date: new Date(Date.now() - 21600000).toISOString() }
    ]
  }
];

// Global in-memory khata store across reloads
const globalKhata = (globalThis as unknown as { __kiranaKhata?: KhataCustomer[] });
if (!globalKhata.__kiranaKhata) {
  globalKhata.__kiranaKhata = JSON.parse(JSON.stringify(INITIAL_KHATA));
}
const khataStore = globalKhata.__kiranaKhata!;

export async function getKhataCustomers(): Promise<KhataCustomer[]> {
  return khataStore;
}

export async function addCreditTransaction(phone: string, amountPaise: number, description: string) {
  let cust = khataStore.find(k => k.phone.includes(phone.slice(-10)));
  if (!cust) {
    cust = {
      id: `kh-${Date.now()}`,
      name: 'Customer',
      phone,
      address: 'Neighborhood',
      totalCreditPaise: 0,
      lastTransactionDate: new Date().toISOString(),
      transactions: []
    };
    khataStore.push(cust);
  }

  cust.totalCreditPaise += amountPaise;
  cust.lastTransactionDate = new Date().toISOString();
  cust.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'CREDIT_PURCHASE',
    amountPaise,
    description,
    date: new Date().toISOString()
  });

  return cust;
}

export async function recordKhataPayment(customerId: string, amountPaise: number) {
  const cust = khataStore.find(k => k.id === customerId);
  if (!cust) return null;

  cust.totalCreditPaise = Math.max(0, cust.totalCreditPaise - amountPaise);
  cust.lastTransactionDate = new Date().toISOString();
  cust.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'PAYMENT_RECEIVED',
    amountPaise,
    description: 'Payment settled',
    date: new Date().toISOString()
  });

  return cust;
}

export async function generateEveningTallyAndEmail(): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const totalOutstandingPaise = khataStore.reduce((acc, k) => acc + k.totalCreditPaise, 0);
  const totalOutstandingINR = (totalOutstandingPaise / 100).toFixed(2);

  const topCustomers = khataStore.map(k => ({
    name: `${k.name} (${k.phone})`,
    amountINR: (k.totalCreditPaise / 100).toFixed(2),
    isCredit: k.totalCreditPaise > 0
  }));

  return await sendDailyKhataTallyEmail({
    date: new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }),
    totalOrders: 18,
    totalSalesINR: '8,420.00',
    cashSalesINR: '5,980.00',
    creditKhataSalesINR: totalOutstandingINR,
    topCustomers
  });
}
