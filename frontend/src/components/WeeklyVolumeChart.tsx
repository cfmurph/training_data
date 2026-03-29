import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WeeklyVolume } from '../types';
import { formatWeekLabel } from '../utils/format';

interface WeeklyVolumeChartProps {
  data: WeeklyVolume[];
  metric: 'distance' | 'duration' | 'count';
}

const METRIC_CONFIG = {
  distance: {
    key: 'totalDistanceMeters',
    label: 'Distance (km)',
    format: (v: number) => `${(v / 1000).toFixed(1)} km`,
    transform: (v: number) => parseFloat((v / 1000).toFixed(2)),
    color: '#0ea5e9',
    gradientId: 'distanceGradient',
  },
  duration: {
    key: 'totalDurationSeconds',
    label: 'Time (hours)',
    format: (v: number) => {
      const h = Math.floor(v / 3600);
      const m = Math.floor((v % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },
    transform: (v: number) => parseFloat((v / 3600).toFixed(2)),
    color: '#a855f7',
    gradientId: 'durationGradient',
  },
  count: {
    key: 'count',
    label: 'Activities',
    format: (v: number) => `${v} activities`,
    transform: (v: number) => v,
    color: '#f97316',
    gradientId: 'countGradient',
  },
};

interface TooltipPayload {
  value: number;
  name: string;
  payload: {
    original: WeeklyVolume;
    [key: string]: unknown;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  metric: 'distance' | 'duration' | 'count';
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  const config = METRIC_CONFIG[metric];
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const original = item.payload.original as WeeklyVolume;
  const rawValue = original[config.key as keyof WeeklyVolume] as number;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">Week of {label}</p>
      <p className="text-sm font-bold text-white">{config.format(rawValue)}</p>
      <p className="text-xs text-gray-400">{original.count} activities</p>
    </div>
  );
}

export default function WeeklyVolumeChart({ data, metric }: WeeklyVolumeChartProps) {
  const config = METRIC_CONFIG[metric];

  const chartData = data.map((week) => ({
    weekLabel: formatWeekLabel(week.weekStart),
    value: config.transform(week[config.key as keyof WeeklyVolume] as number),
    original: week,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2.5}
          fill={`url(#${config.gradientId})`}
          dot={false}
          activeDot={{ r: 5, fill: config.color, stroke: '#111827', strokeWidth: 2 }}
          name={config.label}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
