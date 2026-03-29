import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Activity, Zap, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Connect Strava or Garmin in seconds
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
              Track Your Training
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                Progress
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Connect your Strava or Garmin account and get beautiful visualizations
              of your training data — weekly volume, sport breakdowns, heart rate trends, and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/connect" className="btn-primary text-base px-8 py-3">
                Get Started
                <ChevronRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com"
                className="btn-secondary text-base px-8 py-3"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-4">Everything you need</h2>
          <p className="text-gray-400 text-lg">Powerful analytics for serious athletes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: 'Weekly Volume',
              description: 'Track your training load week over week with interactive charts for distance, time, and activity count.',
              color: '#0ea5e9',
            },
            {
              icon: <Activity className="w-6 h-6" />,
              title: 'Activity Feed',
              description: 'Browse all your activities in one place with detailed stats — pace, heart rate, elevation, and calories.',
              color: '#a855f7',
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: 'Sport Breakdown',
              description: 'See how your training is distributed across running, cycling, swimming, strength, and more.',
              color: '#f97316',
            },
          ].map((feature) => (
            <div key={feature.title} className="card hover:border-gray-700 transition-all">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="card text-center py-12 bg-gradient-to-br from-brand-900/30 to-gray-900 border-brand-800/50">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to analyze your training?</h2>
          <p className="text-gray-400 mb-8">Connect your account and start tracking in under a minute.</p>
          <Link to="/connect" className="btn-primary mx-auto text-base px-8 py-3">
            Connect Now
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
