'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReportChart from '@/components/ReportChart';
import type { Report } from '@/lib/analysis/reportBuilder';
import type { PricePoint } from '@/lib/types';

function ReportContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol') || '';
  const type = searchParams.get('type') || 'stock';

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!symbol) {
      setError('Symbol is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/report?symbol=${encodeURIComponent(symbol)}&type=${type}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate report');
        setLoading(false);
        return;
      }

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbol, type]);

  useEffect(() => {
    if (symbol) {
      fetchReport();
    }
  }, [symbol, type, fetchReport]);

  const downloadJSON = useCallback(() => {
    if (!report) return;
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.symbol}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const copySummary = useCallback(() => {
    if (!report) return;
    const summary = `
${report.symbol} - ${report.summary.label} (${report.summary.recommendation})
Confidence: ${report.summary.confidence}%

Key Reasons:
${report.why.map((r) => `• ${r}`).join('\n')}
    `.trim();
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Generating report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-800 dark:text-red-200 font-semibold">Error</p>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              {error.toLowerCase().includes('rate limit') && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Rate Limit Info:</strong> Alpha Vantage free tier allows 5 calls per minute and 500 calls per day. 
                    Please wait a few minutes before trying again, or consider upgrading to a premium plan.
                  </p>
                </div>
              )}
              {error.toLowerCase().includes('invalid data format') && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Troubleshooting:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Verify your Financial Modeling Prep API key is correct in <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.local</code></li>
                      <li>Check if the symbol is valid and publicly traded</li>
                      <li>Try a different stock symbol</li>
                      <li>Wait a few moments and try again</li>
                    </ul>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const { summary, why, sections } = report;

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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
                      {report.symbol}
                    </h1>
                    {sections.company && (
                      <span className="text-base sm:text-lg md:text-xl font-medium text-gray-600 dark:text-gray-400 truncate">
                        {sections.company.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
                    {report.assetType === 'stock' ? '📊 Stock' : '₿ Cryptocurrency'} Analysis Report • Generated {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={downloadJSON}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download JSON</span>
                    <span className="sm:hidden">Download</span>
                  </button>
                  <button
                    onClick={copySummary}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Copy Summary</span>
                    <span className="sm:hidden">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
              ⚠️ Educational only. Not financial advice.
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6">
              <div
                className={`px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl font-extrabold text-xl sm:text-2xl md:text-3xl shadow-lg transform transition-all ${
                  summary.label === 'Bullish'
                    ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white'
                    : summary.label === 'Neutral'
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                    : 'bg-gradient-to-br from-red-400 to-rose-600 text-white'
                }`}
              >
                {summary.label}
              </div>
              <div className="flex-1 w-full grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 sm:mb-2">Recommendation</p>
                  <p className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${
                    summary.recommendation === 'Buy' ? 'text-green-600 dark:text-green-400' :
                    summary.recommendation === 'Hold' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {summary.recommendation}
                  </p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 sm:mb-2">Confidence</p>
                  <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-2">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{summary.confidence}%</p>
                    <div className="w-full sm:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          summary.confidence >= 70 ? 'bg-green-500' :
                          summary.confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${summary.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {why.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sections */}
          {sections.company && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Company Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {sections.company.sector && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sector</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{sections.company.sector}</p>
                  </div>
                )}
                {sections.company.industry && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Industry</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{sections.company.industry}</p>
                  </div>
                )}
                {sections.company.marketCap && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(sections.company.marketCap)}
                    </p>
                  </div>
                )}
                {sections.company.exchange && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Exchange</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{sections.company.exchange}</p>
                  </div>
                )}
              </div>
              {sections.company.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{sections.company.description}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.company.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {sections.valuation && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Valuation</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {sections.valuation.peRatio !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">P/E Ratio</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.valuation.peRatio.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.valuation.priceToSales !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price/Sales</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.valuation.priceToSales.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.valuation.priceToBook !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price/Book</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.valuation.priceToBook.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.valuation.evToEBITDA !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">EV/EBITDA</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.valuation.evToEBITDA.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.valuation.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Valuation Analysis & Projections */}
          {sections.valuationAnalysis && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg shadow-lg p-6 mb-6 border border-indigo-200 dark:border-indigo-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Valuation Analysis & Projections
              </h2>

              {/* Valuation Status */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${sections.valuationAnalysis.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Valuation Status</p>
                    <div
                      className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        sections.valuationAnalysis.valuationStatus === 'undervalued'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : sections.valuationAnalysis.valuationStatus === 'overvalued'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {sections.valuationAnalysis.valuationStatus === 'undervalued' ? '✓ Undervalued' :
                       sections.valuationAnalysis.valuationStatus === 'overvalued' ? '✗ Overvalued' : '≈ Fair Value'}
                    </div>
                  </div>
                </div>

                {sections.valuationAnalysis.intrinsicValue.average && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fair Value (Avg)</p>
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ${sections.valuationAnalysis.intrinsicValue.average.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fair Value Range</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        ${sections.valuationAnalysis.fairValueRange.low.toFixed(2)} - ${sections.valuationAnalysis.fairValueRange.high.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upside Potential</p>
                      <p className={`text-lg font-bold ${
                        sections.valuationAnalysis.upsideDownside.fairValueUpside >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {sections.valuationAnalysis.upsideDownside.fairValueUpside >= 0 ? '+' : ''}
                        {sections.valuationAnalysis.upsideDownside.fairValueUpside.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {sections.valuationAnalysis.confidence}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Intrinsic Value Methods */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Intrinsic Value Calculations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sections.valuationAnalysis.intrinsicValue.graham !== null && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Graham Formula</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${sections.valuationAnalysis.intrinsicValue.graham.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Based on EPS & Book Value</p>
                    </div>
                  )}
                  {sections.valuationAnalysis.intrinsicValue.dcf !== null && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">DCF Analysis</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${sections.valuationAnalysis.intrinsicValue.dcf.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Discounted Cash Flow</p>
                    </div>
                  )}
                  {sections.valuationAnalysis.intrinsicValue.relative !== null && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Relative Valuation</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${sections.valuationAnalysis.intrinsicValue.relative.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">vs Industry Peers</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Projections */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Price Projections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">1 Year Outlook</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Optimistic:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${sections.valuationAnalysis.projections.oneYear.optimistic.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Base Case:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${sections.valuationAnalysis.projections.oneYear.base.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pessimistic:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${sections.valuationAnalysis.projections.oneYear.pessimistic.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">3 Year Outlook</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Optimistic:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${sections.valuationAnalysis.projections.threeYear.optimistic.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Base Case:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${sections.valuationAnalysis.projections.threeYear.base.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pessimistic:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${sections.valuationAnalysis.projections.threeYear.pessimistic.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Relative Valuation Comparison */}
              {sections.valuationAnalysis.relativeValuation.details.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Industry Comparison</h3>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        sections.valuationAnalysis.relativeValuation.status === 'undervalued'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : sections.valuationAnalysis.relativeValuation.status === 'overvalued'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {sections.valuationAnalysis.relativeValuation.status === 'undervalued' ? 'Undervalued vs Industry' :
                         sections.valuationAnalysis.relativeValuation.status === 'overvalued' ? 'Overvalued vs Industry' : 'Fairly Valued'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {sections.valuationAnalysis.relativeValuation.details.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{detail.metric}:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 dark:text-gray-300">
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
                </div>
              )}

              {/* Methodology */}
              {sections.valuationAnalysis.methodology.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Methodology:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
                    {sections.valuationAnalysis.methodology.map((method, idx) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 italic">
                * Projections are estimates based on historical growth rates and industry averages. Not guaranteed predictions.
              </p>
            </div>
          )}

          {/* Price Chart */}
          {report.prices && report.prices.length > 0 && (
            <div className="mb-6">
              <ReportChart
                prices={report.prices}
                title={`${report.symbol} Price Chart (Last 6 Months)`}
              />
            </div>
          )}

          {sections.performance && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${sections.performance.currentPrice.toFixed(2)}
                  </p>
                </div>
                {sections.performance.price52wHigh && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">52W High</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${sections.performance.price52wHigh.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.performance.price52wLow && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">52W Low</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${sections.performance.price52wLow.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.performance.volatility !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Volatility</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.performance.volatility.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.performance.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {sections.technicals && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technical Indicators</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.technicals.sma50 !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SMA (50)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${sections.technicals.sma50.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.technicals.sma200 !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SMA (200)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${sections.technicals.sma200.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.technicals.rsi !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">RSI (14)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.technicals.rsi.toFixed(2)}
                    </p>
                  </div>
                )}
                {sections.technicals.macd && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">MACD Histogram</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sections.technicals.macd.histogram.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.technicals.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {sections.filings && sections.filings.recent.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">SEC Filings</h2>
              <div className="space-y-2">
                {sections.filings.recent.slice(0, 10).map((filing, idx) => (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2">
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
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.filings.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {sections.crypto && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Crypto Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.crypto.marketCap && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(sections.crypto.marketCap)}
                    </p>
                  </div>
                )}
                {sections.crypto.volume24h && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">24h Volume</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(sections.crypto.volume24h)}
                    </p>
                  </div>
                )}
                {sections.crypto.circulatingSupply && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Circulating Supply</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(sections.crypto.circulatingSupply)}
                    </p>
                  </div>
                )}
                {sections.crypto.priceChange7d !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">7d Change</p>
                    <p
                      className={`text-lg font-semibold ${
                        sections.crypto.priceChange7d >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {sections.crypto.priceChange7d >= 0 ? '+' : ''}
                      {sections.crypto.priceChange7d.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Data freshness: {new Date(sections.crypto.freshAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Sources */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mt-6">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Data Sources:</strong>{' '}
              {Object.entries(report.sources)
                .map(([provider, endpoints]) => `${provider} (${endpoints.join(', ')})`)
                .join('; ')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Report generated: {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading report...</p>
          </div>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
