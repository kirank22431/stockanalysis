'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface IndustryMetrics {
  industry: string;
  peRatio: number;
  evToEbitda: number;
  priceToSales: number;
  priceToBook: number;
  profitMargin: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
  revenueGrowth: number;
  earningsGrowth: number;
}

interface Sector {
  sector: string;
  performance: number;
  industryMetrics?: IndustryMetrics | null;
}

interface StockRecommendation {
  symbol: string;
  name?: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  confidence: number;
  label: 'Bullish' | 'Neutral' | 'Bearish';
  reasons: string[];
}

interface SectorStocks {
  sector: string;
  stocks: StockRecommendation[];
  totalAnalyzed: number;
  generatedAt: string;
}

interface MarketOverview {
  sectors: Sector[];
  generatedAt: string;
  industryBenchmarks?: IndustryMetrics[];
  dataSource?: {
    name: string;
    url: string;
    note: string;
  };
}

export default function MarketOverviewPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<Record<string, SectorStocks>>({});
  const [loadingStocks, setLoadingStocks] = useState<Record<string, boolean>>({});
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    fetch('/api/market/overview')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOverview(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const loadStocksForSector = async (sector: string) => {
    if (sectorStocks[sector] || loadingStocks[sector]) return;

    setLoadingStocks((prev) => ({ ...prev, [sector]: true }));

    try {
      const response = await fetch(`/api/market/stocks?sector=${encodeURIComponent(sector)}&limit=5`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading stocks:', data.error);
        return;
      }

      setSectorStocks((prev) => ({ ...prev, [sector]: data }));
    } catch (err) {
      console.error('Error fetching sector stocks:', err);
    } finally {
      setLoadingStocks((prev => ({ ...prev, [sector]: false })));
    }
  };

  const toggleSector = (sector: string) => {
    const newExpanded = new Set(expandedSectors);
    if (newExpanded.has(sector)) {
      newExpanded.delete(sector);
    } else {
      newExpanded.add(sector);
      loadStocksForSector(sector);
    }
    setExpandedSectors(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading market overview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
            {overview && overview.industryBenchmarks && (
              <button
                onClick={() => setShowBenchmarks(!showBenchmarks)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {showBenchmarks ? 'Hide' : 'Show'} Industry Benchmarks
              </button>
            )}
          </div>

          {overview?.dataSource && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Data Source:</strong>{' '}
                <a
                  href={overview.dataSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 dark:hover:text-blue-100"
                >
                  {overview.dataSource.name}
                </a>
                {' - '}
                {overview.dataSource.note}
              </p>
            </div>
          )}

          {/* Industry Benchmarks Table */}
          {showBenchmarks && overview?.industryBenchmarks && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Industry Valuation Benchmarks (Damodaran Methodology)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        P/E Ratio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        EV/EBITDA
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        P/S Ratio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        P/B Ratio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Profit Margin %
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ROE %
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Dividend Yield %
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Beta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {overview.industryBenchmarks.map((industry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {industry.industry}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.peRatio.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.evToEbitda.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.priceToSales.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.priceToBook.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.profitMargin.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.roe.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.dividendYield.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                          {industry.beta.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {overview && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Sector Performance & Recommended Stocks
                </h2>
                <div className="space-y-4">
                  {overview.sectors.map((sector, idx) => {
                    const isExpanded = expandedSectors.has(sector.sector);
                    const stocks = sectorStocks[sector.sector];
                    const isLoading = loadingStocks[sector.sector];

                    return (
                      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Sector Header */}
                        <button
                          onClick={() => toggleSector(sector.sector)}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              {sector.sector}
                            </span>
                            <span
                              className={`text-sm font-medium px-3 py-1 rounded-full ${
                                sector.performance >= 0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {sector.performance >= 0 ? '+' : ''}
                              {sector.performance.toFixed(2)}%
                            </span>
                            {sector.industryMetrics && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <span>P/E: {sector.industryMetrics.peRatio.toFixed(1)}</span>
                                <span>•</span>
                                <span>ROE: {sector.industryMetrics.roe.toFixed(1)}%</span>
                                <span>•</span>
                                <span>Div Yield: {sector.industryMetrics.dividendYield.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpanded && stocks && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {stocks.stocks.length} recommended
                              </span>
                            )}
                            <svg
                              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </button>

                        {/* Industry Metrics Summary */}
                        {isExpanded && sector.industryMetrics && (
                          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Industry Benchmarks (Damodaran)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">P/E Ratio:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.peRatio.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">EV/EBITDA:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.evToEbitda.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Profit Margin:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.profitMargin.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">ROE:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.roe.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Revenue Growth:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.revenueGrowth.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Earnings Growth:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.earningsGrowth.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Debt/Equity:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.debtToEquity.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Beta:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {sector.industryMetrics.beta.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recommended Stocks */}
                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            {isLoading ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Analyzing stocks...
                                </p>
                              </div>
                            ) : stocks && stocks.stocks.length > 0 ? (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  Top {stocks.stocks.length} recommended stocks (analyzed {stocks.totalAnalyzed} stocks)
                                  {stocks.buyCount !== undefined && stocks.buyCount < stocks.stocks.length && (
                                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                                      • {stocks.buyCount} with "Buy" recommendation
                                    </span>
                                  )}
                                </p>
                                {stocks.stocks.map((stock, stockIdx) => (
                                  <div
                                    key={stockIdx}
                                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <Link
                                          href={`/report?symbol=${stock.symbol}&type=stock`}
                                          className="font-bold text-lg text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          {stock.symbol}
                                        </Link>
                                        {stock.name && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {stock.name}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div
                                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm ${
                                            stock.recommendation === 'Buy' || stock.label === 'Bullish'
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                              : stock.recommendation === 'Sell' || stock.label === 'Bearish'
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                          }`}
                                        >
                                          <span>{stock.recommendation}</span>
                                          <span className="text-xs">({stock.confidence}%)</span>
                                        </div>
                                      </div>
                                    </div>
                                    {stock.reasons && stock.reasons.length > 0 && (
                                      <ul className="mt-2 space-y-1">
                                        {stock.reasons.map((reason, reasonIdx) => (
                                          <li
                                            key={reasonIdx}
                                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                          >
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>{reason}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : stocks ? (
                              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                                <p>No stocks with "Buy" recommendation found in this sector.</p>
                                <p className="text-sm mt-2">
                                  Try expanding other sectors or check back later.
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Updated: {new Date(overview.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Stock recommendations are based on technical and fundamental analysis.
                  Industry benchmarks are based on{' '}
                  <a
                    href="https://pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    Aswath Damodaran's valuation methodology
                  </a>
                  . Click on any stock symbol to view a detailed analysis report. This is for educational purposes only,
                  not financial advice.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Valuation Methodology:</strong> Industry metrics are based on representative averages from
                  Damodaran's data. Use these benchmarks to compare individual stocks against their industry peers.
                  Lower P/E ratios relative to industry may indicate value opportunities, while higher ROE suggests
                  better profitability.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
