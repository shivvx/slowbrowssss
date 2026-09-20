'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  X,
  User,
  MessageSquare,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Order } from '@/lib/types';

export default function ReviewQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/review');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const handleAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoading(orderId);
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action })
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Needs Review Queue
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Human-in-the-loop safety gate. KiranaPilot flags low confidence or ambiguous customer requests for owner verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReviewQueue}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Confidence-Based Zero-Click Protocol
              </h3>
              <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                Orders with <strong>Confidence &ge; 90%</strong> execute automatically without waking the store owner.
                Orders with <strong>Confidence &lt; 75%</strong>, product ambiguity, or unusual quantities are held here for single-click owner confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Review List */}
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Review Queue Empty</h3>
              <p className="mt-1 text-xs text-stone-500">
                All customer orders are currently executing autonomously at high confidence!
              </p>
            </div>
          ) : (
            orders.map(order => {
              const isActioning = actionLoading === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-colors hover:border-stone-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          ⚠ Needs Verification
                        </span>
                        <span className="font-mono text-xs text-stone-400">
                          ORDER #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-600">
                        <User className="h-3.5 w-3.5 text-stone-400" />
                        <span>Customer Phone: <strong>+91 98765 43210</strong></span>
                      </div>

                      <div className="rounded-lg bg-stone-50 p-3 border border-stone-100 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-500 font-semibold mb-1 text-[11px]">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Customer Raw Request:</span>
                        </div>
                        <p className="font-medium text-stone-800 italic">
                          &quot;{order.raw_message}&quot;
                        </p>
                      </div>

                      <div className="text-xs text-stone-500">
                        <span>Agent Interpretation: </span>
                        <strong className="text-stone-800">5 × Parle-G ₹10 packs (SKU: SN-PRL-G10)</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:self-start">
                      <button
                        onClick={() => handleAction(order.id, 'APPROVE')}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve Order</span>
                      </button>

                      <button
                        onClick={() => handleAction(order.id, 'REJECT')}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
