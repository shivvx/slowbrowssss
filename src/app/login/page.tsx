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
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<'OTP' | 'QR'>('OTP');
  const [phone, setPhone] = useState('9981154672');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (loginMode === 'QR') {
      const payload = `kiranapilot-auth:${phone}:${Date.now()}`;
      QRCode.toDataURL(payload, { width: 220, margin: 2 }).then(setQrCodeUrl);
    }
  }, [loginMode, phone]);

  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND', phone })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.demoOtp) {
          setDemoOtpHint(data.demoOtp);
          setOtp(data.demoOtp); // Auto-fill for seamless testing
        }
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (e) {
      console.error(e);
      setError('Network error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
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

  const handleQuickDemoLogin = () => {
    setPhone('9981154672');
    setOtp('8817');
    setOtpSent(true);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-stone-900">
            KiranaPilot Store Login
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Autonomous store operator dashboard &amp; live inventory console
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-lg bg-stone-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setLoginMode('OTP')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              loginMode === 'OTP' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Phone &amp; OTP</span>
          </button>
          <button
            onClick={() => setLoginMode('QR')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              loginMode === 'QR' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR Login</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        {loginMode === 'OTP' ? (
          <div className="mt-6 space-y-4">
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
                  placeholder="9981154672"
                  disabled={otpSent}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden disabled:bg-stone-50"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Enter 4-Digit OTP
                    </label>
                    <button
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="8817"
                      className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm font-mono tracking-widest text-center text-stone-900 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  {demoOtpHint && (
                    <p className="mt-1.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Auto-filled demo OTP: <strong>{demoOtpHint}</strong> (Sent to slowbros@shivvx.in)
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || !otp.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying...' : 'Verify OTP & Enter Dashboard'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Quick Demo Pre-fill */}
            <div className="mt-6 pt-4 border-t border-stone-100 text-center">
              <button
                onClick={handleQuickDemoLogin}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pre-fill Store Owner (+91 9981154672)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-xs text-stone-600 mb-3">
              Scan this QR with your store device to login instantly:
            </p>

            <div className="mx-auto inline-block rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
              {qrCodeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeUrl} alt="Store Login QR" className="h-44 w-44" />
              )}
            </div>

            <p className="mt-3 text-[11px] font-mono text-stone-400">
              Session for +91 {phone}
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Simulate QR Authenticated ✓
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
