import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

export interface SalesChartProps {
  data: Array<{ name: string; value: number; bills?: number }>;
}

// Custom tooltip with date + amount + bills
const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const val = payload[0]?.value as number;
  const bills = payload[0]?.payload?.bills;

  return (
    <div
      className="px-3 py-2 rounded-button border border-border shadow-raised text-xs"
      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
    >
      <p className="font-bold text-text-muted mb-1">{label}</p>
      <p className="font-extrabold text-success text-sm">
        ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
      {bills !== undefined && (
        <p className="text-text-muted mt-0.5">{bills} bill{bills !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
};

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const { isDark } = useTheme();

  return (
    <div className="h-36 w-full mt-4 -mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {/* Sales gradient — green #00A86B */}
            <linearGradient id="salesGradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00A86B" stopOpacity={isDark ? 0.35 : 0.25} />
              <stop offset="95%" stopColor="#00A86B" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.08)'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00A86B"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#salesGradientGreen)"
            dot={false}
            activeDot={{ r: 4, fill: '#00A86B', stroke: isDark ? '#1E293B' : '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
