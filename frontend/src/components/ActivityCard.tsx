import { SPORT_ICONS, SPORT_COLORS, SPORT_LABELS, formatDistance, formatDuration, formatPace, formatDate } from '../utils/format';
import type { NormalizedActivity } from '../types';
import { Heart, TrendingUp, Zap, Mountain } from 'lucide-react';

interface ActivityCardProps {
  activity: NormalizedActivity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const icon = SPORT_ICONS[activity.type];
  const color = SPORT_COLORS[activity.type];

  return (
    <div className="card-sm hover:border-gray-700 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
              {activity.name}
            </p>
            <p className="text-xs text-gray-400">{formatDate(activity.startDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {SPORT_LABELS[activity.type]}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-800 text-gray-400">
            {activity.provider === 'strava' ? '⚡ Strava' : '🔵 Garmin'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activity.distanceMeters > 0 && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-semibold text-white">{formatDistance(activity.distanceMeters)}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="text-sm font-semibold text-white">{formatDuration(activity.durationSeconds)}</p>
          </div>
        </div>
        {activity.averageHeartRate && (
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Avg HR</p>
              <p className="text-sm font-semibold text-white">{activity.averageHeartRate} bpm</p>
            </div>
          </div>
        )}
        {activity.elevationGain > 0 && (
          <div className="flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Elevation</p>
              <p className="text-sm font-semibold text-white">{Math.round(activity.elevationGain)} m</p>
            </div>
          </div>
        )}
        {activity.averagePace && activity.distanceMeters > 100 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 flex items-center justify-center text-gray-500 flex-shrink-0 text-xs">⏱</div>
            <div>
              <p className="text-xs text-gray-500">Pace</p>
              <p className="text-sm font-semibold text-white">{formatPace(activity.averagePace)}</p>
            </div>
          </div>
        )}
        {activity.calories && (
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 flex items-center justify-center text-gray-500 flex-shrink-0 text-xs">🔥</div>
            <div>
              <p className="text-xs text-gray-500">Calories</p>
              <p className="text-sm font-semibold text-white">{activity.calories} kcal</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
