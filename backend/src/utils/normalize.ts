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

const STRAVA_TYPE_MAP: Record<string, SportType> = {
  Run: 'run',
  Ride: 'ride',
  Swim: 'swim',
  Walk: 'walk',
  Hike: 'hike',
  WeightTraining: 'strength',
  Yoga: 'yoga',
  VirtualRide: 'ride',
  VirtualRun: 'run',
  TrailRun: 'run',
  Workout: 'strength',
};

const GARMIN_TYPE_MAP: Record<string, SportType> = {
  RUNNING: 'run',
  CYCLING: 'ride',
  SWIMMING: 'swim',
  WALKING: 'walk',
  HIKING: 'hike',
  STRENGTH_TRAINING: 'strength',
  YOGA: 'yoga',
  FITNESS_EQUIPMENT: 'strength',
  MULTI_SPORT: 'other',
};

export function normalizeStravaActivity(raw: any): NormalizedActivity {
  return {
    id: `strava-${raw.id}`,
    provider: 'strava',
    name: raw.name,
    type: STRAVA_TYPE_MAP[raw.sport_type || raw.type] || 'other',
    startDate: raw.start_date,
    durationSeconds: raw.moving_time || raw.elapsed_time,
    distanceMeters: raw.distance || 0,
    elevationGain: raw.total_elevation_gain || 0,
    averageHeartRate: raw.average_heartrate,
    maxHeartRate: raw.max_heartrate,
    averageSpeed: raw.average_speed,
    averagePace: raw.average_speed ? 1000 / raw.average_speed : undefined,
    calories: raw.calories,
    kudos: raw.kudos_count,
    map: raw.map ? {
      polyline: raw.map.polyline,
      summaryPolyline: raw.map.summary_polyline,
    } : undefined,
  };
}

export function normalizeGarminActivity(raw: any): NormalizedActivity {
  return {
    id: `garmin-${raw.activityId}`,
    provider: 'garmin',
    name: raw.activityName || raw.activityType || 'Activity',
    type: GARMIN_TYPE_MAP[raw.activityType] || 'other',
    startDate: new Date(raw.startTimeInSeconds * 1000).toISOString(),
    durationSeconds: raw.durationInSeconds || 0,
    distanceMeters: (raw.distanceInMeters || 0),
    elevationGain: raw.totalElevationGainInMeters || 0,
    averageHeartRate: raw.averageHeartRateInBeatsPerMinute,
    maxHeartRate: raw.maxHeartRateInBeatsPerMinute,
    averageSpeed: raw.averageSpeedInMetersPerSecond,
    averagePace: raw.averageSpeedInMetersPerSecond
      ? 1000 / raw.averageSpeedInMetersPerSecond
      : undefined,
    calories: raw.activeKilocalories,
  };
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
  recentPR?: { type: SportType; distance: string; time: string; date: string } | null;
}

export interface WeeklyVolume {
  weekStart: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  count: number;
  activities: SportType[];
}

export function computeStats(activities: NormalizedActivity[]): TrainingStats {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const byType: TrainingStats['byType'] = {} as any;
  let totalHR = 0;
  let hrCount = 0;
  let longestActivity: NormalizedActivity | null = null;

  for (const act of sorted) {
    if (!byType[act.type]) {
      byType[act.type] = { count: 0, distanceMeters: 0, durationSeconds: 0 };
    }
    byType[act.type].count++;
    byType[act.type].distanceMeters += act.distanceMeters;
    byType[act.type].durationSeconds += act.durationSeconds;

    if (act.averageHeartRate) {
      totalHR += act.averageHeartRate;
      hrCount++;
    }

    if (!longestActivity || act.distanceMeters > longestActivity.distanceMeters) {
      longestActivity = act;
    }
  }

  const weeklyMap = new Map<string, WeeklyVolume>();
  for (const act of sorted) {
    const d = new Date(act.startDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().split('T')[0];

    if (!weeklyMap.has(key)) {
      weeklyMap.set(key, {
        weekStart: key,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        count: 0,
        activities: [],
      });
    }
    const week = weeklyMap.get(key)!;
    week.totalDistanceMeters += act.distanceMeters;
    week.totalDurationSeconds += act.durationSeconds;
    week.count++;
    if (!week.activities.includes(act.type)) week.activities.push(act.type);
  }

  const weeklyVolume = Array.from(weeklyMap.values()).sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );

  return {
    totalActivities: activities.length,
    totalDistanceMeters: activities.reduce((s, a) => s + a.distanceMeters, 0),
    totalDurationSeconds: activities.reduce((s, a) => s + a.durationSeconds, 0),
    totalElevationGain: activities.reduce((s, a) => s + a.elevationGain, 0),
    avgHeartRate: hrCount > 0 ? Math.round(totalHR / hrCount) : null,
    byType,
    weeklyVolume,
    longestActivity,
  };
}
