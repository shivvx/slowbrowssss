'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  PhoneCall,
  Smartphone,
  Store,
  X,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Send
} from 'lucide-react';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  storePhone?: string;
}

export default function WhatsAppQRModal({
  isOpen,
  onClose,
  storePhone = '9981154672'
}: WhatsAppQRModalProps) {
  const [activeTab, setActiveTab] = useState<'COUNTER_POSTER' | 'PAIR_PHONE' | 'SIMULATOR'>('COUNTER_POSTER');
  const [counterQrUrl, setCounterQrUrl] = useState<string>('');
  const [deviceQrUrl, setDeviceQrUrl] = useState<string>('');
  const [pairingStatus, setPairingStatus] = useState<'WAITING' | 'CONNECTED'>('CONNECTED');
  const [simInput, setSimInput] = useState('2 packet Amul Taaza doodh aur 1 Harvest Gold bread bhej do');
  const [simOutput, setSimOutput] = useState<string | null>(null);
  const [simOrderUrl, setSimOrderUrl] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const generateQRs = async () => {
      try {
        // 1. Countertop QR: Official wa.me link with prefilled order prompt
        // ANY camera, Google Lens, or WhatsApp camera scans this and immediately opens chat!
        const waUrl = `https://wa.me/91${storePhone}?text=${encodeURIComponent(
          'Namaste Bhaiya! Mujhe ye samaan chahiye: \n• 2 packet Amul Taaza Doodh\n• 1 Fortune Oil 1L\n• 5kg Aashirvaad Atta\n\nGhar bhej do please!'
        )}`;
        const counterUrl = await QRCode.toDataURL(waUrl, {
          width: 280,
          margin: 2,
          color: { dark: '#047857', light: '#ffffff' }
        });
        setCounterQrUrl(counterUrl);

        // 2. Direct Store Link QR
        const storeUrl = `https://slowbrowssss.vercel.app`;
        const deviceUrl = await QRCode.toDataURL(storeUrl, {
          width: 280,
          margin: 2,
          color: { dark: '#111827', light: '#ffffff' }
        });
        setDeviceQrUrl(deviceUrl);
      } catch (err) {
        console.error('Failed to generate QR codes:', err);
      }
    };

    generateQRs();
  }, [isOpen, storePhone]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateOrder = async () => {
    if (!simInput.trim()) return;
    try {
      setSimLoading(true);
      setSimOutput('⚡ Processing order via KiranaPilot Autonomous Operator...');
      setSimOrderUrl(null);

      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: simInput,
          customerPhone: storePhone,
          customerName: 'Shivam Sharma'
        })
      });
      const data = await res.json();
      setSimOutput(data.reply_message || 'Order successfully placed!');
      if (data.order?.id) {
        setSimOrderUrl(`/orders/${data.order.id}`);
      }
    } catch (e: any) {
      setSimOutput('Error: ' + e.message);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">WhatsApp Connection &amp; Countertop QR</h2>
            <p className="text-xs text-stone-500">Autonomous WhatsApp ordering for +91 {storePhone}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-lg bg-stone-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('COUNTER_POSTER')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'COUNTER_POSTER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="h-4 w-4 text-emerald-600" />
            <span>1. Customer Countertop QR</span>
          </button>
          <button
            onClick={() => setActiveTab('PAIR_PHONE')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'PAIR_PHONE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="h-4 w-4 text-blue-600" />
            <span>2. Store Phone Link</span>
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'SIMULATOR' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>3. Test Simulator</span>
          </button>
        </div>

        {/* Tab 1: Customer Countertop QR (Scan with any camera) */}
        {activeTab === 'COUNTER_POSTER' && (
          <div className="mt-5 text-center">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 text-center mb-4">
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Official Store Countertop Poster
              </span>
              <h3 className="text-lg font-extrabold text-stone-900 mt-2">
                “Message Karo. Order Ho Gaya.”
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                Scan with <strong>ANY Camera / Google Lens / WhatsApp Camera</strong> to instantly open chat &amp; order.
              </p>

              <div className="mx-auto my-4 inline-block rounded-2xl border-2 border-emerald-600 bg-white p-3 shadow-md">
                {counterQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={counterQrUrl} alt="WhatsApp Customer Order QR" className="h-48 w-48 mx-auto" />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center text-xs text-stone-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="text-xs font-mono font-bold text-stone-800 flex items-center justify-center gap-2">
                <span>WhatsApp: +91 {storePhone}</span>
                <span className="text-stone-300">•</span>
                <span className="text-emerald-700 font-sans font-semibold">Instant AI Reply</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Counter Poster</span>
              </button>

              <a
                href={`https://wa.me/91${storePhone}?text=${encodeURIComponent('Namaste Bhaiya! 2 packet doodh aur 1 bread bhej do')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-stone-50 transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Store Device Pairing */}
        {activeTab === 'PAIR_PHONE' && (
          <div className="mt-5">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-stone-900">
                    Store Autopilot Status: <span className="text-emerald-700">ONLINE &amp; ACTIVE</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-stone-600">
                  +91 {storePhone}
                </span>
              </div>

              <div className="mt-3 text-xs text-stone-600 space-y-2">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">
                  <strong>⚠️ Why WhatsApp &quot;Linked Devices&quot; rejects manual codes:</strong>
                  <p className="text-[11px] text-amber-800 mt-1">
                    WhatsApp&apos;s &quot;Linked Devices&quot; scanner only pairs with an active WhatsApp Web desktop client. It cannot be paired with a static string.
                  </p>
                </div>

                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    Option 1: Real WhatsApp via Twilio / Meta Webhook (Recommended)
                  </span>
                  <p className="text-[11px] text-stone-600">
                    To receive real WhatsApp messages on your number, connect your Twilio or Meta WhatsApp webhook to:
                  </p>
                  <code className="mt-1 block rounded bg-stone-100 border border-stone-200 p-2 text-[11px] font-mono text-emerald-800 break-all select-all">
                    https://slowbrowssss.vercel.app/api/whatsapp/webhook
                  </code>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Method: HTTP POST • Handles incoming messages, processes via LLM, and sends back confirmation + tracking links.
                  </p>
                </div>

                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Option 2: Customer Countertop QR (Zero Setup Needed)
                  </span>
                  <p className="text-[11px] text-stone-600">
                    Customers don&apos;t use &quot;Linked Devices&quot;. They scan the <strong>Countertop QR (Tab 1)</strong> with their regular camera, which opens chat to <strong>+91 {storePhone}</strong> directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('SIMULATOR')}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                <span>Test Inbound Simulator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Inbound Simulator */}
        {activeTab === 'SIMULATOR' && (
          <div className="mt-5">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                  Simulate WhatsApp Customer Message
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  7-Step Autonomous Loop
                </span>
              </div>

              <p className="text-[11px] text-stone-500 mb-2">
                Type any grocery order in Hinglish to test live parsing, inventory lock, and WhatsApp tracking link:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={simInput}
                  onChange={e => setSimInput(e.target.value)}
                  placeholder='e.g. "2 packet doodh aur 1 Fortune oil bhej do"'
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={handleSimulateOrder}
                  disabled={simLoading || !simInput.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{simLoading ? 'Processing...' : 'Send'}</span>
                </button>
              </div>

              {/* Reply Preview */}
              {simOutput && (
                <div className="mt-3 rounded-lg bg-white border border-stone-200 p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5 border-b border-stone-100 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      WhatsApp Confirmation Reply:
                    </span>
                    {simOrderUrl && (
                      <a
                        href={simOrderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>Open Live Tracking Page</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <pre className="text-xs text-stone-800 whitespace-pre-line font-sans font-medium">
                    {simOutput}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
              <span className="text-stone-500 text-[11px]">
                Orders sync automatically to <strong className="text-stone-700">/dashboard</strong> &amp; <strong className="text-stone-700">/orders</strong>
              </span>
              <button
                onClick={onClose}
                className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

