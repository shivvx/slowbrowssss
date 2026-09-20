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
  Users,
  AlertCircle,
  Activity,
  RotateCcw,
  CheckCircle2,
  PhoneCall,
  QrCode,
  BookOpen
} from 'lucide-react';
import WhatsAppQRModal from './WhatsAppQRModal';

export default function Navbar() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Storefront', icon: Store },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/demo', label: 'Simulator', icon: MessageSquare, badge: 'Live' },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/khata', label: 'Khata', icon: BookOpen, badge: 'New' },
    { href: '/review', label: 'Review', icon: AlertCircle },
  ];

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

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Brand & Autopilot Status */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-transform group-hover:scale-105">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-stone-900">KiranaPilot</span>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Store Autopilot
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsQrModalOpen(true)}
            title="Scan QR to pair WhatsApp or print Store QR poster"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden xs:inline">WhatsApp QR</span>
          </button>

          <Link
            href="/login"
            title="Store Owner Portal Login"
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden sm:inline">Owner Login</span>
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

      {/* WhatsApp QR Modal */}
      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />

      {/* Mobile Nav Sub-bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-4 py-2 scrollbar-none">
        {navItems.map(item => {
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
    </header>
  );
}
