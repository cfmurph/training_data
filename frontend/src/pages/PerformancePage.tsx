import { format, parseISO } from 'date-fns';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
  Activity, CheckCircle, XCircle, Clock, TrendingUp,
  Loader2, Bike, AlertCircle, Zap,
} from 'lucide-react';
import { useActivePlan, usePlanAssessment, useWeekAssessment } from '../hooks/useTraining';
import type { DailyAssessment, AssessmentStatus, PlanCompliance } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AssessmentStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  COMPLETED: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-950 border-emerald-800',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    label: 'Completed',
  },
  PARTIAL: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-950 border-yellow-800',
    icon: <AlertCircle className="w-4 h-4 text-yellow-400" />,
    label: 'Partial',
  },
  MISSED: {
    color: 'text-red-400',
    bg: 'bg-red-950 border-red-800',
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    label: 'Missed',
  },
  LOW: {
    color: 'text-orange-400',
    bg: 'bg-orange-950 border-orange-800',
    icon: <AlertCircle className="w-4 h-4 text-orange-400" />,
    label: 'Low effort',
  },
};

const SCORE_COLOR = (score: number) =>
  score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 30 ? '#f97316' : '#ef4444';

// ── Gauge / Score Ring ────────────────────────────────────────────────

function ComplianceGauge({ rate }: { rate: number }) {
  const data = [{ value: rate, fill: SCORE_COLOR(rate) }];
  return (
    <div className="relative w-32 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius={42} outerRadius={62} data={data} startAngle={200} endAngle={-20}>
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#1f2937' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(rate)}%</span>
        <span className="text-xs text-gray-400">compliance</span>
      </div>
    </div>
  );
}

// ── Daily Assessment Card ─────────────────────────────────────────────

function DayCard({ assessment }: { assessment: DailyAssessment }) {
  const cfg = STATUS_CONFIG[assessment.status] ?? STATUS_CONFIG.MISSED;
  const planned = assessment.planned;

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 ${cfg.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {format(parseISO(assessment.date), 'EEE, MMM d')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {planned.workoutType.charAt(0) + planned.workoutType.slice(1).toLowerCase().replace('_', ' ')}
            {planned.targetDurationMinutes > 0 && ` · ${planned.targetDurationMinutes} min`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {assessment.status !== 'MISSED' && (
            <span className="text-xs font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded">
              {assessment.complianceScore}
            </span>
          )}
          {cfg.icon}
        </div>
      </div>

      {assessment.actual && (
        <div className="flex items-center gap-3 text-xs text-gray-300 mb-2 bg-gray-800/60 rounded-lg px-3 py-2">
          <Bike className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span>{assessment.actual.name}</span>
          <span className="ml-auto text-gray-400">
            {Math.round(assessment.actual.durationSeconds / 60)} min
          </span>
        </div>
      )}

      <p className={`text-xs ${cfg.color} leading-relaxed`}>{assessment.feedback}</p>
    </div>
  );
}

// ── Week Bar Chart ────────────────────────────────────────────────────

function WeekScoreChart({ assessments }: { assessments: DailyAssessment[] }) {
  const data = assessments
    .filter(a => a.planned.workoutType !== 'REST')
    .map(a => ({
      day: format(parseISO(a.date), 'EEE'),
      score: a.complianceScore,
      status: a.status,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-brand-400" />
        This Week's Scores
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <Tooltip
            formatter={(v: number) => [`${v}/100`, 'Score']}
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={SCORE_COLOR(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Overall Compliance Summary ────────────────────────────────────────

function ComplianceSummary({ compliance }: { compliance: PlanCompliance }) {
  const { totalWorkouts, completedWorkouts, complianceRate } = compliance;
  const missed = totalWorkouts - completedWorkouts;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
        <Zap className="w-4 h-4 text-brand-400" />
        Plan Compliance
      </h3>

      <div className="flex flex-col items-center mb-5">
        <ComplianceGauge rate={complianceRate} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xl font-bold text-white">{totalWorkouts}</p>
          <p className="text-xs text-gray-400">planned</p>
        </div>
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-3">
          <p className="text-xl font-bold text-emerald-400">{completedWorkouts}</p>
          <p className="text-xs text-emerald-600">done</p>
        </div>
        <div className="bg-red-950 border border-red-900 rounded-xl p-3">
          <p className="text-xl font-bold text-red-400">{missed}</p>
          <p className="text-xs text-red-600">missed</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400 text-center">
        {complianceRate >= 80 && '🎉 Excellent compliance — keep it up!'}
        {complianceRate >= 60 && complianceRate < 80 && '👍 Good consistency. Aim for 80%+.'}
        {complianceRate >= 40 && complianceRate < 60 && '💪 Room for improvement. Try to hit each planned session.'}
        {complianceRate < 40 && '⚠️ Low compliance. Reassess your schedule or adjust the plan.'}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: compliance, isLoading: compLoading } = usePlanAssessment(plan?.id);
  const { data: weekAssessments = [], isLoading: weekLoading } = useWeekAssessment(plan?.id);

  const isLoading = planLoading || compLoading || weekLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-24 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
          <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Active Plan</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            Create a training plan first, then come back here to see your daily performance assessments.
          </p>
          <a href="/plan"
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all inline-block">
            Go to Training Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Performance</h1>
          <p className="text-sm text-gray-400">
            Daily assessment vs.{' '}
            <span className="text-brand-400">{plan.goalEvent || 'your training plan'}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compliance gauge + week chart */}
        <div className="space-y-4">
          {compliance && <ComplianceSummary compliance={compliance} />}

          {/* Plan info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Plan Info</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Phase</span>
                <span className="text-white font-medium">{plan.currentPhase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Level</span>
                <span className="text-white font-medium">{plan.fitnessLevel.charAt(0) + plan.fitnessLevel.slice(1).toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weekly target</span>
                <span className="text-white font-medium">{plan.weeklyHoursTarget}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">End date</span>
                <span className="text-white font-medium">{format(parseISO(plan.endDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: This week */}
        <div className="lg:col-span-2 space-y-4">
          {weekAssessments.length > 0 && (
            <WeekScoreChart assessments={weekAssessments} />
          )}

          <div>
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              This Week's Daily Breakdown
            </h3>

            {weekAssessments.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
                <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No assessments yet this week.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Activity data from Strava or Garmin will be compared against your plan automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {weekAssessments.map(a => (
                  <DayCard key={a.date} assessment={a} />
                ))}
              </div>
            )}
          </div>

          {/* Data source note */}
          <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p>
              Performance scores are computed by comparing your planned workouts against activities
              pulled from your connected Strava or Garmin account. Scores update automatically
              each time you load this page. Connect Training Peaks for additional data sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
