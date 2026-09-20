'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import AgentTraceView from '@/components/AgentTraceView';
import CoreMVPChecklist from '@/components/CoreMVPChecklist';
import { AgentEvent, Product } from '@/lib/types';

interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent';
  text: string;
  time: string;
  action?: string;
  order?: {
    id: string;
    total_inr: string;
    items: Array<{
      name: string;
      quantity: number;
      unit_price_paise: number;
      line_total_paise: number;
    }>;
  };
}

export default function DemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'agent',
      text: 'Namaste Shivam ji! 🙏 KiranaPilot store operator active hai. Aap WhatsApp par normal Hindi ya Hinglish mein grocery list bhej sakte hain.',
      time: '10:45 AM'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch live inventory for the live watcher
  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          customerPhone: '+919876543210',
          customerName: 'Shivam Sharma',
          customerAddress: 'Flat 402, Green Valley Apts, Sector 62'
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Update live events trace
        if (result.events && Array.isArray(result.events)) {
          setEvents(result.events);
        }

        if (result.order) {
          setActiveOrderId(result.order.id);
        }

        const agentMsg: ChatMessage = {
          id: `msg-agent-${Date.now()}`,
          sender: 'agent',
          text: result.reply_message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: result.action_taken,
          order: result.order
        };

        setMessages(prev => [...prev, agentMsg]);
        
        // Refresh inventory to show mutation
        await fetchInventory();
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'agent',
          text: 'Maaf kijiye, server error aayi. Please retry.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech Recognition for Voice Input
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
                      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRec as any)();
      recognition.lang = 'hi-IN'; // Hinglish / Hindi
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Preset demo scenarios
  const demoScenarios = [
    {
      label: '1. Standard Hinglish Order',
      prompt: '2 packet Aashirvaad 5kg, 1 Fortune oil aur 3 Maggi ghar bhej do.',
      desc: 'Extracts 3 products, retrieves live prices, creates order, deducts stock.'
    },
    {
      label: '2. Out-of-Stock Substitution',
      prompt: '1 Fortune oil aur 2 Amul milk dena',
      desc: 'Fortune 1L is 0 stock → suggests Dhara 1L ₹148 → reply "haan" to continue!'
    },
    {
      label: '3. "Mera Usual Wala"',
      prompt: 'bhaiya usual wala bhej do',
      desc: 'Retrieves Shivam\'s frequent basket (2 Milk, 1 Bread, 12 Eggs) with live prices.'
    },
    {
      label: '4. Ambiguous Product Review',
      prompt: '10 wala 5 parle g bhejna',
      desc: 'Ambiguity detected → routes to Needs Review queue in owner dashboard.'
    }
  ];

  // Key demo products for live inventory watcher
  const keyProducts = inventory.filter(p =>
    ['ST-ASH-05K', 'OL-FRT-SUN1', 'OL-DHR-MST1', 'DY-AML-TZ5', 'SN-MAG-MS70', 'SN-PRL-G10'].includes(p.sku)
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Scenario Quick-Launch Bar */}
        <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                1-Click Demo Scenarios (Official Evaluation Rubric)
              </span>
            </div>
            <span className="text-xs text-stone-400">Click any scenario to simulate customer message</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {demoScenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sc.prompt)}
                disabled={loading}
                className="flex flex-col items-start rounded-lg border border-stone-200 bg-stone-50/60 p-2.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/40 disabled:opacity-50 group"
              >
                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-800">
                  {sc.label}
                </span>
                <span className="mt-1 text-[11px] font-mono text-stone-600 line-clamp-1">
                  &quot;{sc.prompt}&quot;
                </span>
                <span className="mt-1 text-[10px] text-stone-400 line-clamp-1">
                  {sc.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Core MVP Checklist (Evaluation Rubric Compliance) */}
        <CoreMVPChecklist hasOrder={Boolean(activeOrderId)} className="mb-4" />

        {/* Split Grid: WhatsApp Chat (Left) vs Real-Time Agent Trace + Stock Watcher (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: WhatsApp-Style Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-stone-300 bg-stone-900 shadow-md overflow-hidden min-h-[640px]">
            {/* WhatsApp Header */}
            <div className="flex items-center justify-between border-b border-stone-800 bg-stone-800/90 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                  <Bot className="h-5 w-5" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">KiranaPilot Store Operator</h3>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online • Autonomous AI
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-stone-400">Customer:</span>
                <p className="text-xs font-medium text-stone-200">Shivam Sharma (+91 98765 43210)</p>
              </div>
            </div>

            {/* WhatsApp Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95">
              {messages.map(msg => {
                const isUser = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white text-[10px]">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#005c4b] text-white rounded-br-none'
                          : 'bg-[#202c33] text-stone-100 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Substitution Quick Response Buttons */}
                      {msg.action === 'SUBSTITUTION_OFFERED' && (
                        <div className="mt-3 pt-2 border-t border-stone-600/50 flex items-center gap-2">
                          <button
                            onClick={() => handleSendMessage('haan')}
                            disabled={loading}
                            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Haan, Replace kar do</span>
                          </button>
                          <button
                            onClick={() => handleSendMessage('nahi')}
                            disabled={loading}
                            className="rounded-md bg-stone-700 px-2.5 py-1 text-xs font-medium text-stone-300 hover:bg-stone-600 transition-colors"
                          >
                            Nahi chahiye
                          </button>
                        </div>
                      )}

                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-stone-400">
                        <span>{msg.time}</span>
                        {isUser && <span>✓✓</span>}
                      </div>
                    </div>

                    {isUser && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-700 text-white text-[10px]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white">
                    <Bot className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-bl-none bg-[#202c33] px-3 py-2 text-stone-300 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>KiranaPilot operates store (parsing Hinglish, locking stock)...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-stone-800 bg-[#202c33] p-3">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input (Hindi/Hinglish)'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={isListening ? 'Bolte rahiye (Listening)...' : 'Type in Hinglish (e.g. 2 packet atta aur 1 oil)'}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-stone-700 bg-stone-800 px-3.5 py-2 text-xs text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Agent Trace & Live Inventory Watcher (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Inventory Watcher (Proves real DB stock mutations!) */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">Live Inventory Watcher</h3>
                </div>
                <button
                  onClick={fetchInventory}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Refresh DB</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {keyProducts.map(p => {
                  const isOOS = p.stock_quantity === 0;
                  const isLow = p.stock_quantity <= p.reorder_level && !isOOS;

                  return (
                    <div
                      key={p.id}
                      className={`rounded-lg border p-2.5 transition-all ${
                        isOOS
                          ? 'border-rose-200 bg-rose-50/50'
                          : isLow
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-stone-200 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-stone-400">{p.pack_size}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                            isOOS
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOOS ? 'OUT OF STOCK' : `${p.stock_quantity} left`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-stone-900 line-clamp-1">{p.name}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-stone-600">
                        ₹{(p.price_paise / 100).toFixed(0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Agent Trace View */}
            <AgentTraceView
              events={events}
              title="Live Agent Trace (Transparent Trust Layer)"
              orderId={activeOrderId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
