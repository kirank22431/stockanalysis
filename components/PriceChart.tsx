'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PricePoint } from '@/lib/types';

interface PriceChartProps {
  prices: PricePoint[];
}

export default function PriceChart({ prices }: PriceChartProps) {
  // Format data for chart (show last 100 days)
  const chartData = prices.slice(-100).map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    close: point.close,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close Price']}
            labelStyle={{ color: '#000' }}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
