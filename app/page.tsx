'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<'stock' | 'crypto'>('stock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalizedSymbol = symbol.trim();
      if (normalizedSymbol) {
        setIsSubmitting(true);
        router.push(`/report?symbol=${encodeURIComponent(normalizedSymbol)}&type=${assetType}`);
      }
    },
    [symbol, assetType, router]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="text-4xl sm:text-5xl md:text-6xl">📈</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-4 sm:mb-5 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 leading-tight">
              Market Intelligence
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light px-2">
              Professional-grade stock & crypto analysis platform
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 px-2">
              Powered by Yahoo Finance, Financial Modeling Prep, SEC EDGAR & CoinGecko
            </p>
          </div>

          {/* Main Search Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-white/20">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Asset Type */}
                <div className="relative w-full sm:w-auto sm:min-w-[140px]">
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as 'stock' | 'crypto')}
                    className="w-full appearance-none px-4 sm:px-6 py-3 sm:py-4 pr-10 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white font-semibold cursor-pointer text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="stock" className="bg-gray-800 text-white">📊 Stock</option>
                    <option value="crypto" className="bg-gray-800 text-white">₿ Crypto</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Symbol Input */}
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={
                    assetType === 'stock'
                      ? 'Enter stock ticker (e.g., AAPL)'
                      : 'Enter crypto id (e.g., bitcoin)'
                  }
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 font-medium"
                  disabled={isSubmitting}
                />

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !symbol.trim()}
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Analyzing...</span>
                      <span className="sm:hidden">Loading...</span>
                    </span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Generate Report</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link
              href="/undervalued"
              className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:bg-white/15 transition-all border border-white/20 hover:border-purple-400/50 active:scale-95"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  💎
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 truncate">Undervalued Finder</h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">Damodaran valuation</p>
                </div>
              </div>
            </Link>

            <Link
              href="/market"
              className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:bg-white/15 transition-all border border-white/20 hover:border-purple-400/50 active:scale-95"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  📊
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 truncate">Market Overview</h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">Sector performance & trends</p>
                </div>
              </div>
            </Link>

            <Link
              href="/filings"
              className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:bg-white/15 transition-all border border-white/20 hover:border-purple-400/50 active:scale-95"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 truncate">SEC Filings</h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">Browse SEC filings</p>
                </div>
              </div>
            </Link>

            <Link
              href="/portfolio"
              className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:bg-white/15 transition-all border border-white/20 hover:border-purple-400/50 active:scale-95"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  💼
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 truncate">Portfolio Planner</h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">Diversification strategies</p>
                </div>
              </div>
            </Link>

            <Link
              href="/social/x-curated"
              className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:bg-white/15 transition-all border border-white/20 hover:border-purple-400/50 active:scale-95"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  🐦
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 truncate">X Curated Feed</h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">Social media insights</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Popular Stocks & Crypto */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Popular Assets</h2>
            
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 uppercase tracking-wide">Stocks</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                  {['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META'].map((sym) => (
                    <Link
                      key={sym}
                      href={`/report?symbol=${sym}&type=stock`}
                      className="group px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 hover:border-blue-400/50 text-blue-200 hover:text-white font-semibold rounded-lg text-center transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                    >
                      {sym}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 uppercase tracking-wide">Cryptocurrencies</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  {['bitcoin', 'ethereum', 'cardano', 'solana'].map((id) => (
                    <Link
                      key={id}
                      href={`/report?symbol=${id}&type=crypto`}
                      className="group px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 border border-purple-400/30 hover:border-purple-400/50 text-purple-200 hover:text-white font-semibold rounded-lg text-center transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">{id.charAt(0).toUpperCase() + id.slice(1)}</span>
                      <span className="sm:hidden">{id.charAt(0).toUpperCase() + id.slice(1, 4)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 sm:mt-8 bg-yellow-500/20 backdrop-blur-sm border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-200 font-semibold">
              ⚠️ Educational purposes only. Not financial advice. Always do your own research.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
