'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  ArrowUpRight,
  QrCode
} from 'lucide-react';
import WhatsAppQRModal from './WhatsAppQRModal';

export default function Navbar() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isStorefront = pathname === '/';

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          window.location.reload();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  // 1. CUSTOMER STOREFRONT NAVBAR (Clean, customer-facing, no QR/admin clutter)
  if (isStorefront) {
    return (
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
          {/* Store Branding */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-stone-900">Ramesh Kirana Store</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Indore
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Vijay Nagar • Open Now (Free 30-min Delivery)
              </p>
            </div>
          </Link>

          {/* Customer Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
              title="Scan QR Code to order via WhatsApp"
            >
              <QrCode className="h-3.5 w-3.5 text-emerald-600" />
              <span>Scan QR</span>
            </button>

            <Link
              href="/orders"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-stone-500" />
              <span>My Orders</span>
            </Link>

            <a
              href="https://wa.me/919981154672?text=Namaste%20Bhaiya!%20Mujhe%20ye%20samaan%20chahiye:%0A%E2%80%A2%202%20packet%20Amul%20Taaza%20Doodh%0A%E2%80%A2%201%20Fortune%20Oil%201L%0A%E2%80%A2%205kg%20Aashirvaad%20Atta%0A%0AGhar%20bhej%20do%20please!"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Order on WhatsApp</span>
            </a>

            <Link
              href="/dashboard"
              className="text-[11px] text-stone-400 hover:text-stone-700 ml-2 hidden sm:inline"
            >
              Shopkeeper Portal →
            </Link>
          </div>
        </div>
        <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} storePhone="9981154672" />
      </header>
    );
  }

  // 2. ADMIN PANEL NAVBAR (Shopkeeper Operator view with full OMS, Inventory, Khata)
  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard OMS', icon: LayoutDashboard },
    { href: '/orders', label: 'All Orders', icon: ShoppingBag },
    { href: '/inventory', label: 'Live Inventory', icon: Package },
    { href: '/khata', label: 'Khata Book', icon: BookOpen, badge: 'New' },
    { href: '/demo', label: 'Simulator', icon: MessageSquare },
    { href: '/review', label: 'System Review', icon: AlertCircle },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Brand & Autopilot Status */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
              <Store className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-stone-900">Ramesh Kirana Admin</span>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Indore
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Bot Active (+91 9981154672)
              </p>
            </div>
          </Link>

          {/* Desktop Admin Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {adminNavItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-stone-100 text-stone-900 font-bold'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* WhatsApp Bridge Status & QR Linker Button */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors"
            title="Open WhatsApp Web Linker & Live Bridge"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <QrCode className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">WhatsApp Bot: Active</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
          >
            <span>Customer Storefront</span>
            <ArrowUpRight className="h-3 w-3 text-stone-400" />
          </Link>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset inventory, orders, and traces to initial state"
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition-colors disabled:opacity-50"
          >
            {resetSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold text-[11px]">Reset!</span>
              </>
            ) : (
              <>
                <RotateCcw className={`h-3.5 w-3.5 text-stone-400 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-[11px]">{resetting ? '...' : 'Reset'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Admin Nav Sub-bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-4 py-2 scrollbar-none">
        {adminNavItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} storePhone="9981154672" />
    </header>
  );
}
