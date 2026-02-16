'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PriceChart from '@/components/PriceChart';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import MetricCard from '@/components/MetricCard';
import type { StockAnalysis } from '@/lib/types';

export default function StockPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase() || '';
  const [data, setData] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);
    setRateLimit(false);

    try {
      const response = await fetch(`/api/analyze?symbol=${symbol}`);
      const result = await response.json();

      if (!response.ok) {
        setApiResponse(result.apiResponse || result); // Store API response for debugging
        if (result.rateLimit) {
          setRateLimit(true);
          setError('Rate limit exceeded. Please try again in a few minutes.');
        } else {
          setError(result.error || 'Failed to fetch stock data');
        }
        setLoading(false);
        return;
      }

      setData(result);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error
              </h2>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              {apiResponse && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-60">
                  <p className="font-semibold mb-2">API Response (for debugging):</p>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                </div>
              )}
              {rateLimit && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-4 space-y-3">
                  <p className="font-medium">Alpha Vantage has rate limits on their free tier:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>5 API calls per minute</li>
                    <li>500 API calls per day</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-red-300 dark:border-red-700">
                    <p className="mb-3">What you can do:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                      <li>Wait 1-2 minutes and click "Try Again" below</li>
                      <li>Try a different stock symbol (cached data may be available)</li>
                      <li>If you've hit the daily limit, wait until tomorrow</li>
                    </ul>
                    <button
                      onClick={() => {
                        setError(null);
                        setRateLimit(false);
                        fetchData();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { 
    metrics, 
    indicators, 
    fundamentals, 
    newsSentiment, 
    recommendation, 
    scenarios,
    secFilings,
    earnings,
    incomeStatements,
    analystReports
  } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {symbol}
              {fundamentals?.Name && (
                <span className="text-xl font-normal text-gray-600 dark:text-gray-400 ml-2">
                  {fundamentals.Name}
                </span>
              )}
            </h1>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
              ⚠️ Educational only. Not financial advice.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Last Close"
              value={`$${metrics.lastClose.toFixed(2)}`}
            />
            <MetricCard
              title="20 Day Return"
              value={`${metrics.return20d >= 0 ? '+' : ''}${metrics.return20d.toFixed(2)}%`}
              trend={metrics.return20d >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              title="90 Day Return"
              value={`${metrics.return90d >= 0 ? '+' : ''}${metrics.return90d.toFixed(2)}%`}
              trend={metrics.return90d >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              title="Volatility (Annual)"
              value={`${metrics.volatility.toFixed(1)}%`}
            />
          </div>

          {/* Price Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Price Chart (Last 100 Trading Days)
            </h2>
            <PriceChart prices={data.prices} />
          </div>

          {/* Technical Indicators */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Technical Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">SMA (20)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${indicators.sma20.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">SMA (50)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${indicators.sma50.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">RSI (14)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {indicators.rsi.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">MACD Histogram</p>
                <p className={`text-lg font-semibold ${indicators.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {indicators.macd.histogram.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Fundamentals */}
          {fundamentals && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Fundamentals Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fundamentals.MarketCapitalization && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatMarketCap(fundamentals.MarketCapitalization)}
                    </p>
                  </div>
                )}
                {fundamentals.PERatio && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">P/E Ratio</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {parseFloat(fundamentals.PERatio).toFixed(2)}
                    </p>
                  </div>
                )}
                {fundamentals.EPS && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">EPS</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(fundamentals.EPS).toFixed(2)}
                    </p>
                  </div>
                )}
                {fundamentals.RevenueTTM && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenue (TTM)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatMarketCap(fundamentals.RevenueTTM)}
                    </p>
                  </div>
                )}
                {fundamentals.ProfitMargin && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(parseFloat(fundamentals.ProfitMargin) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {fundamentals.Sector && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sector</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fundamentals.Sector}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* News Sentiment */}
          {newsSentiment && newsSentiment.feed && newsSentiment.feed.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent News Sentiment
              </h2>
              <div className="space-y-2">
                {newsSentiment.feed.slice(0, 5).map((article, idx) => (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {article.title}
                    </p>
                    {article.overall_sentiment_label && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sentiment: {article.overall_sentiment_label}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Recommendation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Recommendation
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
                recommendation.action === 'Buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                recommendation.action === 'Watch' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {recommendation.action}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recommendation.confidence}%
                </p>
              </div>
              {recommendation.priceTarget && (
                <div className="ml-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price Target ({recommendation.priceTarget.timeframe})</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${recommendation.priceTarget.base.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {recommendation.pros && recommendation.pros.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">
                    ✅ Pros
                  </h3>
                  <ul className="space-y-2">
                    {recommendation.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recommendation.cons && recommendation.cons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">
                    ❌ Cons
                  </h3>
                  <ul className="space-y-2">
                    {recommendation.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bullish/Bearish Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {recommendation.bullishIndicators && recommendation.bullishIndicators.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-green-800 dark:text-green-300 mb-2">
                    🐂 Bullish Indicators
                  </h3>
                  <ul className="space-y-1">
                    {recommendation.bullishIndicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-green-700 dark:text-green-400">
                        • {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recommendation.bearishIndicators && recommendation.bearishIndicators.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-red-800 dark:text-red-300 mb-2">
                    🐻 Bearish Indicators
                  </h3>
                  <ul className="space-y-1">
                    {recommendation.bearishIndicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-400">
                        • {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Risk Factors */}
            {recommendation.riskFactors && (
              <div className="mt-6 p-4 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                  ⚠️ Risk Level: <span className={`${
                    recommendation.riskFactors.level === 'High' ? 'text-red-600' :
                    recommendation.riskFactors.level === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>{recommendation.riskFactors.level}</span>
                </h3>
                {recommendation.riskFactors.factors.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {recommendation.riskFactors.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Earnings History */}
          {earnings && earnings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Earnings History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">EPS</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">Estimate</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">Revenue</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">Revenue Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.slice(0, 8).map((earning, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-4">{new Date(earning.date).toLocaleDateString()}</td>
                        <td className="text-right py-2 px-4">
                          {earning.eps !== null ? `$${earning.eps.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="text-right py-2 px-4">
                          {earning.epsEstimated !== null ? `$${earning.epsEstimated.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="text-right py-2 px-4">
                          {earning.revenue !== null ? formatMarketCap(earning.revenue.toString()) : 'N/A'}
                        </td>
                        <td className="text-right py-2 px-4">
                          {earning.revenueEstimated !== null ? formatMarketCap(earning.revenueEstimated.toString()) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analyst Reports & Institutional Analysis */}
          {analystReports && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Analyst Reports & Institutional Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Analyst Recommendations</h3>
                  {analystReports.recommendations && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Strong Buy:</span>
                        <span className="font-semibold text-green-600">{analystReports.recommendations.strongBuy || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Buy:</span>
                        <span className="font-semibold text-green-500">{analystReports.recommendations.buy || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Hold:</span>
                        <span className="font-semibold text-yellow-600">{analystReports.recommendations.hold || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sell:</span>
                        <span className="font-semibold text-red-500">{analystReports.recommendations.sell || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Strong Sell:</span>
                        <span className="font-semibold text-red-600">{analystReports.recommendations.strongSell || 0}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall:</span>
                          <span className="font-bold text-gray-900 dark:text-white">{analystReports.recommendationKey || 'N/A'}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Based on {analystReports.analystCount || 0} analysts
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price Targets</h3>
                  {analystReports.availableData && (
                    <div className="space-y-2">
                      {analystReports.availableData.priceTarget && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Mean Target:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${analystReports.availableData.priceTarget.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {analystReports.availableData.priceTargetHigh && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">High Target:</span>
                          <span className="font-semibold text-green-600">
                            ${analystReports.availableData.priceTargetHigh.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {analystReports.availableData.priceTargetLow && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Low Target:</span>
                          <span className="font-semibold text-red-600">
                            ${analystReports.availableData.priceTargetLow.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Institutional Analysis Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Detailed research reports from Goldman Sachs, BlackRock, and other major institutions are typically available through premium data providers or institutional access. The data shown above is from publicly available analyst sources.
                </p>
              </div>
            </div>
          )}

          {/* Future Investment Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Future Investment Recommendations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Short-term (1-3 months)</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Outlook:</strong> {recommendation.action === 'Buy' ? 'Positive' : recommendation.action === 'Watch' ? 'Neutral' : 'Cautious'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Based on technical indicators, current price trends, and market sentiment. 
                      Price target range: ${scenarios.oneMonth.pessimistic.toFixed(2)} - ${scenarios.oneMonth.optimistic.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Long-term (6-12 months)</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Outlook:</strong> Based on fundamentals and growth potential
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Analysis considers earnings trends, revenue growth, and company fundamentals. 
                      Price target range: ${scenarios.threeMonth.pessimistic.toFixed(2)} - ${scenarios.threeMonth.optimistic.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {recommendation.priceTarget && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  Recommended Price Target ({recommendation.priceTarget.timeframe})
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400">Optimistic</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-300">
                      ${recommendation.priceTarget.optimistic.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400">Base Case</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-300">
                      ${recommendation.priceTarget.base.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400">Pessimistic</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-300">
                      ${recommendation.priceTarget.pessimistic.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced SEC Filings */}
          {secFilings && secFilings.filings && Array.isArray(secFilings.filings.recent) && secFilings.filings.recent.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📄 SEC Filings & Investment Documents
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Key filings for investment analysis: 10-K (Annual Reports), 10-Q (Quarterly Reports), 8-K (Current Reports), DEF 14A (Proxy Statements)
              </p>
              <div className="space-y-2">
                {secFilings.filings.recent
                  .filter((filing: any) => 
                    filing && filing.form && ['10-K', '10-Q', '8-K', 'DEF 14A'].includes(filing.form)
                  )
                  .slice(0, 10)
                  .map((filing: any, idx: number) => (
                    <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {filing.form} - {filing.primaryDocDescription || 'Filing'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Filed: {filing.filingDate ? new Date(filing.filingDate).toLocaleDateString() : 'N/A'}
                            {filing.reportDate && ` • Report Date: ${new Date(filing.reportDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        {filing.accessionNumber && secFilings.cik && (
                          <a
                            href={`https://www.sec.gov/cgi-bin/viewer?action=view&cik=${secFilings.cik}&accession_number=${filing.accessionNumber.replace(/-/g, '')}&xbrl_type=v`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Scenario Outlook */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Scenario Outlook
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Heuristic estimates based on recent volatility and returns. Not guaranteed predictions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">1 Month Outlook</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Optimistic:</span>
                    <span className="font-semibold text-green-600">${scenarios.oneMonth.optimistic.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Base:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${scenarios.oneMonth.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pessimistic:</span>
                    <span className="font-semibold text-red-600">${scenarios.oneMonth.pessimistic.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">3 Month Outlook</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Optimistic:</span>
                    <span className="font-semibold text-green-600">${scenarios.threeMonth.optimistic.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Base:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${scenarios.threeMonth.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pessimistic:</span>
                    <span className="font-semibold text-red-600">${scenarios.threeMonth.pessimistic.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8 space-y-1">
            <p>Data sources: Yahoo Finance, SEC EDGAR{fundamentals?.CIK ? ', Financial Modeling Prep' : ''}</p>
            <p className="text-xs">⚠️ Educational only. Not financial advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMarketCap(value: string): string {
  const num = parseFloat(value);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(2)}`;
}
