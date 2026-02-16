'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PricePoint } from '@/lib/types';

interface ReportChartProps {
  prices: PricePoint[];
  title?: string;
}

export default function ReportChart({ prices, title = 'Price Chart' }: ReportChartProps) {
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Prepare data for chart (last 6-12 months)
  const chartData = prices
    .slice(-180) // Last ~6 months
    .map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: p.close,
      fullDate: p.date,
    }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
