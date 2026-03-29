export type SportType =
  | 'run'
  | 'ride'
  | 'swim'
  | 'walk'
  | 'hike'
  | 'strength'
  | 'yoga'
  | 'other';

export interface NormalizedActivity {
  id: string;
  provider: 'strava' | 'garmin';
  name: string;
  type: SportType;
  startDate: string;
  durationSeconds: number;
  distanceMeters: number;
  elevationGain: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePace?: number;
  averageSpeed?: number;
  calories?: number;
  kudos?: number;
  map?: {
    polyline?: string;
    summaryPolyline?: string;
  };
}

export interface WeeklyVolume {
  weekStart: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  count: number;
  activities: SportType[];
}

export interface TrainingStats {
  totalActivities: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalElevationGain: number;
  avgHeartRate: number | null;
  byType: Record<SportType, { count: number; distanceMeters: number; durationSeconds: number }>;
  weeklyVolume: WeeklyVolume[];
  longestActivity: NormalizedActivity | null;
}

export interface AuthStatus {
  strava: boolean;
  garmin: boolean;
  athlete: {
    id: number | string;
    name: string;
    username?: string;
    avatar?: string;
    city?: string;
    country?: string;
  } | null;
  provider: 'strava' | 'garmin' | null;
}
