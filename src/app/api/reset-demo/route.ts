import { NextResponse } from 'next/server';
import { resetDatabaseToSeed } from '@/lib/db';

export async function POST() {
  try {
    await resetDatabaseToSeed();
    return NextResponse.json({
      success: true,
      message: 'Demo database and inventory successfully reset to original seed state.'
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to reset demo data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
