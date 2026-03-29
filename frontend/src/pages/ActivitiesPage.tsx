import { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActivities } from '../hooks/useTraining';
import ActivityCard from '../components/ActivityCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { SportType } from '../types';
import { SPORT_LABELS, SPORT_ICONS } from '../utils/format';

const SPORT_TYPES: SportType[] = ['run', 'ride', 'swim', 'walk', 'hike', 'strength', 'yoga', 'other'];

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<SportType | 'all'>('all');
  const PER_PAGE = 20;

  const { data, isLoading, error } = useActivities(page, PER_PAGE);

  const activities = data?.activities || [];

  const filtered = activities.filter((act) => {
    const matchesSearch = search
      ? act.name.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesType = filterType === 'all' ? true : act.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activities</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isLoading ? 'Loading...' : `${filtered.length} activities`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {SPORT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {SPORT_ICONS[type]} {SPORT_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading your activities..." />
      ) : error ? (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-300 text-sm">
          Failed to load activities. Make sure you&apos;re connected and try again.
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={activities.length < PER_PAGE}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">
            {search || filterType !== 'all'
              ? 'No activities match your filters.'
              : 'No activities found. Connect your account to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
