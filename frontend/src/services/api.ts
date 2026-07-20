import axios from 'axios';
import type {
  AuthStatus, NormalizedActivity, TrainingStats, WeeklyVolume,
  TrainingPlan, PlannedWorkout, CreatePlanRequest, PlanCompliance,
  DailyAssessment, WeightEntry, WeightSummary,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export async function getAuthStatus(): Promise<AuthStatus> {
  const { data } = await api.get<AuthStatus>('/auth/status');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getActivities(page = 1, perPage = 30): Promise<{ activities: NormalizedActivity[]; total: number }> {
  const { data } = await api.get('/activities', { params: { page, per_page: perPage } });
  return data;
}

export async function getRecentActivities(limit = 5): Promise<{ activities: NormalizedActivity[] }> {
  const { data } = await api.get('/activities/recent', { params: { limit } });
  return data;
}

export async function getStatsSummary(): Promise<{ stats: TrainingStats; athleteStats?: any; provider: string }> {
  const { data } = await api.get('/stats/summary');
  return data;
}

export async function getWeeklyStats(weeks = 12): Promise<{ weeklyVolume: WeeklyVolume[]; weeks: number }> {
  const { data } = await api.get('/stats/weekly', { params: { weeks } });
  return data;
}

// ── Training Plan API ───────────────────────────────────────────────

export async function getActivePlan(): Promise<TrainingPlan | null> {
  const { data, status } = await api.get('/plan/active');
  if (status === 404) return null;
  return data;
}

export async function getAllPlans(): Promise<TrainingPlan[]> {
  const { data } = await api.get('/plan/all');
  return data;
}

export async function createPlan(req: CreatePlanRequest): Promise<TrainingPlan> {
  const { data } = await api.post('/plan/create', req);
  return data;
}

export async function deactivatePlan(planId: number): Promise<void> {
  await api.delete(`/plan/${planId}`);
}

export async function getPlanWorkouts(
  planId: number, from?: string, to?: string
): Promise<PlannedWorkout[]> {
  const { data } = await api.get(`/plan/${planId}/workouts`, {
    params: { from, to },
  });
  return data;
}

export async function getWeekWorkouts(planId: number, week: number): Promise<PlannedWorkout[]> {
  const { data } = await api.get(`/plan/${planId}/week/${week}`);
  return data;
}

export async function completeWorkout(
  workoutId: number, linkedActivityId?: string
): Promise<PlannedWorkout> {
  const { data } = await api.post(`/plan/workout/${workoutId}/complete`, { linkedActivityId });
  return data;
}

export async function getPlanAssessment(planId: number): Promise<PlanCompliance> {
  const { data } = await api.get(`/plan/${planId}/assessment`);
  return data;
}

export async function getWeekAssessment(planId: number): Promise<DailyAssessment[]> {
  const { data } = await api.get(`/plan/${planId}/assessment/week`);
  return data;
}

// ── Weight Tracking API ─────────────────────────────────────────────

export async function logWeight(payload: {
  weightKg: number;
  date?: string;
  goalWeightKg?: number;
  notes?: string;
}): Promise<WeightEntry> {
  const { data } = await api.post('/weight/log', payload);
  return data;
}

export async function getWeightHistory(from?: string, to?: string): Promise<WeightEntry[]> {
  const { data } = await api.get('/weight/history', { params: { from, to } });
  return data;
}

export async function getWeightSummary(): Promise<WeightSummary> {
  const { data } = await api.get('/weight/summary');
  return data;
}

export async function deleteWeightEntry(id: number): Promise<void> {
  await api.delete(`/weight/${id}`);
}
