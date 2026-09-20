import { NextRequest, NextResponse } from 'next/server';
import { getAllAgentRuns, getAgentRunEvents } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');

    if (runId) {
      const events = await getAgentRunEvents(runId);
      return NextResponse.json({ events });
    }

    const runs = await getAllAgentRuns(30);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch agent runs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
