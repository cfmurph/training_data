import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
         getDay, isSameMonth, isToday, isSameDay } from 'date-fns';
import { Calendar, Plus, ChevronLeft, ChevronRight, Target, Bike,
         Clock, Zap, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import {
  useActivePlan, useCreatePlan, useDeactivatePlan, usePlanWorkouts,
} from '../hooks/useTraining';
import type { FitnessLevel, PlannedWorkout, WorkoutType, CreatePlanRequest } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

const ZONE_COLORS: Record<number, string> = {
  0: 'bg-gray-700',
  1: 'bg-blue-900 text-blue-200',
  2: 'bg-emerald-900 text-emerald-200',
  3: 'bg-yellow-900 text-yellow-200',
  4: 'bg-orange-900 text-orange-200',
  5: 'bg-red-900 text-red-200',
};

const TYPE_LABELS: Record<WorkoutType, string> = {
  REST: 'Rest',
  RECOVERY: 'Recovery',
  ENDURANCE: 'Endurance',
  TEMPO: 'Tempo',
  THRESHOLD: 'Threshold',
  INTERVALS: 'Intervals',
  LONG_RIDE: 'Long Ride',
};

const TYPE_COLORS: Record<WorkoutType, string> = {
  REST: 'bg-gray-800 text-gray-400 border-gray-700',
  RECOVERY: 'bg-blue-950 text-blue-300 border-blue-800',
  ENDURANCE: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  TEMPO: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  THRESHOLD: 'bg-orange-950 text-orange-300 border-orange-800',
  INTERVALS: 'bg-red-950 text-red-300 border-red-800',
  LONG_RIDE: 'bg-purple-950 text-purple-300 border-purple-800',
};

const TYPE_ICONS: Record<WorkoutType, string> = {
  REST:      '😴',
  RECOVERY:  '🌊',
  ENDURANCE: '🚴',
  TEMPO:     '⚡',
  THRESHOLD: '🔥',
  INTERVALS: '💥',
  LONG_RIDE: '🏔️',
};

function ZoneBadge({ zone }: { zone: number }) {
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ZONE_COLORS[zone] || 'bg-gray-700'}`}>
      Z{zone}
    </span>
  );
}

// ── Create Plan Form ──────────────────────────────────────────────────

function CreatePlanForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreatePlan();
  const [form, setForm] = useState<CreatePlanRequest>({
    fitnessLevel: 'INTERMEDIATE',
    weeklyHours: 10,
    goalEvent: '',
    goalWeightKg: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create({
      ...form,
      startDate: undefined, // let backend default to next Monday
    }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-brand-400" />
            Create Cycling Plan
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fitness Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as FitnessLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fitnessLevel: level }))}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    form.fitnessLevel === level
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {form.fitnessLevel === 'BEGINNER' && '8-week base plan • 5–8 h/week • Zone 2 focus'}
              {form.fitnessLevel === 'INTERMEDIATE' && '12-week plan (Base + Build) • 8–14 h/week • Tempo & threshold work'}
              {form.fitnessLevel === 'ADVANCED' && '16-week plan (Base → Build → Peak) • 14–20 h/week • Full periodization'}
            </p>
          </div>

          {/* Weekly Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weekly Hours Target: <span className="text-brand-400">{form.weeklyHours}h</span>
            </label>
            <input
              type="range"
              min={5} max={20} step={1}
              value={form.weeklyHours}
              onChange={e => setForm(f => ({ ...f, weeklyHours: +e.target.value }))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5h</span><span>12h</span><span>20h</span>
            </div>
          </div>

          {/* Goal Event */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Goal Event <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Gran Fondo 2025, Century Ride…"
              value={form.goalEvent || ''}
              onChange={e => setForm(f => ({ ...f, goalEvent: e.target.value || undefined }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Goal Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Goal Weight <span className="text-gray-500">(kg, optional)</span>
            </label>
            <input
              type="number"
              min={0} max={300} step={0.5}
              placeholder="0 = no weight goal"
              value={form.goalWeightKg || ''}
              onChange={e => setForm(f => ({ ...f, goalWeightKg: +e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-600 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Workout Detail Modal ──────────────────────────────────────────────

function WorkoutModal({ workout, onClose }: { workout: PlannedWorkout; onClose: () => void }) {
  const colorClass = TYPE_COLORS[workout.workoutType];
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className={`bg-gray-900 border rounded-2xl max-w-md w-full p-6 shadow-2xl ${colorClass}`}
           onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-3xl">{TYPE_ICONS[workout.workoutType]}</span>
            <h3 className="text-lg font-bold text-white mt-1">
              {TYPE_LABELS[workout.workoutType]}
            </h3>
            <p className="text-sm text-gray-400">
              {format(parseISO(workout.workoutDate), 'EEEE, MMM d')}
              {' · Week '}{workout.planWeek}
            </p>
          </div>
          <div className="text-right">
            {workout.workoutType !== 'REST' && (
              <>
                <ZoneBadge zone={workout.intensityZone} />
                <p className="text-sm text-gray-300 mt-1">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {workout.targetDurationMinutes} min
                </p>
                {workout.targetDistanceKm > 0 && (
                  <p className="text-xs text-gray-400">~{workout.targetDistanceKm} km</p>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">{workout.description}</p>

        {(workout.warmup || workout.mainSet || workout.cooldown) && (
          <div className="space-y-3 border-t border-gray-700 pt-4">
            {workout.warmup && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Warm-up</p>
                <p className="text-sm text-gray-300">{workout.warmup}</p>
              </div>
            )}
            {workout.mainSet && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Main Set</p>
                <p className="text-sm text-gray-200 font-medium">{workout.mainSet}</p>
              </div>
            )}
            {workout.cooldown && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cool-down</p>
                <p className="text-sm text-gray-300">{workout.cooldown}</p>
              </div>
            )}
          </div>
        )}

        {workout.completed && (
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        )}

        <button onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-all">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────

function WorkoutCalendar({ planId }: { planId: number }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<PlannedWorkout | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const from = format(monthStart, 'yyyy-MM-dd');
  const to   = format(monthEnd,   'yyyy-MM-dd');
  const { data: workouts = [], isLoading } = usePlanWorkouts(planId, from, to);

  const workoutByDate: Record<string, PlannedWorkout> = {};
  workouts.forEach(w => { workoutByDate[w.workoutDate] = w; });

  const startDay = getDay(monthStart); // 0=Sun
  const blanks = startDay === 0 ? 6 : startDay - 1; // shift to Mon-start

  return (
    <>
      {selectedWorkout && (
        <WorkoutModal workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: blanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const workout = workoutByDate[dateKey];
              const today   = isToday(day);
              const inMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={dateKey}
                  onClick={() => workout && setSelectedWorkout(workout)}
                  className={`relative aspect-square flex flex-col items-center justify-start p-1 rounded-xl text-xs transition-all ${
                    workout ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'
                  } ${
                    today ? 'ring-2 ring-brand-500' : ''
                  } ${
                    workout
                      ? TYPE_COLORS[workout.workoutType].split(' ').slice(0, 2).join(' ')
                      : 'bg-gray-800/50'
                  } ${inMonth ? '' : 'opacity-30'}`}
                >
                  <span className={`font-semibold ${today ? 'text-brand-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {workout && workout.workoutType !== 'REST' && (
                    <span className="mt-0.5 text-center leading-tight opacity-90">
                      {TYPE_ICONS[workout.workoutType]}
                    </span>
                  )}
                  {workout?.completed && (
                    <CheckCircle className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Weekly Summary ────────────────────────────────────────────────────

function WeeklySummaryBar({ planId }: { planId: number }) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const from = format(monday, 'yyyy-MM-dd');
  const to   = format(new Date(monday.getTime() + 6 * 86400000), 'yyyy-MM-dd');
  const { data: workouts = [] } = usePlanWorkouts(planId, from, to);

  const totalMinutes = workouts
    .filter(w => w.workoutType !== 'REST')
    .reduce((s, w) => s + w.targetDurationMinutes, 0);
  const done = workouts.filter(w => w.completed).length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">This Week</p>
        <p className="text-2xl font-bold text-white">{workouts.length}</p>
        <p className="text-xs text-gray-400">sessions planned</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Volume</p>
        <p className="text-2xl font-bold text-white">{Math.round(totalMinutes / 60 * 10) / 10}h</p>
        <p className="text-xs text-gray-400">training time</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Done</p>
        <p className="text-2xl font-bold text-emerald-400">{done}</p>
        <p className="text-xs text-gray-400">completed</p>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────

function Legend() {
  const types: WorkoutType[] = ['REST', 'RECOVERY', 'ENDURANCE', 'TEMPO', 'THRESHOLD', 'INTERVALS', 'LONG_RIDE'];
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Workout Types</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {types.map(t => (
          <div key={t} className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${TYPE_COLORS[t]}`}>
            <span>{TYPE_ICONS[t]}</span>
            <span>{TYPE_LABELS[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function TrainingPlanPage() {
  const { data: plan, isLoading } = useActivePlan();
  const { mutate: deactivate, isPending: deactivating } = useDeactivatePlan();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showCreate && <CreatePlanForm onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center justify-center">
            <Bike className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Training Plan</h1>
            <p className="text-sm text-gray-400">Periodized cycling plan with daily workouts</p>
          </div>
        </div>

        {plan ? (
          <div className="flex gap-2">
            <button
              onClick={() => { if (confirm('Deactivate current plan?')) deactivate(plan.id); }}
              disabled={deactivating}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-700 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:block">End Plan</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        )}
      </div>

      {!plan ? (
        /* Empty state */
        <div className="text-center py-24 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
          <Bike className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Active Plan</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            Generate a personalized periodized cycling plan tailored to your fitness level and available time.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all"
          >
            Create My Plan
          </button>
        </div>
      ) : (
        <>
          {/* Plan meta card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">
                    {plan.currentPhase} PHASE
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded-full font-medium">
                    {plan.fitnessLevel}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {plan.goalEvent || `${plan.fitnessLevel.charAt(0) + plan.fitnessLevel.slice(1).toLowerCase()} Cycling Plan`}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {format(parseISO(plan.startDate), 'MMM d')} – {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{plan.weeklyHoursTarget}h</p>
                  <p className="text-xs text-gray-500">per week</p>
                </div>
                {plan.weightGoalKg > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{plan.weightGoalKg}kg</p>
                    <p className="text-xs text-gray-500">weight goal</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* This week summary */}
          <WeeklySummaryBar planId={plan.id} />

          {/* Calendar */}
          <WorkoutCalendar planId={plan.id} />

          {/* Legend */}
          <Legend />
        </>
      )}
    </div>
  );
}
