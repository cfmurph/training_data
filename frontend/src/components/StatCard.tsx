interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  color?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
}

export default function StatCard({ label, value, sub, icon, color = '#0ea5e9', trend }: StatCardProps) {
  return (
    <div className="card group hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1 truncate" style={{ color }}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-400' :
              trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ml-3"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
