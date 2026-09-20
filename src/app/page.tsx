'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
  IndianRupee,
  AlertTriangle,
  User,
  Home,
  Building2,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { Product } from '@/lib/types';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerStorefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Shivam Sharma');
  const [customerPhone, setCustomerPhone] = useState('9981154672');
  const [customerAddress, setCustomerAddress] = useState('Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({ lat: 22.7533, lng: 75.8937 });
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>('⚡ Express Delivery in ~15 mins (0.6 km away • Free delivery)');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    id: string;
    total: string;
    distance?: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    coords?: { lat: number; lng: number } | null;
    deliveryEstimate?: string | null;
  } | null>(null);

  // Assistant quick prompt modal/drawer
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        const { getDeliveryEstimate } = await import('@/lib/geo');
        const estimate = getDeliveryEstimate(lat, lng);
        setDeliveryEstimate(estimate.message);
        setCustomerAddress(`GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Indore Area)`);
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to Indore default coordinates
        setCoords({ lat: 22.7533, lng: 75.8937 });
        setDeliveryEstimate('⚡ Express Delivery in ~18 mins (0.8 km away • Free delivery)');
        setCustomerAddress('Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const setPresetAddress = (preset: 'HOME' | 'OFFICE') => {
    if (preset === 'HOME') {
      setCustomerAddress('Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore');
      setCoords({ lat: 22.7540, lng: 75.8940 });
      setDeliveryEstimate('⚡ Express Delivery in ~15 mins (0.6 km away • Free delivery)');
    } else {
      setCustomerAddress('Shop 12, Scheme 54 Main Market, Vijay Nagar, Indore');
      setCoords({ lat: 22.7525, lng: 75.8930 });
      setDeliveryEstimate('⚡ Express Delivery in ~12 mins (0.4 km away • Free delivery)');
    }
  };

  const categories = [
    'ALL',
    'Staples',
    'Edible Oils',
    'Dairy & Eggs',
    'Bakery',
    'Spices',
    'Snacks & Packaged Food',
    'Household & Cleaning',
    'Personal Care'
  ];

  const filteredProducts = products.filter(p => {
    // Multi-token search so "fortune oil", "atta 5kg", "maggi noodles" match
    const searchTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const prodText = `${p.name} ${p.brand || ''} ${p.category} ${p.variant || ''} ${p.pack_size || ''} ${p.sku}`.toLowerCase();
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(t => prodText.includes(t));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase() ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(p.category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) return item;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const totalPaise = cart.reduce((acc, item) => acc + item.product.price_paise * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Generate WhatsApp Order Message
  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    const itemsText = cart
      .map(item => `• ${item.product.name} x ${item.quantity} = ₹${((item.product.price_paise * item.quantity) / 100).toFixed(2)}`)
      .join('\n');
    const totalText = `₹${(totalPaise / 100).toFixed(2)}`;
    const addressText = customerAddress ? `\n📍 Deliver to: ${customerAddress}` : '';
    const gpsLink = coords ? `\n🗺️ Live GPS: https://maps.google.com/?q=${coords.lat},${coords.lng}` : '';
    const nameText = customerName ? `\n👤 Name: ${customerName}` : '';
    const phoneText = customerPhone ? `\n📞 Phone: +91 ${customerPhone}` : '';
    const notesText = deliveryNotes ? `\n📝 Note: ${deliveryNotes}` : '';

    const message = `Namaste Bhaiya! Order likho:\n\n${itemsText}\n\nTotal: ${totalText}${nameText}${phoneText}${addressText}${gpsLink}${notesText}\n\nJaldi bhej do please!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919981154672?text=${encoded}`, '_blank');
  };

  // Direct AI Order Submission
  const handleAiOrder = async () => {
    if (cart.length === 0) return;
    try {
      setOrdering(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
          customerPhone: customerPhone || '9981154672',
          customerName: customerName || 'Shivam Sharma',
          deliveryAddress: customerAddress || 'Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore',
          latitude: coords?.lat,
          longitude: coords?.lng,
          deliveryNotes: deliveryNotes || undefined
        })
      });
      const data = await res.json();
      if (data.order) {
        setOrderSuccess({
          id: data.order.id,
          total: (data.order.total_paise / 100).toFixed(2),
          distance: data.order.distance_km,
          customerName: customerName || 'Shivam Sharma',
          customerPhone: customerPhone || '9981154672',
          customerAddress: customerAddress || 'Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore',
          coords: coords,
          deliveryEstimate: deliveryEstimate
        });
        setCart([]);
        setIsCartOpen(false);
        fetchProducts(); // refresh live stock
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdering(false);
    }
  };

  // AI Assistant Quick Inquiry
  const handleAskAssistant = async () => {
    if (!assistantInput.trim()) return;
    try {
      setAssistantLoading(true);
      setAssistantResponse(null);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: assistantInput,
          customerPhone: '9981154672',
          customerName: customerName || 'Shiv',
          customerAddress: customerAddress || 'Vijay Nagar, Indore'
        })
      });
      const data = await res.json();
      setAssistantResponse(
        data.reply_message ||
        data.reply ||
        (data.order ? `Order Confirmed! #${data.order.id} (Total: ₹${data.order.total_inr})` : 'Order received!')
      );
      if (data.order) {
        fetchProducts();
      }
    } catch (e: any) {
      setAssistantResponse('Error connecting to KiranaPilot Assistant: ' + e.message);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-24">
      {/* Top Banner: Store Status & Mode Switcher */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-700">Open Now</span>
              <span>•</span>
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <span>7:00 AM – 10:30 PM</span>
              <span>•</span>
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
              <span>Vijay Nagar, Indore (Free 30-min Delivery)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                Customer Storefront
              </span>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <span>Owner Portal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="border-b border-stone-200 bg-linear-to-b from-emerald-50/50 via-white to-stone-50 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300">
                <Store className="h-3.5 w-3.5 text-emerald-700" />
                <span>Shree Ganesh General Store</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
                Ghar Ka Kirana, Ab WhatsApp Pe!
              </h1>
              <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
                Order fresh groceries, staples, edible oils, and dairy directly. Text in Hinglish or select items below for instant delivery.
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-bold text-stone-800 shadow-xs hover:bg-stone-50 transition-colors"
              >
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>Store QR Poster</span>
              </button>

              <a
                href="https://wa.me/919981154672?text=Bhaiya%20order%20likho:"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Hinglish Assistant Box */}
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>KiranaPilot Instant AI Assistant</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                Understands Hinglish
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={e => setAssistantInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAssistant()}
                placeholder='Type in Hinglish: "2 packet doodh, 5kg atta aur Fortune oil bhej do"...'
                className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                onClick={handleAskAssistant}
                disabled={assistantLoading || !assistantInput.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {assistantLoading ? (
                  <span>Checking Live DB...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Order</span>
                  </>
                )}
              </button>
            </div>

            {assistantResponse && (
              <div className="mt-3 rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-stone-800 whitespace-pre-line font-medium animate-fade-in">
                {assistantResponse}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog & Products */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Search & Category Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search atta, oil, maggi, milk, bread..."
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredProducts.map(prod => {
            const isOOS = prod.stock_quantity === 0;
            const inCart = cart.find(i => i.product.id === prod.id);

            return (
              <div
                key={prod.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md ${
                  isOOS ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span className="font-semibold text-stone-600">{prod.brand || prod.category}</span>
                    <span>{prod.pack_size || ''}</span>
                  </div>

                  <h3 className="text-xs font-bold text-stone-900 line-clamp-2 min-h-8">
                    {prod.name}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-stone-900">
                      ₹{(prod.price_paise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-1">
                    {isOOS ? (
                      <span className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Out of Stock
                      </span>
                    ) : prod.stock_quantity <= prod.reorder_level ? (
                      <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Only {prod.stock_quantity} left
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        In Stock ({prod.stock_quantity})
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  {isOOS ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-stone-100 py-1.5 text-center text-xs font-medium text-stone-400 cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  ) : inCart ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-600 bg-emerald-50 px-2 py-1">
                      <button
                        onClick={() => updateCartQty(prod.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-2xs hover:bg-emerald-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-xs text-emerald-900 font-mono">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(prod.id, 1)}
                        disabled={inCart.quantity >= prod.stock_quantity}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-2xs hover:bg-emerald-100 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(prod)}
                      className="w-full rounded-xl bg-stone-900 py-1.5 text-center text-xs font-bold text-white shadow-2xs hover:bg-emerald-600 transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Bar (Bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl animate-fade-in">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-600 bg-stone-900 p-3.5 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
                {totalItems}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-300">Total Amount</p>
                <p className="text-base font-extrabold text-white">
                  ₹{(totalPaise / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700"
              >
                View Cart
              </button>
              <button
                onClick={handleWhatsAppOrder}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsCartOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-stone-900">Your Grocery Cart ({totalItems} items)</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-stone-100 space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between py-2">
                  <div className="flex-1 pr-3">
                    <p className="text-xs font-bold text-stone-900">{item.product.name}</p>
                    <p className="text-[11px] text-stone-500">
                      ₹{(item.product.price_paise / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-1.5 py-0.5">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="text-stone-600 hover:text-stone-900"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                        className="text-stone-600 hover:text-stone-900 disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-16 text-right font-bold text-xs text-stone-900">
                      ₹{((item.product.price_paise * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer & Delivery Details */}
            <div className="mt-4 space-y-3 border-t border-stone-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  Customer &amp; Delivery Details
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Auto-synced to WhatsApp &amp; DB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Shivam Sharma"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                    WhatsApp Phone
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">+91</span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="9981154672"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-3 py-2 text-xs font-mono font-bold text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Live GPS Fetching Button & Address Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                    Delivery Address
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={geoLoading}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <Navigation className={`h-3 w-3 ${geoLoading ? 'animate-spin' : ''}`} />
                    <span>{geoLoading ? 'Detecting GPS...' : '📍 Fetch My Live Location'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Flat No., Apartment, Colony, Sector..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                />

                {/* Address Quick Chips */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setPresetAddress('HOME')}
                    className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors flex items-center gap-1"
                  >
                    <Home className="h-3 w-3 text-emerald-600" />
                    <span>Home (Sec 14)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetAddress('OFFICE')}
                    className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors flex items-center gap-1"
                  >
                    <Building2 className="h-3 w-3 text-blue-600" />
                    <span>Office (Market)</span>
                  </button>
                </div>

                {/* Live Distance & ETA Banner */}
                {deliveryEstimate && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-medium text-emerald-900">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{deliveryEstimate}</span>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Delivery instruction (e.g. Ring bell / Leave at security)"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="text-xs font-semibold text-stone-600">Grand Total:</span>
              <span className="text-lg font-extrabold text-stone-900">
                ₹{(totalPaise / 100).toFixed(2)}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppOrder}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Send on WhatsApp</span>
              </button>
              <button
                onClick={handleAiOrder}
                disabled={ordering}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50"
              >
                {ordering ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Instant AI Checkout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success & Live Tracking Modal */}
      {orderSuccess && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOrderSuccess(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto"
        >
          <div className="relative w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-300 bg-white p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setOrderSuccess(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-stone-900">Order Confirmed &amp; Locked!</h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    LIVE IN DB
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Order <span className="font-mono font-bold text-emerald-800">#{orderSuccess.id.slice(-6).toUpperCase()}</span> • Total: <span className="font-bold text-stone-900">₹{orderSuccess.total}</span>
                </p>
              </div>
            </div>

            {/* Recipient & Delivery Address Card */}
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-200/60 pb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Delivery Destination
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {orderSuccess.deliveryEstimate || '⚡ Express Delivery in ~15 mins'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-stone-400 block">Recipient:</span>
                  <span className="font-bold text-stone-900">{orderSuccess.customerName || 'Shivam Sharma'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-stone-400 block">WhatsApp Phone:</span>
                  <span className="font-mono font-bold text-stone-900">+91 {orderSuccess.customerPhone || '9981154672'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-stone-400 block">Address:</span>
                <p className="text-xs text-stone-700 font-medium">{orderSuccess.customerAddress || 'Flat 402, Royal Residency, Scheme 54, Vijay Nagar, Indore'}</p>
                {orderSuccess.coords && (
                  <a
                    href={`https://maps.google.com/?q=${orderSuccess.coords.lat},${orderSuccess.coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    <span>View GPS Pin on Google Maps ({orderSuccess.coords.lat.toFixed(4)}, {orderSuccess.coords.lng.toFixed(4)})</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* 4-Step Live Tracking Stepper */}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Order Tracking Stepper
                </span>
                <span className="text-[10px] font-bold text-emerald-800">Step 2 of 4</span>
              </div>

              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-stone-200 -z-0" />
                <div className="absolute left-4 w-1/3 top-3.5 h-0.5 bg-emerald-500 -z-0" />

                {/* Steps */}
                <div className="flex flex-col items-center text-center z-10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                    ✓
                  </div>
                  <span className="mt-1 text-[10px] font-bold text-emerald-900">Placed</span>
                  <span className="text-[9px] text-stone-400">Just now</span>
                </div>

                <div className="flex flex-col items-center text-center z-10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold ring-4 ring-emerald-100 shadow-2xs animate-pulse">
                    2
                  </div>
                  <span className="mt-1 text-[10px] font-bold text-emerald-900">Packing</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Ramesh bhaiya</span>
                </div>

                <div className="flex flex-col items-center text-center z-10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-stone-300 text-stone-400 text-xs font-bold">
                    3
                  </div>
                  <span className="mt-1 text-[10px] font-semibold text-stone-500">On the Way</span>
                  <span className="text-[9px] text-stone-400">Sonu (Rider)</span>
                </div>

                <div className="flex flex-col items-center text-center z-10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-stone-300 text-stone-400 text-xs font-bold">
                    4
                  </div>
                  <span className="mt-1 text-[10px] font-semibold text-stone-500">Delivered</span>
                  <span className="text-[9px] text-stone-400">~15-20m</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/919981154672?text=${encodeURIComponent(`Bhaiya order #${orderSuccess.id.slice(-6).toUpperCase()} ka live status kya hai?`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-center"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Track Live on WhatsApp</span>
              </a>

              <Link
                href={`/orders/${orderSuccess.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-200 transition-colors text-center"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Invoice &amp; DB Record</span>
              </Link>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              className="mt-3 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} storePhone="9981154672" />
    </main>
  );
}
