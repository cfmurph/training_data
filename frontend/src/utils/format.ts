import type { SportType } from '../types';

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export function formatSpeed(metersPerSecond: number): string {
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekLabel(weekStart: string): string {
  return new Date(weekStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const SPORT_ICONS: Record<SportType, string> = {
  run: '🏃',
  ride: '🚴',
  swim: '🏊',
  walk: '🚶',
  hike: '🥾',
  strength: '🏋️',
  yoga: '🧘',
  other: '⚡',
};

export const SPORT_COLORS: Record<SportType, string> = {
  run: '#f97316',
  ride: '#3b82f6',
  swim: '#06b6d4',
  walk: '#22c55e',
  hike: '#a3e635',
  strength: '#a855f7',
  yoga: '#ec4899',
  other: '#6b7280',
};

export const SPORT_LABELS: Record<SportType, string> = {
  run: 'Running',
  ride: 'Cycling',
  swim: 'Swimming',
  walk: 'Walking',
  hike: 'Hiking',
  strength: 'Strength',
  yoga: 'Yoga',
  other: 'Other',
};
