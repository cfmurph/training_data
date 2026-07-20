import { useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Scale, Plus, Trash2, TrendingDown, TrendingUp, Target,
  Loader2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useWeightSummary, useLogWeight, useDeleteWeightEntry } from '../hooks/useTraining';
import type { WeightEntry } from '../types';

// ── Log Form ──────────────────────────────────────────────────────────

function LogWeightForm() {
  const { mutate: log, isPending } = useLogWeight();
  const [form, setForm] = useState({
    weightKg: '' as string | number,
    date: format(new Date(), 'yyyy-MM-dd'),
    goalWeightKg: '' as string | number,
    notes: '',
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weightKg) return;
    log(
      {
        weightKg: +form.weightKg,
        date: form.date,
        goalWeightKg: form.goalWeightKg ? +form.goalWeightKg : undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setForm(f => ({ ...f, weightKg: '', notes: '' }));
          setTimeout(() => setSuccess(false), 2000);
        },
      }
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-brand-400" />
        Log Weight
      </h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3">
          <AlertCircle className="w-4 h-4" />
          Weight logged successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              placeholder="e.g. 80.5"
              required
              value={form.weightKg}
              onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Goal Weight (kg) <span className="text-gray-600">— updates goal for all future entries</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="Optional"
            value={form.goalWeightKg}
            onChange={e => setForm(f => ({ ...f, goalWeightKg: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes (optional)</label>
          <input
            type="text"
            placeholder="Morning, after workout…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !form.weightKg}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
          Save Entry
        </button>
      </form>
    </div>
  );
}

// ── Stats Cards ───────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

function SummaryCard({ label, value, sub, color = 'text-white', icon }: SummaryCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Weight Chart ──────────────────────────────────────────────────────

interface ChartEntry {
  date: string;
  weight: number;
  avg7?: number;
  goal?: number;
}

function WeightChart({ history, goalWeightKg }: { history: WeightEntry[]; goalWeightKg: number }) {
  const [range, setRange] = useState<30 | 90 | 180 | 365>(90);

  const cutoff = subDays(new Date(), range);
  const filtered = history.filter(e => parseISO(e.entryDate) >= cutoff);

  // Compute 7-day rolling average
  const chartData: ChartEntry[] = filtered.map((entry, i) => {
    const window = filtered.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, e) => s + e.weightKg, 0) / window.length;
    return {
      date: format(parseISO(entry.entryDate), 'MMM d'),
      weight: entry.weightKg,
      avg7: Math.round(avg * 10) / 10,
      goal: goalWeightKg > 0 ? goalWeightKg : undefined,
    };
  });

  const weights = filtered.map(e => e.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value} kg
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Weight Trend</h2>
        <div className="flex gap-1">
          {([30, 90, 180, 365] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                range === r
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {r === 365 ? '1y' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
              interval={Math.max(0, Math.floor(chartData.length / 8))} />
            <YAxis domain={[minW, maxW]} tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={v => `${v}kg`} width={55} />
            <Tooltip content={customTooltip} />
            {goalWeightKg > 0 && (
              <ReferenceLine y={goalWeightKg} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: `Goal: ${goalWeightKg}kg`, fill: '#10b981', fontSize: 11, position: 'right' }} />
            )}
            <Area type="monotone" dataKey="weight" name="Weight"
              stroke="#6366f1" fill="url(#weightGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="avg7" name="7-day avg"
              stroke="#f59e0b" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-indigo-500 rounded inline-block" />Weight
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500 rounded inline-block" />7-day avg
        </span>
        {goalWeightKg > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" />Goal
          </span>
        )}
      </div>
    </div>
  );
}

// ── History Table ─────────────────────────────────────────────────────

function HistoryTable({ history }: { history: WeightEntry[] }) {
  const { mutate: del } = useDeleteWeightEntry();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? history : history.slice(0, 10);

  if (history.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">History</h2>
        <span className="text-xs text-gray-500">{history.length} entries</span>
      </div>
      <div className="divide-y divide-gray-800">
        {shown.map((entry, i) => {
          const prev = history[i + 1];
          const delta = prev ? entry.weightKg - prev.weightKg : null;
          return (
            <div key={entry.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">
                  {format(parseISO(entry.entryDate), 'EEE, MMM d, yyyy')}
                </p>
                {entry.notes && <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                {delta !== null && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                    {delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10} kg
                  </span>
                )}
                <span className="text-base font-bold text-white w-16 text-right">
                  {entry.weightKg} kg
                </span>
                <button
                  onClick={() => { if (confirm('Delete this entry?')) del(entry.id); }}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {history.length > 10 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-3 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors border-t border-gray-800 hover:bg-gray-800/30"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Show less' : `Show ${history.length - 10} more`}
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function WeightTrackerPage() {
  const { data: summary, isLoading } = useWeightSummary();

  const lossKg = summary?.totalLossKg ?? 0;
  const weeklyRate = summary?.weeklyRateKg ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <Scale className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Weight Tracker</h1>
          <p className="text-sm text-gray-400">Daily weight logging and trend analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Form + Stats */}
        <div className="space-y-4">
          <LogWeightForm />

          {!isLoading && summary && summary.totalEntries > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Current"
                  value={`${summary.currentWeightKg} kg`}
                  sub="latest entry"
                  color="text-white"
                  icon={<Scale className="w-3.5 h-3.5 text-gray-500" />}
                />
                <SummaryCard
                  label="7-day avg"
                  value={`${Math.round(summary.sevenDayAvgKg * 10) / 10} kg`}
                  sub="rolling average"
                  color="text-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Total Change"
                  value={`${lossKg >= 0 ? '-' : '+'}${Math.abs(Math.round(lossKg * 10) / 10)} kg`}
                  sub={lossKg >= 0 ? 'lost since start' : 'gained since start'}
                  color={lossKg >= 0 ? 'text-emerald-400' : 'text-red-400'}
                  icon={lossKg >= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                />
                <SummaryCard
                  label="Weekly Rate"
                  value={`${weeklyRate >= 0 ? '-' : '+'}${Math.abs(Math.round(weeklyRate * 100) / 100)} kg/w`}
                  sub="last 14 days"
                  color={weeklyRate >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>

              {summary.goalWeightKg > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-medium text-white">Goal Progress</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Start: {summary.startingWeightKg} kg</span>
                      <span className="text-emerald-400">Goal: {summary.goalWeightKg} kg</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0,
                            (lossKg / (summary.startingWeightKg - summary.goalWeightKg)) * 100
                          ))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {Math.round(Math.max(0, summary.currentWeightKg - summary.goalWeightKg) * 10) / 10} kg to go
                      </span>
                      {summary.estimatedDaysToGoal && (
                        <span>~{summary.estimatedDaysToGoal} days at current rate</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          )}
        </div>

        {/* Right column: Chart + History */}
        <div className="lg:col-span-2 space-y-6">
          {summary && summary.history.length > 0 ? (
            <>
              <WeightChart
                history={[...summary.history].reverse()}
                goalWeightKg={summary.goalWeightKg}
              />
              <HistoryTable history={summary.history} />
            </>
          ) : !isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-900 border border-gray-800 border-dashed rounded-2xl text-center p-8">
              <Scale className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-lg font-bold text-white mb-2">Start Tracking</p>
              <p className="text-sm text-gray-400">
                Log your first weight entry to see trends and progress towards your goal.
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
