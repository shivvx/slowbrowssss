'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  IndianRupee,
  Cpu,
  AlertCircle,
  Package,
  Clock,
  ArrowUpRight,
  RefreshCw,
  PhoneCall,
  Layers,
  CheckCircle2,
  MapPin,
  Truck,
  ExternalLink,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { AgentRun, Order } from '@/lib/types';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';

interface DashboardData {
  metrics: {
    todayOrders: number;
    todayRevenuePaise: number;
    todayRevenueINR: string;
    automationRate: number;
    needsReviewCount: number;
    lowStockCount: number;
    avgLatencyMs: number;
  };
  recentOrders: Order[];
  recentRuns: AgentRun[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) {
        await fetchDashboard();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {
    todayOrders: 0,
    todayRevenuePaise: 0,
    todayRevenueINR: '0.00',
    automationRate: 100,
    needsReviewCount: 0,
    lowStockCount: 0,
    avgLatencyMs: 1450
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Header Title & Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Store Operator Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Autopilot Active
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Autonomous Kirana store engine: Hinglish understanding, live inventory locks, and deterministic execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Launch Simulator</span>
            </Link>
          </div>
        </div>

        {/* Real-time WhatsApp Automation & Bridge Card */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">WhatsApp Web Automation &amp; Device Link</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    CONNECTED &amp; ACTIVE
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Linked Phone: <strong className="text-stone-900">+91 9981154672</strong> • Real-time order bills &amp; live tracking links sent automatically to customer WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Open QR &amp; Device Linker</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Today's Orders */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Today&apos;s Orders</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">{metrics.todayOrders}</div>
              <p className="mt-1 text-xs text-stone-500">Across WhatsApp & Web</p>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">₹{metrics.todayRevenueINR}</div>
              <p className="mt-1 text-xs text-stone-500">Paise-precise total</p>
            </div>
          </div>

          {/* Automation Rate */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Autopilot Rate</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">{metrics.automationRate}%</div>
              <p className="mt-1 text-xs text-stone-500">Zero owner intervention</p>
            </div>
          </div>

          {/* Needs Review */}
          <Link
            href="/review"
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-colors hover:border-amber-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Needs Review</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">{metrics.needsReviewCount}</div>
              <p className="mt-1 text-xs text-amber-700 flex items-center gap-1 font-medium">
                Review queue <ArrowUpRight className="h-3 w-3" />
              </p>
            </div>
          </Link>

          {/* Low Stock Alerts */}
          <Link
            href="/inventory"
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-colors hover:border-rose-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Low Stock</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">{metrics.lowStockCount} items</div>
              <p className="mt-1 text-xs text-rose-700 flex items-center gap-1 font-medium">
                Inspect stock <ArrowUpRight className="h-3 w-3" />
              </p>
            </div>
          </Link>
        </div>

        {/* Live Order Management System (OMS) */}
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">Live Order Management (OMS)</h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Real-Time Dispatch
                  </span>
                </div>
                <p className="text-xs text-stone-500">1-click order status progression with live customer notification</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-stone-100 p-1 text-xs font-semibold">
                {['ALL', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                      statusFilter === st
                        ? 'bg-white text-stone-900 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'CONFIRMED' ? 'New' : st === 'PACKED' ? 'Packed' : st === 'OUT_FOR_DELIVERY' ? 'Out' : 'Done'}
                  </button>
                ))}
              </div>

              <Link
                href="/orders"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 ml-2"
              >
                <span>All Orders</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Orders Table */}
          <div className="mt-4 overflow-x-auto">
            {(!data?.recentOrders || data.recentOrders.length === 0) ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No orders yet. Send a test order via WhatsApp or the Storefront!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Time &amp; Source</th>
                    <th className="py-2.5 px-3">Delivery Destination</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.recentOrders
                    .filter(o => statusFilter === 'ALL' || o.status === statusFilter)
                    .map(order => {
                      const isUpdating = updatingOrderId === order.id;
                      const timeStr = new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const totalINR = (order.total_paise / 100).toFixed(2);

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-stone-900">
                            <Link href={`/orders/${order.id}`} className="hover:text-emerald-700 hover:underline">
                              #{order.id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-stone-500 text-[11px]">{timeStr}</span>
                              <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                order.source === 'whatsapp'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {order.source}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="max-w-xs">
                              <p className="font-medium text-stone-900 truncate">
                                {order.delivery_address || 'Store Pickup (Vijay Nagar, Indore)'}
                              </p>
                              {order.latitude && order.longitude && (
                                <a
                                  href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                                >
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>View Map Pin</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-stone-900">
                            ₹{totalINR}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'CONFIRMED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : order.status === 'PACKED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : order.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {order.status === 'CONFIRMED' && 'New Order'}
                              {order.status === 'PACKED' && 'Packed'}
                              {order.status === 'OUT_FOR_DELIVERY' && 'Out for Delivery'}
                              {order.status === 'DELIVERED' && 'Delivered ✓'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'PACKED')}
                                  disabled={isUpdating}
                                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Package className="h-3 w-3" />
                                  <span>Mark Packed</span>
                                </button>
                              )}

                              {order.status === 'PACKED' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                                  disabled={isUpdating}
                                  className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Truck className="h-3 w-3" />
                                  <span>Out for Delivery</span>
                                </button>
                              )}

                              {order.status === 'OUT_FOR_DELIVERY' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                  disabled={isUpdating}
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Mark Delivered</span>
                                </button>
                              )}

                              <Link
                                href={`/orders/${order.id}`}
                                className="rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 p-1 text-[11px] transition-colors"
                                title="View details"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Operational Grid: Live Agent Activity & Quick Orders */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Live Agent Activity Feed */}
          <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">Live Agent Activity</h2>
                  <p className="text-xs text-stone-500">Real-time autonomous transactions and recovery events</p>
                </div>
              </div>

              <Link
                href="/agent-runs"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>All Traces</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100">
              {data?.recentRuns && data.recentRuns.length > 0 ? (
                data.recentRuns.map(run => {
                  const timeStr = new Date(run.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <div key={run.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-xs font-mono">
                          {run.source === 'whatsapp' ? 'WA' : 'WEB'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-stone-400">{timeStr}</span>
                            <span className="text-xs font-medium text-stone-900 line-clamp-1 max-w-xs">
                              &quot;{run.raw_input}&quot;
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                            <span>Intent: <strong className="text-stone-700">{run.intent || 'UNKNOWN'}</strong></span>
                            {run.latency_ms && (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-stone-400">
                                <Clock className="h-3 w-3" />
                                {run.latency_ms}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {run.status === 'SUCCESS' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            Completed ✓
                          </span>
                        )}
                        {run.status === 'NEEDS_REVIEW' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            Needs Review ⚠
                          </span>
                        )}
                        {run.status === 'IN_PROGRESS' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                            Processing ○
                          </span>
                        )}
                        {run.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                            Failed ✕
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-stone-400">
                  No recent agent activity yet. Send a test message from the Customer Simulator.
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Demo Scenarios */}
          <div className="space-y-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900">Zero-Click Kirana Architecture</h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                KiranaPilot does not merely chat. It operates the store with 3 distinct brains:
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 rounded-lg bg-stone-50 p-3 border border-stone-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Understanding</h4>
                    <p className="text-[11px] text-stone-600 mt-0.5">Gemini Flash converts unstructured Hinglish into typed Zod data.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg bg-stone-50 p-3 border border-stone-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Store Engine</h4>
                    <p className="text-[11px] text-stone-600 mt-0.5">Live PostgreSQL queries, alias resolver, and deterministic paise pricing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg bg-stone-50 p-3 border border-stone-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Action Engine</h4>
                    <p className="text-[11px] text-stone-600 mt-0.5">Atomic row locks (`SELECT FOR UPDATE`), stock deduction, and WhatsApp dispatch.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100">
                <Link
                  href="/demo"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Open Live Demo Simulator</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} storePhone="9981154672" />
    </main>
  );
}
