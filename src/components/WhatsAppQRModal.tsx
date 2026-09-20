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
  const [activeTab, setActiveTab] = useState<'PAIR_PHONE' | 'COUNTER_POSTER' | 'SIMULATOR'>('PAIR_PHONE');
  const [counterQrUrl, setCounterQrUrl] = useState<string>('');
  const [liveQr, setLiveQr] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<'SCAN_QR' | 'CONNECTED' | 'BRIDGE_OFFLINE' | 'INITIALIZING'>('INITIALIZING');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [simInput, setSimInput] = useState('2 packet Amul Taaza doodh aur 1 Harvest Gold bread bhej do');
  const [simOutput, setSimOutput] = useState<string | null>(null);
  const [simOrderUrl, setSimOrderUrl] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Countertop QR: Official wa.me link with prefilled order prompt
    const generateCounterQr = async () => {
      try {
        const waUrl = `https://wa.me/91${storePhone}?text=${encodeURIComponent(
          'Namaste Bhaiya! Mujhe ye samaan chahiye: \n• 2 packet Amul Taaza Doodh\n• 1 Fortune Oil 1L\n• 5kg Aashirvaad Atta\n\nGhar bhej do please!'
        )}`;
        const counterUrl = await QRCode.toDataURL(waUrl, {
          width: 280,
          margin: 2,
          color: { dark: '#047857', light: '#ffffff' }
        });
        setCounterQrUrl(counterUrl);
      } catch (err) {
        console.error('Failed to generate counter QR:', err);
      }
    };
    generateCounterQr();

    // 2. Poll local WhatsApp Web bridge on port 3001
    const checkLiveBridge = async () => {
      try {
        const res = await fetch('/api/whatsapp/live-qr');
        if (res.ok) {
          const data = await res.json();
          if (data.bridge_running) {
            setBridgeStatus(data.status);
            if (data.qr) setLiveQr(data.qr);
            if (data.phone) setConnectedPhone(data.phone);
          } else {
            setBridgeStatus('BRIDGE_OFFLINE');
          }
        }
      } catch {
        setBridgeStatus('BRIDGE_OFFLINE');
      }
    };

    checkLiveBridge();
    const interval = setInterval(checkLiveBridge, 2000);
    return () => clearInterval(interval);
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
            <h2 className="text-base font-bold text-stone-900">WhatsApp Web Device Linker &amp; Automation</h2>
            <p className="text-xs text-stone-500">Autonomous WhatsApp ordering for +91 {storePhone}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-lg bg-stone-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PAIR_PHONE')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'PAIR_PHONE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <span>1. Link Device (WhatsApp Web)</span>
          </button>
          <button
            onClick={() => setActiveTab('COUNTER_POSTER')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'COUNTER_POSTER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="h-4 w-4 text-blue-600" />
            <span>2. Customer Countertop QR</span>
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

        {/* Tab 1: Real WhatsApp Web Device Linker */}
        {activeTab === 'PAIR_PHONE' && (
          <div className="mt-5 text-center">
            {bridgeStatus === 'CONNECTED' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">WhatsApp Linked &amp; Active!</h3>
                    <p className="text-xs text-emerald-700">
                      Connected Phone: <strong>+{connectedPhone || storePhone}</strong>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-stone-600 bg-white p-3 rounded-lg border border-emerald-200">
                  🎉 <strong>KiranaPilot Autonomous Operator is LIVE!</strong> Any customer messaging your WhatsApp number will now be automatically replied to with live stock checks, order calculation, and tracking links!
                </p>
              </div>
            ) : bridgeStatus === 'SCAN_QR' && liveQr ? (
              <div>
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  Official WhatsApp Web QR Code
                </span>
                <p className="text-xs text-stone-700 font-medium max-w-sm mx-auto mb-3">
                  Open WhatsApp on your phone &gt; <strong>Linked Devices &gt; Link a Device</strong> &gt; Scan this QR:
                </p>

                <div className="mx-auto inline-block rounded-2xl border-2 border-stone-800 bg-white p-3 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={liveQr} alt="Real WhatsApp Web QR" className="h-52 w-52 mx-auto" />
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Waiting for scan from WhatsApp on phone...</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-left mb-4">
                  <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    Local WhatsApp Web Bridge
                  </h3>
                  <p className="text-xs text-stone-600 mb-3">
                    To link your real WhatsApp without Twilio, the local Baileys bridge runs on your machine and generates real WhatsApp Web QRs that your phone will link with.
                  </p>

                  <div className="rounded-lg bg-stone-900 text-stone-200 p-3 font-mono text-xs">
                    <p className="text-stone-400 text-[10px] mb-1"># Run in your terminal:</p>
                    <code className="text-emerald-400 select-all">npm run whatsapp-bridge</code>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveTab('COUNTER_POSTER')}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Or use Customer Countertop QR instead →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Customer Countertop QR Poster */}
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

