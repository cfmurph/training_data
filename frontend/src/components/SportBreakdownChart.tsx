import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrainingStats, SportType } from '../types';
import { SPORT_COLORS, SPORT_LABELS, SPORT_ICONS } from '../utils/format';

interface SportBreakdownChartProps {
  stats: TrainingStats;
}

export default function SportBreakdownChart({ stats }: SportBreakdownChartProps) {
  const data = Object.entries(stats.byType)
    .map(([type, info]) => ({
      name: SPORT_LABELS[type as SportType],
      value: info.count,
      icon: SPORT_ICONS[type as SportType],
      color: SPORT_COLORS[type as SportType],
      type: type as SportType,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        No activities yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl">
                  <p className="text-sm font-bold text-white">
                    {item.icon} {item.name}
                  </p>
                  <p className="text-xs text-gray-400">{item.value} activities</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-400 truncate">
              {item.icon} {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
