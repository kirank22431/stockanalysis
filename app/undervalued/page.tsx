'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface UndervaluedStock {
  symbol: string;
  name: string;
  currentPrice: number;
  fairValue: number | null;
  upsidePotential: number;
  valuationStatus: 'undervalued' | 'fair' | 'overvalued';
  confidence: number;
  sector?: string;
  industry?: string;
  peRatio?: number;
  industryPE?: number;
  metrics: {
    peRatio?: number;
    priceToSales?: number;
    priceToBook?: number;
    evToEbitda?: number;
    profitMargin?: number;
  };
  relativeValuation: {
    status: 'undervalued' | 'fair' | 'overvalued';
    details: Array<{ metric: string; stock: number | undefined; industry: number; difference: number }>;
  };
  methodology: string[];
}

export default function UndervaluedStocksPage() {
  const [symbol, setSymbol] = useState('');
  const [minUpside, setMinUpside] = useState('15');
  const [maxPE, setMaxPE] = useState('30');
  const [result, setResult] = useState<UndervaluedStock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        symbol: symbol.trim(),
        minUpside: minUpside,
        maxPE: maxPE,
      });

      const response = await fetch(`/api/undervalued?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to analyze stock');
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, minUpside, maxPE]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 sm:mb-6 transition-colors font-medium text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Undervalued Stock Finder
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Based on Aswath Damodaran's Valuation Methodology
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
                Uses DCF Analysis, Graham's Formula, and Relative Valuation vs Industry Benchmarks
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
              ⚠️ Educational only. Not financial advice. Valuation methods are based on Aswath Damodaran's teachings at NYU Stern.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="symbol" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, MSFT"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="minUpside" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Min Upside Potential (%)
                  </label>
                  <input
                    type="number"
                    id="minUpside"
                    value={minUpside}
                    onChange={(e) => setMinUpside(e.target.value)}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="maxPE" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Max P/E Ratio
                  </label>
                  <input
                    type="number"
                    id="maxPE"
                    value={maxPE}
                    onChange={(e) => setMaxPE(e.target.value)}
                    min="0"
                    max="200"
                    step="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !symbol.trim()}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none active:scale-95 text-base sm:text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Stock'
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6 rounded">
              <p className="text-red-800 dark:text-red-200 font-semibold">Analysis Result</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-green-400 dark:border-green-600">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {result.symbol} - {result.name}
                    </h2>
                    {result.sector && (
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {result.sector} {result.industry && `• ${result.industry}`}
                      </p>
                    )}
                  </div>
                  <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl ${
                    result.valuationStatus === 'undervalued'
                      ? 'bg-green-500 text-white'
                      : result.valuationStatus === 'overvalued'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {result.valuationStatus === 'undervalued' ? '✓ UNDERVALUED' :
                     result.valuationStatus === 'overvalued' ? '✗ OVERVALUED' : '≈ FAIR VALUE'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      ${result.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Fair Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.fairValue ? `$${result.fairValue.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Upside Potential</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      +{result.upsidePotential.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Confidence</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {result.confidence}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Valuation Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Valuation Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {result.metrics.peRatio !== undefined && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">P/E Ratio</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {result.metrics.peRatio.toFixed(2)}
                      </p>
                      {result.industryPE && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Industry: {result.industryPE.toFixed(1)}
                        </p>
                      )}
                    </div>
                  )}
                  {result.metrics.priceToSales !== undefined && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Price/Sales</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {result.metrics.priceToSales.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {result.metrics.priceToBook !== undefined && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Price/Book</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {result.metrics.priceToBook.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {result.metrics.evToEbitda !== undefined && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">EV/EBITDA</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {result.metrics.evToEbitda.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {result.metrics.profitMargin !== undefined && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Profit Margin</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {result.metrics.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Relative Valuation */}
              {result.relativeValuation.details.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Industry Comparison (Damodaran Benchmarks)
                  </h3>
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      result.relativeValuation.status === 'undervalued'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : result.relativeValuation.status === 'overvalued'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {result.relativeValuation.status === 'undervalued' ? 'Undervalued vs Industry' :
                       result.relativeValuation.status === 'overvalued' ? 'Overvalued vs Industry' : 'Fairly Valued'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.relativeValuation.details.map((detail, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                          {detail.metric}:
                        </span>
                        <div className="flex items-center gap-3 text-sm sm:text-base">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {detail.stock !== undefined ? detail.stock.toFixed(2) : 'N/A'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-500">vs</span>
                          <span className="text-gray-700 dark:text-gray-300">{detail.industry.toFixed(2)}</span>
                          <span className={`font-semibold ${
                            detail.difference < -10 ? 'text-green-600 dark:text-green-400' :
                            detail.difference > 10 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            ({detail.difference >= 0 ? '+' : ''}{detail.difference.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Methodology */}
              {result.methodology.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-300 mb-3">
                    Valuation Methodology (Damodaran)
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-blue-800 dark:text-blue-200">
                    {result.methodology.map((method, idx) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View Full Report Link */}
              <div className="text-center">
                <Link
                  href={`/report?symbol=${result.symbol}&type=stock`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  View Full Analysis Report
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
