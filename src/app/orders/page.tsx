'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
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
    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Customer Orders
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Complete log of orders created by the KiranaPilot autonomous operator.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Customer Message</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map(order => {
                  const timeStr = new Date(order.created_at).toLocaleString();
                  const totalINR = (order.total_paise / 100).toFixed(2);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-stone-900">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                          {order.source === 'whatsapp' ? 'WhatsApp' : 'Web Demo'}
                        </span>
                      </td>

                      {/* Raw Message */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-stone-700 font-medium italic">
                          &quot;{order.raw_message}&quot;
                        </p>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 font-bold text-stone-900">
                        <span className="flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3 text-stone-400" />
                          {totalINR}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Confirmed ✓
                          </span>
                        ) : order.status === 'NEEDS_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">
                            Needs Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                            {order.status}
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-stone-400 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeStr}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <span>View Details</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
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
