import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuthStatus, useStatsSummary, useWeeklyStats, useRecentActivities } from '../hooks/useTraining';
import { formatDistance, formatDuration } from '../utils/format';
import StatCard from '../components/StatCard';
import WeeklyVolumeChart from '../components/WeeklyVolumeChart';
import SportBreakdownChart from '../components/SportBreakdownChart';
import ActivityCard from '../components/ActivityCard';
import LoadingSpinner from '../components/LoadingSpinner';

type VolumeMetric = 'distance' | 'duration' | 'count';

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const justConnected = searchParams.get('connected');
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric>('distance');
  const [weekRange, setWeekRange] = useState(12);

  const { data: auth } = useAuthStatus();
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStatsSummary();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyStats(weekRange);
  const { data: recentData, isLoading: recentLoading } = useRecentActivities(6);

  if (!auth?.strava && !auth?.garmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-400 mb-6">Connect your Strava or Garmin account to see your dashboard.</p>
          <Link to="/connect" className="btn-primary">
            Connect Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsData?.stats;
  const weeklyVolume = weeklyData?.weeklyVolume || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success banner */}
      {justConnected && (
        <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-800/40 rounded-xl mb-6 text-green-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Successfully connected {justConnected === 'strava' ? 'Strava' : 'Garmin'}! Your data is loading below.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {auth.athlete ? `${auth.athlete.name}'s Dashboard` : 'Training Dashboard'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {statsData?.provider === 'strava' ? '⚡ Powered by Strava' : '🔵 Powered by Garmin'}
            {stats && ` · ${stats.totalActivities} activities tracked`}
          </p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {statsError && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl mb-6 text-red-300 text-sm">
          Failed to load stats. Check your API configuration and try refreshing.
        </div>
      )}

      {/* Summary stats */}
      {statsLoading ? (
        <LoadingSpinner message="Loading your training stats..." />
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Distance"
              value={formatDistance(stats.totalDistanceMeters)}
              sub="all time"
              icon="📍"
              color="#0ea5e9"
            />
            <StatCard
              label="Total Time"
              value={formatDuration(stats.totalDurationSeconds)}
              sub="moving time"
              icon="⏱"
              color="#a855f7"
            />
            <StatCard
              label="Activities"
              value={stats.totalActivities.toString()}
              sub="recorded"
              icon="🏅"
              color="#f97316"
            />
            <StatCard
              label="Elevation"
              value={`${Math.round(stats.totalElevationGain).toLocaleString()} m`}
              sub="total gain"
              icon="⛰"
              color="#22c55e"
            />
          </div>

          {stats.avgHeartRate && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Avg Heart Rate"
                value={`${stats.avgHeartRate} bpm`}
                sub="across activities"
                icon="❤️"
                color="#ef4444"
              />
              {stats.longestActivity && (
                <div className="lg:col-span-3">
                  <div className="card h-full flex items-center gap-4">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <p className="stat-label">Longest Activity</p>
                      <p className="font-semibold text-white mt-0.5">{stats.longestActivity.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatDistance(stats.longestActivity.distanceMeters)} ·{' '}
                        {formatDuration(stats.longestActivity.durationSeconds)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly volume */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Weekly Training Volume</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Last {weekRange} weeks</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg overflow-hidden border border-gray-700">
                    {(['distance', 'duration', 'count'] as VolumeMetric[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setVolumeMetric(m)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          volumeMetric === m
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {m === 'distance' ? 'Dist' : m === 'duration' ? 'Time' : 'Count'}
                      </button>
                    ))}
                  </div>
                  <select
                    value={weekRange}
                    onChange={(e) => setWeekRange(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value={8}>8w</option>
                    <option value={12}>12w</option>
                    <option value={24}>24w</option>
                    <option value={52}>52w</option>
                  </select>
                </div>
              </div>
              {weeklyLoading ? (
                <LoadingSpinner size="sm" message="" />
              ) : weeklyVolume.length > 0 ? (
                <WeeklyVolumeChart data={weeklyVolume} metric={volumeMetric} />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                  No weekly data available
                </div>
              )}
            </div>

            {/* Sport breakdown */}
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Sport Breakdown</h2>
              <SportBreakdownChart stats={stats} />
            </div>
          </div>
        </>
      ) : null}

      {/* Recent activities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Activities</h2>
          <Link to="/activities" className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLoading ? (
          <LoadingSpinner size="sm" message="Loading activities..." />
        ) : recentData?.activities?.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recentData.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-10 text-gray-500">
            <p className="text-2xl mb-2">🏃</p>
            <p>No activities found. Get out there and move!</p>
          </div>
        )}
      </div>
    </div>
  );
}
