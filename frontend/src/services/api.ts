import axios from 'axios';
import type { AuthStatus, NormalizedActivity, TrainingStats, WeeklyVolume } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
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
