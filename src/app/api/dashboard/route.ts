import { NextResponse } from 'next/server';
import { getDashboardMetrics, getAllOrders, getAllAgentRuns } from '@/lib/db';

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    const recentOrders = await getAllOrders(15);
    const recentRuns = await getAllAgentRuns(10);

    return NextResponse.json({
      metrics,
      recentOrders,
      recentRuns
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
