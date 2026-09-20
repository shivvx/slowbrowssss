'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  IndianRupee,
  Mail,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { KhataCustomer } from '@/lib/khata';

export default function KhataPage() {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [totalOutstandingINR, setTotalOutstandingINR] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchKhata = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/khata');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalOutstandingINR(data.totalOutstandingINR || '0.00');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhata();
  }, []);

  const handleSendEveningTally = async () => {
    try {
      setEmailing(true);
      const res = await fetch('/api/khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_EVENING_TALLY' })
      });
      if (res.ok) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmailing(false);
    }
  };

  const handleSettle = async (customerId: string, amountPaise: number) => {
    try {
      setSettlingId(customerId);
      const res = await fetch('/api/khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SETTLE_PAYMENT', customerId, amountPaise })
      });
      if (res.ok) {
        fetchKhata();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Kirana Khata (Digital Udhar &amp; Ledger)
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Autonomous credit tracking for neighborhood customers. Replaces messy red paper diaries and manual evening calculations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendEveningTally}
              disabled={emailing}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
              title="Automatically calculate today's cash vs credit and email report to store owner"
            >
              <Mail className={`h-4 w-4 ${emailing ? 'animate-bounce' : ''}`} />
              <span>{emailing ? 'Calculating & Mailing...' : '1-Click Evening Tally (Email)'}</span>
            </button>

            <button
              onClick={fetchKhata}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Email Success Banner */}
        {emailSuccess && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Daily evening ledger report has been calculated and successfully dispatched to <strong>slowbros@shivvx.in</strong> via Purelymail SMTP!
            </span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Outstanding Udhar</span>
            <div className="mt-2 text-2xl font-bold text-amber-700 flex items-center gap-1">
              <IndianRupee className="h-6 w-6 text-amber-500" />
              {totalOutstandingINR}
            </div>
            <p className="mt-1 text-xs text-stone-500">Across {customers.length} credit customers</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Daily Time Saved</span>
            <div className="mt-2 text-2xl font-bold text-stone-900 flex items-center gap-1">
              <Clock className="h-6 w-6 text-emerald-600" />
              25 Minutes
            </div>
            <p className="mt-1 text-xs text-emerald-700 font-medium">Zero manual diary tallying every evening</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Autonomous Credit Detection</span>
            <div className="mt-2 text-2xl font-bold text-purple-700 flex items-center gap-1">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Active
            </div>
            <p className="mt-1 text-xs text-stone-500">Detects &quot;paise kal dunga&quot; on WhatsApp</p>
          </div>
        </div>

        {/* Khata Customer Ledger Table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div className="border-b border-stone-100 bg-stone-50/70 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Customer Credit Balances
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-600 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone &amp; Address</th>
                  <th className="px-4 py-3">Outstanding Udhar</th>
                  <th className="px-4 py-3">Last Transaction</th>
                  <th className="px-4 py-3 text-right">Quick Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map(c => {
                  const isSettling = settlingId === c.id;
                  const balanceINR = (c.totalCreditPaise / 100).toFixed(2);

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-stone-900">
                        {c.name}
                      </td>

                      <td className="px-4 py-3.5 text-stone-500">
                        <div className="font-mono text-stone-700">{c.phone}</div>
                        <div className="text-[11px] text-stone-400">{c.address}</div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-amber-700 text-sm">
                        ₹{balanceINR}
                      </td>

                      <td className="px-4 py-3.5 text-stone-400 font-mono text-[11px]">
                        {new Date(c.lastTransactionDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {c.totalCreditPaise > 0 ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleSettle(c.id, Math.min(c.totalCreditPaise, 50000))}
                              disabled={isSettling}
                              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              -₹500
                            </button>
                            <button
                              onClick={() => handleSettle(c.id, c.totalCreditPaise)}
                              disabled={isSettling}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Settle All</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Clear ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
