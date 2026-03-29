import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  strava_denied: 'Strava authorization was denied.',
  strava_auth_failed: 'Failed to authenticate with Strava. Check your API credentials.',
  garmin_denied: 'Garmin authorization was denied.',
  garmin_auth_failed: 'Failed to authenticate with Garmin. Check your API credentials.',
  garmin_init_failed: 'Could not initiate Garmin OAuth. Check your API credentials.',
};

export default function ConnectPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Connect Your Account</h1>
          <p className="text-gray-400">
            Link your Strava or Garmin account to start tracking your training progress.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/50 rounded-xl mb-6 text-red-300">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{ERROR_MESSAGES[error] || 'An error occurred. Please try again.'}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Strava */}
          <a
            href="/api/auth/strava/connect"
            className="flex items-center gap-4 p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-orange-600/50 hover:bg-gray-900/80 transition-all duration-200 group"
          >
            <div className="w-14 h-14 bg-[#FC4C02]/10 border border-[#FC4C02]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#FC4C02]">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white group-hover:text-[#FC4C02] transition-colors">
                Connect with Strava
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Import runs, rides, swims, and more from Strava
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-[#FC4C02] transition-colors flex-shrink-0" />
          </a>

          {/* Garmin */}
          <a
            href="/api/auth/garmin/connect"
            className="flex items-center gap-4 p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-[#007DC3]/50 hover:bg-gray-900/80 transition-all duration-200 group"
          >
            <div className="w-14 h-14 bg-[#007DC3]/10 border border-[#007DC3]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <circle cx="16" cy="16" r="14" fill="#007DC3" />
                <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">G</text>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white group-hover:text-[#007DC3] transition-colors">
                Connect with Garmin
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Sync activities from Garmin Connect via the Health API
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-[#007DC3] transition-colors flex-shrink-0" />
          </a>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl mt-6">
          <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-1">API credentials required</p>
            <p>
              You need to configure your own Strava or Garmin API credentials in the backend{' '}
              <code className="text-brand-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs">.env</code> file.
              See the README for setup instructions.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already connected?{' '}
          <Link to="/dashboard" className="text-brand-400 hover:text-brand-300 font-medium">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
