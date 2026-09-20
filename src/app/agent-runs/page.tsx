'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu
} from 'lucide-react';
import AgentTraceView from '@/components/AgentTraceView';
import { AgentRun, AgentEvent } from '@/lib/types';

export default function AgentRunsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agent-runs');
      if (res.ok) {
        const data = await res.json();
        const runsList = data.runs || [];
        setRuns(runsList);
        if (runsList.length > 0 && !selectedRunId) {
          selectRun(runsList[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectRun = async (runId: string) => {
    try {
      setSelectedRunId(runId);
      setEventsLoading(true);
      const res = await fetch(`/api/agent-runs?runId=${runId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Agent Execution Traces
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Audit every autonomous KiranaPilot run: input normalizer, Gemini intent parser, DB queries, atomic deductions, and WhatsApp confirmations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRuns}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Runs</span>
            </button>
          </div>
        </div>

        {/* Split Grid: Runs List (Left) vs Selected Run Detail (Right) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Runs Table (5 cols) */}
          <div className="lg:col-span-5 rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-stone-100 bg-stone-50/70 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                <span>Recent Agent Runs ({runs.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-stone-100 max-h-[700px] overflow-y-auto">
              {runs.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No agent runs logged yet. Send a message in the Customer Simulator.
                </div>
              ) : (
                runs.map(run => {
                  const isSelected = selectedRunId === run.id;
                  const timeStr = new Date(run.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <button
                      key={run.id}
                      onClick={() => selectRun(run.id)}
                      className={`w-full text-left p-3.5 transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/50 border-l-4 border-emerald-600'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-stone-400">{timeStr}</span>
                        <div className="flex items-center gap-1.5">
                          {run.status === 'SUCCESS' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Success
                            </span>
                          )}
                          {run.status === 'NEEDS_REVIEW' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Needs Review
                            </span>
                          )}
                          {run.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-stone-900 line-clamp-1">
                        &quot;{run.raw_input}&quot;
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                        <span>Intent: <strong className="text-stone-700">{run.intent || 'UNKNOWN'}</strong></span>
                        {run.latency_ms && (
                          <span className="flex items-center gap-1 font-mono text-stone-400">
                            <Clock className="h-3 w-3" />
                            {run.latency_ms}ms
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Run Events Detail (7 cols) */}
          <div className="lg:col-span-7">
            {eventsLoading ? (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
                Loading event trace...
              </div>
            ) : selectedRunId ? (
              <AgentTraceView
                events={selectedEvents}
                title={`Event Trace for Run: ${selectedRunId}`}
              />
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
                Select an agent run on the left to inspect its complete execution trace.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
