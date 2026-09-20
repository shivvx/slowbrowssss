'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  User,
  IndianRupee,
  MessageSquare,
  Clock,
  Sparkles
} from 'lucide-react';
import { Order, OrderItem, Customer } from '@/lib/types';

interface OrderDetailData {
  order: Order;
  items: OrderItem[];
  customer: Customer | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders?id=${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 p-8 flex items-center justify-center">
        <div className="text-xs text-stone-500 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          Loading order details...
        </div>
      </main>
    );
  }

  if (!data || !data.order) {
    return (
      <main className="min-h-screen bg-stone-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-stone-200 bg-white p-8 text-center">
          <h2 className="text-base font-bold text-stone-900">Order Not Found</h2>
          <p className="mt-1 text-xs text-stone-500">Order ID &quot;{id}&quot; does not exist in database.</p>
          <Link
            href="/orders"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const { order, items, customer } = data;
  const totalINR = (order.total_paise / 100).toFixed(2);
  const subtotalINR = (order.subtotal_paise / 100).toFixed(2);

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Orders</span>
          </Link>

          <a
            href={`https://wa.me/919981154672?text=${encodeURIComponent(`Order status update for #${order.id.slice(-6).toUpperCase()}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
            <span>Track on WhatsApp</span>
          </a>
        </div>

        {/* Live Visual Tracking Bar */}
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Live Delivery Tracker</span>
              <h2 className="text-base font-bold text-stone-900">
                {order.status === 'DELIVERED'
                  ? '🎉 Order Delivered!'
                  : order.status === 'OUT_FOR_DELIVERY'
                  ? '🛵 Out for Delivery (Arriving Soon)'
                  : order.status === 'PACKED'
                  ? '📦 Packed & Ready for Pickup'
                  : '⏳ Order Confirmed & Being Prepared'}
              </h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          {/* Stepper */}
          {(() => {
            const steps = [
              { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Received & Inventory Locked' },
              { key: 'PACKED', label: 'Packed', desc: 'Items Bagged at Counter' },
              { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: '~15 mins to doorstep' },
              { key: 'DELIVERED', label: 'Delivered', desc: 'Handed to Customer' },
            ];
            const currentIdx =
              order.status === 'DELIVERED'
                ? 3
                : order.status === 'OUT_FOR_DELIVERY'
                ? 2
                : order.status === 'PACKED'
                ? 1
                : 0;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {steps.map((st, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div
                      key={st.key}
                      className={`rounded-xl border p-3 transition-colors ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-stone-200 bg-stone-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className="text-xs font-bold text-stone-900">{st.label}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 pl-7">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Order Header Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-stone-900">
                  Order #{order.id.slice(-6).toUpperCase()}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-400 font-mono flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(order.created_at).toLocaleString()}
                <span className="text-stone-300">•</span>
                <span>Source: {order.source}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-400 uppercase font-semibold">Total Amount</span>
              <div className="text-2xl font-bold text-stone-900 flex items-center justify-end gap-0.5">
                <IndianRupee className="h-5 w-5 text-stone-400" />
                {totalINR}
              </div>
            </div>
          </div>

          {/* Customer Details & Raw Request */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="rounded-lg bg-stone-50 p-4 border border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Customer Information</span>
              </div>
              <div className="text-xs space-y-1 text-stone-700">
                <p><strong>Name:</strong> {customer?.name || 'Customer'}</p>
                <p><strong>Phone:</strong> {customer?.phone || '—'}</p>
                <p><strong>Delivery Address:</strong> {customer?.address || 'Vijay Nagar, Indore'}</p>
                {customer?.latitude && customer?.longitude && (
                  <p className="pt-1">
                    <a
                      href={`https://maps.google.com/?q=${customer.latitude},${customer.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      📍 View Live Destination on Google Maps →
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Inbound Customer Message */}
            <div className="rounded-lg bg-stone-50 p-4 border border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                <span>Raw Inbound Message</span>
              </div>
              <p className="text-xs italic text-stone-800 bg-white p-2.5 rounded border border-stone-200">
                &quot;{order.raw_message}&quot;
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <span>Itemized Order Bill</span>
            </h3>

            <div className="overflow-hidden rounded-lg border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-600 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price (₹)</th>
                    <th className="px-4 py-2.5 text-right">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map(it => (
                    <tr key={it.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-stone-900">{it.product?.name || 'Product'}</p>
                        <p className="text-[11px] font-mono text-stone-400">{it.product?.sku} • {it.product?.pack_size}</p>
                        {it.substituted_for_product_id && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 mt-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Autonomous Substitution
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-stone-800">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-stone-700">
                        ₹{(it.unit_price_paise / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-stone-900">
                        ₹{(it.line_total_paise / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-stone-200 bg-stone-50/50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-right text-stone-600">Subtotal:</td>
                    <td className="px-4 py-2.5 text-right font-bold text-stone-900">₹{subtotalINR}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-right text-stone-900">Grand Total:</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700 text-sm">₹{totalINR}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
