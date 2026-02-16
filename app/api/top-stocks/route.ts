import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import YahooFinance from 'yahoo-finance2';
import { calculateIndicators } from '@/lib/analyze';
import { generateDetailedRecommendation } from '@/lib/enhanced-analyze';
import type { PricePoint } from '@/lib/types';

// Popular stocks to analyze
const POPULAR_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'JNJ'];

export async function GET(request: NextRequest) {
  // Check cache
  const cacheKey = 'top-stocks';
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });
    const topStocks: Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      recommendation: string;
      confidence: number;
      score: number;
    }> = [];

    // Analyze top stocks in parallel (limit to 5 for performance)
    const stocksToAnalyze = POPULAR_STOCKS.slice(0, 5);
    const analyses = await Promise.allSettled(
      stocksToAnalyze.map(async (symbol) => {
        try {
          // Get quote and chart data
          const [quote, chartResult] = await Promise.all([
            yf.quote(symbol).catch(() => null),
            yf.chart(symbol, {
              period1: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000),
              period2: Math.floor(Date.now() / 1000),
              interval: '1d',
            }).catch(() => null),
          ]);

          if (!quote || !chartResult?.quotes || chartResult.quotes.length === 0) {
            return null;
          }

          // Convert to PricePoint format
          const prices: PricePoint[] = chartResult.quotes
            .filter((q: any) => q.date && q.close !== undefined)
            .map((q: any) => {
              const date = q.date instanceof Date ? q.date : new Date(q.date * 1000);
              return {
                date: date.toISOString().split('T')[0],
                close: q.close,
                volume: q.volume || 0,
              };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

          if (prices.length < 20) return null; // Need at least 20 days of data

          // Calculate indicators and recommendation
          const indicators = calculateIndicators(prices);
          const recommendation = generateDetailedRecommendation(
            prices,
            indicators,
            null, // No fundamentals for quick analysis
            null, // No news for quick analysis
            null, // No earnings for quick analysis
            null  // No income statements for quick analysis
          );

          return {
            symbol,
            name: quote.longName || quote.shortName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            recommendation: recommendation.action,
            confidence: recommendation.confidence,
            score: recommendation.score,
          };
        } catch (error) {
          console.error(`Error analyzing ${symbol}:`, error);
          return null;
        }
      })
    );

    // Collect successful analyses
    for (const result of analyses) {
      if (result.status === 'fulfilled' && result.value) {
        topStocks.push(result.value);
      }
    }

    // Sort by recommendation score (highest first)
    topStocks.sort((a, b) => b.score - a.score);

    // Cache for 1 hour
    setCache(cacheKey, topStocks);

    return NextResponse.json(topStocks);
  } catch (error) {
    console.error('Error fetching top stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top stocks' },
      { status: 500 }
    );
  }
}
