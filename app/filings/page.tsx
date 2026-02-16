'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FilingsPage() {
  const [symbol, setSymbol] = useState('');
  const [filings, setFilings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/filings?symbol=${encodeURIComponent(symbol.toUpperCase())}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch filings');
        setFilings(null);
      } else {
        setFilings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFilings(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">SEC Filings</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter stock ticker (e.g., AAPL, TSLA)"
                className="flex-1 px-6 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !symbol.trim()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded mb-6">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</p>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              {error.toLowerCase().includes('could not find cik') && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Some symbols may not be registered with the SEC, or the ticker mapping may be outdated. 
                    Try using the full company name or check the symbol on SEC.gov.
                  </p>
                </div>
              )}
              {error.toLowerCase().includes('temporarily unavailable') && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> The SEC EDGAR API may be experiencing high traffic. Please try again in a few moments.
                  </p>
                </div>
              )}
            </div>
          )}

          {filings && (
            <div className="space-y-6">
              {/* Investment Briefing */}
              {filings.analysis && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-2xl">
                      📊
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Investment Briefing
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Analysis based on SEC filings
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg ${
                      filings.analysis.investmentBriefing.recommendation === 'Positive'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : filings.analysis.investmentBriefing.recommendation === 'Cautionary'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      <span>{filings.analysis.investmentBriefing.recommendation}</span>
                      <span className="text-sm font-normal">
                        ({filings.analysis.investmentBriefing.confidence}% confidence)
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {filings.analysis.investmentBriefing.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Points</h3>
                      <ul className="space-y-1">
                        {filings.analysis.investmentBriefing.keyPoints.map((point: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Filings:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{filings.analysis.recentActivity.filingCount}</span>
                        </div>
                        {filings.analysis.recentActivity.last10K && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Last 10-K:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {new Date(filings.analysis.recentActivity.last10K).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {filings.analysis.recentActivity.last10Q && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Last 10-Q:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {new Date(filings.analysis.recentActivity.last10Q).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Recent 8-Ks:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{filings.analysis.recentActivity.recent8KCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insights, Risks, Opportunities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filings.analysis.keyInsights.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Key Insights</h3>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          {filings.analysis.keyInsights.slice(0, 3).map((insight: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {filings.analysis.riskFactors.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Risk Factors</h3>
                        <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                          {filings.analysis.riskFactors.slice(0, 3).map((risk: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>⚠️</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {filings.analysis.opportunities.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Opportunities</h3>
                        <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                          {filings.analysis.opportunities.slice(0, 3).map((opp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>✓</span>
                              <span>{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Financial Trends */}
                  {filings.analysis.financialTrends.notes.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Financial Overview</h3>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {filings.analysis.financialTrends.notes.map((note: string, idx: number) => (
                          <li key={idx}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Filings List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  {filings.companyName} ({filings.symbol})
                </h2>

                {filings.keyFacts && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Facts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {filings.keyFacts.revenue && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(filings.keyFacts.revenue / 1e9).toFixed(2)}B
                          </p>
                        </div>
                      )}
                      {filings.keyFacts.netIncome && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Net Income</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(filings.keyFacts.netIncome / 1e9).toFixed(2)}B
                          </p>
                        </div>
                      )}
                      {filings.keyFacts.sharesOutstanding && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Shares Outstanding</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {(filings.keyFacts.sharesOutstanding / 1e9).toFixed(2)}B
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Filings (10-K, 10-Q, 8-K)
                </h3>
                <div className="space-y-2">
                  {filings.filings.map((filing: any, idx: number) => (
                    <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {filing.type} - {filing.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Filed: {new Date(filing.date).toLocaleDateString()}
                            {filing.reportDate && ` • Report: ${new Date(filing.reportDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <a
                          href={filing.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View on SEC.gov →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Generated: {new Date(filings.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
