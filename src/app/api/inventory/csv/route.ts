import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getAllProducts, updateProductStock } from '@/lib/db';
import { Product } from '@/lib/types';

interface CsvRow {
  sku: string;
  name: string;
  brand?: string;
  category: string;
  variant?: string;
  pack_size?: string;
  price_paise: string | number;
  stock_quantity: string | number;
  reorder_level: string | number;
  aliases?: string;
}

/**
 * GET /api/inventory/csv: Export live inventory as CSV
 */
export async function GET() {
  try {
    const products = await getAllProducts();
    const rows = products.map(p => ({
      sku: p.sku,
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      variant: p.variant || '',
      pack_size: p.pack_size || '',
      price_paise: p.price_paise,
      price_inr: (p.price_paise / 100).toFixed(2),
      stock_quantity: p.stock_quantity,
      reorder_level: p.reorder_level,
      status: p.stock_quantity === 0 ? 'OUT_OF_STOCK' : p.stock_quantity <= p.reorder_level ? 'LOW_STOCK' : 'IN_STOCK'
    }));

    const csv = Papa.unparse(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="kiranapilot_inventory_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to export CSV';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/inventory/csv: Import & sync inventory CSV with live database
 */
export async function POST(req: NextRequest) {
  try {
    let csvContent = '';
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        csvContent = await file.text();
      }
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
    }

    if (!csvContent.trim()) {
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
    }

    const parsed = Papa.parse<CsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors && parsed.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parsing error', details: parsed.errors }, { status: 400 });
    }

    const products = await getAllProducts();
    let updatedCount = 0;
    const errors: string[] = [];

    for (const row of parsed.data) {
      if (!row.sku) continue;

      const existing = products.find(p => p.sku.toLowerCase() === row.sku.toLowerCase());
      if (existing) {
        const newStock = parseInt(String(row.stock_quantity || existing.stock_quantity), 10);
        if (!isNaN(newStock) && newStock >= 0) {
          await updateProductStock(existing.id, newStock);
          updatedCount++;
        }
      } else {
        errors.push(`SKU ${row.sku} not found in catalog`);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalRows: parsed.data.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synchronized ${updatedCount} products with live inventory.`
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to import CSV';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
