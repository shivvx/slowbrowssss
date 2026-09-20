'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Minus,
  Check,
  RotateCcw,
  IndianRupee,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle
} from 'lucide-react';
import { Product } from '@/lib/types';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const fetchInventory = async () => {
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
    fetchInventory();
  }, []);

  const handleStockChange = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      setUpdatingId(productId);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stockQuantity: newStock })
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock_quantity: newStock } : p))
        );
        setSuccessId(productId);
        setTimeout(() => setSuccessId(null), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/inventory/csv', '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;
    try {
      setImporting(true);
      setImportResult(null);
      const res = await fetch('/api/inventory/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ success: true, message: data.message, count: data.count });
        fetchInventory();
        setTimeout(() => {
          setIsCsvModalOpen(false);
          setCsvContent('');
          setImportResult(null);
        }, 1500);
      } else {
        setImportResult({ success: false, message: data.error || 'Failed to import CSV' });
      }
    } catch (err: any) {
      setImportResult({ success: false, message: err.message || 'Error uploading CSV' });
    } finally {
      setImporting(false);
    }
  };

  const loadDefaultCsvTemplate = async () => {
    try {
      const res = await fetch('/api/inventory/csv');
      const text = await res.text();
      setCsvContent(text);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    'ALL',
    'Staples',
    'Edible Oils',
    'Dairy',
    'Dairy & Eggs',
    'Bakery',
    'Spices',
    'Snacks & Packaged Food',
    'Household & Cleaning',
    'Personal Care'
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Package className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Live Store Inventory
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Real-time database stock levels with atomic locks. Sync catalog instantly via CSV or quick inline adjustment.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-stone-500" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchInventory}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, or SKU..."
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Category Pills */}
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

        {/* Inventory Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU / Brand</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Pack Size</th>
                  <th className="px-4 py-3">Price (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Live Stock &amp; Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map(prod => {
                  const isOOS = prod.stock_quantity === 0;
                  const isLow = prod.stock_quantity <= prod.reorder_level && !isOOS;
                  const isUpdating = updatingId === prod.id;
                  const isSuccess = successId === prod.id;

                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Product Name */}
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {prod.name}
                      </td>

                      {/* SKU / Brand */}
                      <td className="px-4 py-3.5 text-stone-500 font-mono text-[11px]">
                        <div>{prod.sku}</div>
                        <div className="text-stone-400">{prod.brand || '—'}</div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-stone-600">
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      {/* Pack Size */}
                      <td className="px-4 py-3.5 text-stone-600 font-medium">
                        {prod.pack_size || '—'}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-semibold text-stone-900">
                        <span className="flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3 text-stone-400" />
                          {(prod.price_paise / 100).toFixed(2)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {isOOS ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                            Low Stock (Reorder: {prod.reorder_level})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Quick Stock Controls */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleStockChange(prod.id, prod.stock_quantity - 1)}
                            disabled={isUpdating || prod.stock_quantity <= 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors"
                            title="Decrement stock by 1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <span className="w-12 text-center font-bold font-mono text-stone-900 text-sm">
                            {prod.stock_quantity}
                          </span>

                          <button
                            onClick={() => handleStockChange(prod.id, prod.stock_quantity + 1)}
                            disabled={isUpdating}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors"
                            title="Increment stock by 1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>

                          {isSuccess && (
                            <span className="ml-1 text-emerald-600 animate-fade-in" title="Updated!">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Import Inventory CSV</h2>
                  <p className="text-xs text-stone-500">
                    Upload or paste real store catalog CSV with SKU, MRP, stock &amp; Hinglish aliases.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setImportResult(null);
                }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {/* File Upload Zone */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-xs font-medium text-stone-700 hover:border-emerald-500 hover:bg-emerald-50/30 transition-colors">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>Choose CSV File to Upload</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={loadDefaultCsvTemplate}
                  className="rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Load Current Catalog Template
                </button>
              </div>

              {/* Textarea for CSV edit / preview */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  CSV Data (Paste or Preview)
                </label>
                <textarea
                  rows={8}
                  value={csvContent}
                  onChange={e => setCsvContent(e.target.value)}
                  placeholder="sku,name,brand,category,pack_size,mrp,price,cost_price,stock_quantity,reorder_level,aliases&#10;OIL-DHARA-1L,Dhara Mustard Oil,Dhara,Edible Oils,1L,155,148,135,15,5,&quot;mustard oil,sarson tel&quot;"
                  className="w-full rounded-xl border border-stone-200 p-3 font-mono text-xs text-stone-900 placeholder-stone-400 shadow-inner focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Status Alert */}
              {importResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                    importResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importResult.success ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setImportResult(null);
                }}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={importing || !csvContent.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {importing ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Importing &amp; Syncing DB...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Import to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
