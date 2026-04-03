import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, BarChart3 } from 'lucide-react';
import { useAuthStatus, useLogout } from '../hooks/useTraining';

const ALLOWED_AVATAR_HOSTS = [
  'dgalywyr863hv.cloudfront.net',  // Strava CDN
  'lh3.googleusercontent.com',      // Google (Garmin)
  'content.garmin.com',
];

function isSafeAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      ALLOWED_AVATAR_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

export default function Navbar() {
  const { data: auth } = useAuthStatus();
  const { mutate: doLogout } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    doLogout(undefined, { onSuccess: () => navigate('/') });
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={auth?.strava || auth?.garmin ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TrainTrack</span>
          </Link>

          <div className="flex items-center gap-3">
            {auth?.strava || auth?.garmin ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800">
                  Dashboard
                </Link>
                <Link to="/activities" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800 hidden sm:flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Activities
                </Link>

                {auth.athlete && (
                  <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
                    {auth.athlete.avatar && isSafeAvatarUrl(auth.athlete.avatar) ? (
                      <img
                        src={auth.athlete.avatar}
                        alt={auth.athlete.name}
                        className="w-8 h-8 rounded-full ring-2 ring-gray-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-200 hidden sm:block">
                      {auth.athlete.name}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Disconnect</span>
                </button>
              </>
            ) : (
              <Link to="/connect" className="btn-primary text-sm">
                Connect Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
