'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DiversificationPlan {
  totalAmount: number;
  shortTerm: {
    allocation: Array<{
      category: string;
      percentage: number;
      amount: number;
      stocks: Array<{
        symbol: string;
        name: string;
        percentage: number;
        amount: number;
        recommendation: string;
        confidence: number;
      }>;
      rationale: string;
    }>;
    riskLevel: 'Low' | 'Medium' | 'High';
    expectedReturn: string;
    timeHorizon: string;
  };
  longTerm: {
    allocation: Array<{
      category: string;
      percentage: number;
      amount: number;
      stocks: Array<{
        symbol: string;
        name: string;
        percentage: number;
        amount: number;
        recommendation: string;
        confidence: number;
      }>;
      rationale: string;
    }>;
    riskLevel: 'Low' | 'Medium' | 'High';
    expectedReturn: string;
    timeHorizon: string;
  };
  recommendations: string[];
  generatedAt: string;
}

export default function PortfolioPage() {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [investorType, setInvestorType] = useState<'defensive' | 'enterprising'>('defensive');
  const [investorAge, setInvestorAge] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(investmentAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (amount < 100) {
      setError('Minimum investment amount is $100');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        type: investorType,
      });
      if (investorAge) {
        params.append('age', investorAge);
      }
      const response = await fetch(`/api/portfolio?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate portfolio plan');
        setPlan(null);
      } else {
        setPlan(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Portfolio Diversification Planner
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get personalized investment recommendations based on your investment amount
            </p>
          </div>

          {/* Investment Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Investment Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xl">
                      $
                    </span>
                    <input
                      type="number"
                      id="amount"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="10000"
                      min="100"
                      step="100"
                      className="w-full pl-10 pr-4 py-3 text-xl border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Investor Type (Graham)
                  </label>
                  <select
                    id="type"
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value as 'defensive' | 'enterprising')}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="defensive">Defensive Investor</option>
                    <option value="enterprising">Enterprising Investor</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {investorType === 'defensive' 
                      ? 'Conservative, minimal effort' 
                      : 'Active, research-intensive'}
                  </p>
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="age" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    id="age"
                    value={investorAge}
                    onChange={(e) => setInvestorAge(e.target.value)}
                    placeholder="35"
                    min="18"
                    max="100"
                    className="w-full px-4 py-3 text-xl border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Affects stock/bond allocation
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !investmentAmount}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
              >
                {loading ? 'Generating Plan...' : 'Generate Diversification Plan'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Portfolio Plan Display */}
          {plan && (
            <div className="space-y-8">
              {/* Graham's Principles */}
              {plan.grahamPrinciples && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4">Graham's Investment Principles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {Object.entries(plan.grahamPrinciples).map(([key, value]) => (
                      <div key={key} className="bg-white/10 rounded-lg p-3">
                        <p className="font-semibold mb-1">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-sm text-blue-100">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Recommendations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Investment Recommendations</h2>
                <ul className="space-y-2">
                  {plan.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defensive Strategy */}
              {plan.defensive && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Defensive Investor Strategy
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">{plan.defensive.timeHorizon}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 italic">{plan.defensive.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                      plan.defensive?.riskLevel === 'Low'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : plan.defensive?.riskLevel === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      Risk: {plan.defensive.riskLevel}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Expected Return: {plan.defensive.expectedReturn}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {plan.defensive.allocation.map((allocation: any, idx: number) => (
                    <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {allocation.category}
                        </h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${allocation.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {allocation.percentage}% of portfolio
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{allocation.rationale}</p>
                      
                      {allocation.grahamPrinciple && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Graham's Principle:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 italic">{allocation.grahamPrinciple}</p>
                        </div>
                      )}
                      {allocation.stocks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommended Stocks (Graham Criteria):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {allocation.stocks.map((stock: any, stockIdx: number) => (
                              <div key={stockIdx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <Link
                                    href={`/report?symbol=${stock.symbol}&type=stock`}
                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {stock.symbol}
                                  </Link>
                                  <div className="flex gap-2">
                                    {stock.grahamScore !== undefined && (
                                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Graham: {stock.grahamScore}/100
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      stock.recommendation === 'Buy'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    }`}>
                                      {stock.recommendation}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{stock.name}</p>
                                
                                {/* Key Metrics */}
                                {stock.keyMetrics && (
                                  <div className="mb-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {stock.keyMetrics.peRatio !== undefined && (
                                      <div>P/E: {stock.keyMetrics.peRatio.toFixed(1)}</div>
                                    )}
                                    {stock.keyMetrics.dividendYield !== undefined && stock.keyMetrics.dividendYield > 0 && (
                                      <div>Dividend Yield: {(stock.keyMetrics.dividendYield * 100).toFixed(2)}%</div>
                                    )}
                                    {stock.keyMetrics.marketCap !== undefined && (
                                      <div>Market Cap: ${(stock.keyMetrics.marketCap / 1_000_000_000).toFixed(1)}B</div>
                                    )}
                                  </div>
                                )}

                                {/* Graham Reasoning */}
                                {stock.grahamReasoning && stock.grahamReasoning.length > 0 && (
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Why it fits:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                                      {stock.grahamReasoning.slice(0, 2).map((reason: string, idx: number) => (
                                        <li key={idx}>{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                    ${stock.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {stock.percentage.toFixed(1)}% • {stock.confidence}% confidence
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Enterprising Strategy */}
              {plan.enterprising && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Enterprising Investor Strategy
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">{plan.enterprising.timeHorizon}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 italic">{plan.enterprising.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                      plan.enterprising.riskLevel === 'Low'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : plan.enterprising.riskLevel === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      Risk: {plan.enterprising.riskLevel}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Expected Return: {plan.enterprising.expectedReturn}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {plan.enterprising.allocation.map((allocation: any, idx: number) => (
                    <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {allocation.category}
                        </h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${allocation.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {allocation.percentage}% of portfolio
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{allocation.rationale}</p>
                      
                      {allocation.grahamPrinciple && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Graham's Principle:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 italic">{allocation.grahamPrinciple}</p>
                        </div>
                      )}
                      {allocation.stocks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommended Stocks (Graham Criteria):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {allocation.stocks.map((stock: any, stockIdx: number) => (
                              <div key={stockIdx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <Link
                                    href={`/report?symbol=${stock.symbol}&type=stock`}
                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {stock.symbol}
                                  </Link>
                                  <div className="flex gap-2">
                                    {stock.grahamScore !== undefined && (
                                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Graham: {stock.grahamScore}/100
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      stock.recommendation === 'Buy'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    }`}>
                                      {stock.recommendation}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{stock.name}</p>
                                
                                {/* Key Metrics */}
                                {stock.keyMetrics && (
                                  <div className="mb-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {stock.keyMetrics.peRatio !== undefined && (
                                      <div>P/E: {stock.keyMetrics.peRatio.toFixed(1)}</div>
                                    )}
                                    {stock.keyMetrics.dividendYield !== undefined && stock.keyMetrics.dividendYield > 0 && (
                                      <div>Dividend Yield: {(stock.keyMetrics.dividendYield * 100).toFixed(2)}%</div>
                                    )}
                                    {stock.keyMetrics.marketCap !== undefined && (
                                      <div>Market Cap: ${(stock.keyMetrics.marketCap / 1_000_000_000).toFixed(1)}B</div>
                                    )}
                                  </div>
                                )}

                                {/* Graham Reasoning */}
                                {stock.grahamReasoning && stock.grahamReasoning.length > 0 && (
                                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Why it fits:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                                      {stock.grahamReasoning.slice(0, 2).map((reason: string, idx: number) => (
                                        <li key={idx}>{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                    ${stock.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {stock.percentage.toFixed(1)}% • {stock.confidence}% confidence
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-l-4 border-indigo-500">
                <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                  "The Intelligent Investor"
                </p>
                <p className="text-indigo-800 dark:text-indigo-300 italic mb-2">
                  "The intelligent investor is a realist who sells to optimists and buys from pessimists."
                </p>
                <p className="text-sm text-indigo-700 dark:text-indigo-400">
                  — Benjamin Graham
                </p>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Important Disclaimer:</strong> This portfolio diversification plan is based on principles from "The Intelligent Investor" by Benjamin Graham and is for educational purposes only. 
                  It does not constitute financial advice. Past performance is not indicative of future results. 
                  Always consult with a qualified financial advisor before making investment decisions. 
                  Diversification does not guarantee profits or protect against losses. The margin of safety principle requires careful analysis of each investment.
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Generated: {new Date(plan.generatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
