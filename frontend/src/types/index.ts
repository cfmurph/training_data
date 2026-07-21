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
  trainingPeaks: boolean;
  trainingPeaksConfigured: boolean;
  athlete: {
    id: number | string;
    name: string;
    username?: string;
    avatar?: string;
    city?: string;
    country?: string;
  } | null;
  provider: 'strava' | 'garmin' | 'trainingpeaks' | null;
}

// ── Training Plan types ─────────────────────────────────────────────

export type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type PlanPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';
export type WorkoutType =
  | 'REST'
  | 'RECOVERY'
  | 'ENDURANCE'
  | 'TEMPO'
  | 'THRESHOLD'
  | 'INTERVALS'
  | 'LONG_RIDE';

export interface PlannedWorkout {
  id: number;
  planId: number;
  workoutDate: string;
  workoutType: WorkoutType;
  targetDurationMinutes: number;
  targetDistanceKm: number;
  intensityZone: number;
  description: string;
  warmup?: string;
  mainSet?: string;
  cooldown?: string;
  completed: boolean;
  linkedActivityId?: string;
  planWeek: number;
  planDay: number;
}

export interface TrainingPlan {
  id: number;
  athleteId: string;
  athleteName: string;
  startDate: string;
  endDate: string;
  goalEvent?: string;
  weeklyHoursTarget: number;
  fitnessLevel: FitnessLevel;
  currentPhase: PlanPhase;
  active: boolean;
  createdAt: string;
  weightGoalKg: number;
}

export interface CreatePlanRequest {
  fitnessLevel: FitnessLevel;
  weeklyHours: number;
  startDate?: string;
  goalEvent?: string;
  goalWeightKg?: number;
}

// ── Performance assessment types ────────────────────────────────────

export type AssessmentStatus = 'COMPLETED' | 'PARTIAL' | 'MISSED' | 'LOW';

export interface DailyAssessment {
  date: string;
  planned: PlannedWorkout;
  actual: NormalizedActivity | null;
  complianceScore: number;
  feedback: string;
  status: AssessmentStatus;
}

export interface PlanCompliance {
  totalWorkouts: number;
  completedWorkouts: number;
  complianceRate: number;
  assessments: DailyAssessment[];
}

// ── Weight tracking types ───────────────────────────────────────────

export interface WeightEntry {
  id: number;
  athleteId: string;
  entryDate: string;
  weightKg: number;
  goalWeightKg: number;
  notes?: string;
  createdAt: string;
}

export interface WeightSummary {
  currentWeightKg: number;
  startingWeightKg: number;
  totalLossKg: number;
  goalWeightKg: number;
  sevenDayAvgKg: number;
  weeklyRateKg: number;
  estimatedDaysToGoal?: number;
  totalEntries: number;
  history: WeightEntry[];
}
