'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Store,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('9981154672');
  const [otp, setOtp] = useState('8817');
  const [otpSent, setOtpSent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ONE_CLICK' | 'OTP' | 'QR'>('ONE_CLICK');

  useEffect(() => {
    // Generate WhatsApp Countertop QR code immediately on page load
    const generateQr = async () => {
      try {
        const waUrl = `https://wa.me/919981154672?text=${encodeURIComponent(
          'Namaste Bhaiya! Mujhe ye samaan chahiye:\n• 2 packet Amul Taaza Doodh\n• 1 Fortune Oil 1L\n• 5kg Aashirvaad Atta\n\nGhar bhej do please!'
        )}`;
        const url = await QRCode.toDataURL(waUrl, {
          width: 240,
          margin: 2,
          color: { dark: '#047857', light: '#ffffff' }
        });
        setQrCodeUrl(url);
      } catch (e) {
        console.error('Failed to generate QR code:', e);
      }
    };

    generateQr();
  }, []);

  const handle1ClickLogin = () => {
    setLoading(true);
    // Instant store owner login
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', phone, otp })
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (e) {
      console.error(e);
      setError('Network error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 p-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Brand & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-stone-900">
            Store Owner Portal Login
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Shree Ganesh General Store • Operator Console
          </p>
        </div>

        {/* 1-Click Instant Owner Access Banner */}
        <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Store Owner: Shivam Sharma (+91 9981154672)</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Full administrative access to Live OMS, Inventory, and Khata.
          </p>
          <button
            onClick={handle1ClickLogin}
            disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'Entering Dashboard...' : '⚡ Instant 1-Click Login to Dashboard'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 flex rounded-lg bg-stone-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ONE_CLICK')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'ONE_CLICK' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>1. WhatsApp Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('QR')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'QR' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-blue-600" />
            <span>2. Countertop QR</span>
          </button>
          <button
            onClick={() => setActiveTab('OTP')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'OTP' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-stone-600" />
            <span>3. Phone &amp; OTP</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        {/* Tab 1: WhatsApp Business Setup & How to Start */}
        {activeTab === 'ONE_CLICK' && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                How to Connect WhatsApp Business &amp; Start Automation
              </h3>

              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <strong className="text-stone-800">Twilio / Cloud API Webhook (Live):</strong>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Point incoming WhatsApp webhook to:
                    </p>
                    <code className="mt-1 block rounded bg-white border border-stone-200 p-1.5 text-[10px] font-mono text-emerald-800 break-all">
                      https://slowbrowssss.vercel.app/api/whatsapp/webhook
                    </code>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <strong className="text-stone-800">Live WhatsApp Chat with Store:</strong>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Send any message to <strong>+91 9981154672</strong> or click below:
                    </p>
                    <a
                      href="https://wa.me/919981154672?text=Bhaiya%20order%20likho:"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>Open WhatsApp Chat (+91 9981154672) →</span>
                    </a>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <strong className="text-stone-800">Deterministic Inbound Simulator:</strong>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Test any Hinglish order in the browser without WhatsApp disconnects.
                    </p>
                    <button
                      onClick={() => router.push('/demo')}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-stone-900 hover:underline"
                    >
                      <span>Launch Inbound Simulator (/demo) →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Immediate Visible QR Code */}
        {activeTab === 'QR' && (
          <div className="mt-5 text-center">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Scan with Phone Camera
              </span>
              <p className="text-xs text-stone-600">
                Scan this QR code with <strong>ANY phone camera</strong> or WhatsApp to immediately start ordering:
              </p>

              <div className="mx-auto my-3 inline-block rounded-xl border-2 border-emerald-600 bg-white p-3 shadow-xs">
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodeUrl} alt="Store WhatsApp QR" className="h-48 w-48 mx-auto" />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center text-xs text-stone-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <p className="text-xs font-mono font-bold text-stone-800">
                WhatsApp: +91 9981154672
              </p>

              <div className="mt-3 flex justify-center gap-2">
                <a
                  href="https://wa.me/919981154672?text=Bhaiya%20order%20likho:"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Test Direct Link on Web</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Phone & OTP */}
        {activeTab === 'OTP' && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Registered Store Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-500">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Verification OTP
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Demo PIN: 8817
                </span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm font-mono tracking-widest text-center text-stone-900 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || !otp.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Enter Dashboard'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

