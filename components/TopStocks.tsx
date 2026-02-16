'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TopStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  recommendation: string;
  confidence: number;
  score: number;
}

export default function TopStocks() {
  const [topStocks, setTopStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/top-stocks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTopStocks(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📈 Top Investment Opportunities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (topStocks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        📈 Top Investment Opportunities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStocks.slice(0, 5).map((stock) => (
          <Link
            key={stock.symbol}
            href={`/stock/${stock.symbol}`}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{stock.symbol}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stock.name}</p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  stock.recommendation === 'Buy'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : stock.recommendation === 'Watch'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {stock.recommendation}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${stock.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Change:</span>
                <span
                  className={`text-sm font-semibold ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stock.change >= 0 ? '+' : ''}
                  {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {stock.confidence}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
