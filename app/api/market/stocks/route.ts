import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { getStocksForSector } from '@/lib/data/sectorStocks';
import { buildStockReport } from '@/lib/analysis/reportBuilder';
import { getStockPriceHistory } from '@/lib/providers/yahoo';
import { getCompanyProfile, getKeyMetrics } from '@/lib/providers/fmp';

interface StockRecommendation {
  symbol: string;
  name?: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  confidence: number;
  label: 'Bullish' | 'Neutral' | 'Bearish';
  reasons: string[];
}

/**
 * Analyze a single stock and return recommendation
 */
async function analyzeStock(symbol: string): Promise<StockRecommendation | null> {
  try {
    // Check cache first
    const cacheKey = `stock-analysis:${symbol}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached as StockRecommendation;
    }

    // Fetch data in parallel
    const [priceResult, profileResult, metricsResult] = await Promise.all([
      getStockPriceHistory(symbol),
      getCompanyProfile(symbol),
      getKeyMetrics(symbol),
    ]);

    // If we can't get price data, skip this stock
    if (priceResult.error || !priceResult.data || priceResult.data.length === 0) {
      return null;
    }

    // Build report
    const report = buildStockReport({
      symbol,
      prices: priceResult.data,
      profile: profileResult.data || undefined,
      keyMetrics: metricsResult.data || undefined,
      incomeStatements: undefined,
      balanceSheets: undefined,
      cashFlowStatements: undefined,
      earnings: undefined,
      filings: undefined,
    });

    // Safety check: ensure report.summary exists
    if (!report || !report.summary) {
      console.warn(`Report summary missing for ${symbol}`);
      return null;
    }

    const recommendation: StockRecommendation = {
      symbol,
      name: profileResult.data?.companyName || symbol,
      recommendation: report.summary.recommendation || 'Hold',
      confidence: report.summary.confidence || 50,
      label: report.summary.label || 'Neutral',
      reasons: Array.isArray(report.why) 
        ? report.why.slice(0, 3) 
        : [], // Top 3 reasons from the "why" array
    };

    // Cache for 1 hour
    setCache(cacheKey, recommendation, 3600000);

    return recommendation;
  } catch (error) {
    console.error(`Error analyzing stock ${symbol}:`, error);
    return null;
  }
}

/**
 * Get recommended stocks for a sector
 * Returns stocks with "Buy" or "Bullish" recommendations
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sector = searchParams.get('sector');
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  if (!sector) {
    return NextResponse.json(
      { error: 'Sector parameter is required' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `sector-stocks:${sector}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const stocks = getStocksForSector(sector);

    if (stocks.length === 0) {
      return NextResponse.json({
        sector,
        stocks: [],
        message: `No stocks found for sector: ${sector}`,
      });
    }

    // Analyze stocks in batches (to avoid rate limits)
    const batchSize = 3;
    const allRecommendations: StockRecommendation[] = [];
    const failedSymbols: string[] = [];

    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(symbol => analyzeStock(symbol))
      );

      // Process results and track failures
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          allRecommendations.push(result.value);
        } else if (result.status === 'rejected') {
          failedSymbols.push(batch[idx]);
        } else if (result.status === 'fulfilled' && result.value === null) {
          // Symbol not found or no data - silently skip
          failedSymbols.push(batch[idx]);
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < stocks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log summary of failed symbols (only if there are many failures)
    if (failedSymbols.length > stocks.length * 0.5) {
      console.warn(`Many symbols failed for sector ${sector}: ${failedSymbols.length}/${stocks.length} symbols could not be analyzed`);
    }

    // Sort by confidence (highest first)
    const sortedStocks = allRecommendations
      .sort((a, b) => b.confidence - a.confidence);

    // Prioritize "Buy" or "Bullish" recommendations, but include others if needed
    const buyStocks = sortedStocks.filter(
      r => r.recommendation === 'Buy' || r.label === 'Bullish'
    );
    
    const topStocks = buyStocks.length >= limit
      ? buyStocks.slice(0, limit) // If we have enough Buy stocks, use only those
      : [
          ...buyStocks, // Include all Buy stocks
          ...sortedStocks
            .filter(r => r.recommendation !== 'Buy' && r.label !== 'Bullish')
            .slice(0, Math.max(0, limit - buyStocks.length)) // Fill remaining slots with top Hold/Sell stocks
        ];

    const result = {
      sector,
      stocks: topStocks,
      totalAnalyzed: stocks.length,
      successfullyAnalyzed: allRecommendations.length,
      buyCount: buyStocks.length,
      generatedAt: new Date().toISOString(),
    };

    // Cache for 30 minutes
    setCache(cacheKey, result, 1800000);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching sector stocks for ${sector}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        sector,
        stocks: [],
        message: 'Failed to analyze stocks. Some symbols may be delisted or unavailable.',
      },
      { status: 500 }
    );
  }
}
