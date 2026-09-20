import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, updateProductStock } from '@/lib/db';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ products });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch inventory';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, stockQuantity } = body;

    if (!productId || typeof stockQuantity !== 'number') {
      return NextResponse.json({ error: 'productId and stockQuantity are required' }, { status: 400 });
    }

    const success = await updateProductStock(productId, stockQuantity);
    if (!success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, productId, newStock: stockQuantity });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update stock';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
