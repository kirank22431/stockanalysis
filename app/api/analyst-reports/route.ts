import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import YahooFinance from 'yahoo-finance2';

// Note: Goldman Sachs and BlackRock don't provide free public APIs for their research reports
// This endpoint provides analyst recommendations and insights from available free sources
// In a production environment, you would integrate with premium data providers

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  const normalizedSymbol = symbol.toUpperCase().trim();

  // Check cache
  const cacheKey = `analyst-reports:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const yf = new YahooFinance();
    
    // Get analyst recommendations and insights from Yahoo Finance
    const quote = await yf.quote(normalizedSymbol).catch(() => null);

    if (!quote) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    // Build analyst report structure
    const report = {
      symbol: normalizedSymbol,
      companyName: quote.longName || quote.shortName || normalizedSymbol,
      currentPrice: quote.regularMarketPrice || 0,
      targetPrice: quote.targetMeanPrice || null,
      analystCount: quote.numberOfAnalystOpinions || 0,
      recommendations: {
        strongBuy: quote.recommendationMean?.strongBuy || 0,
        buy: quote.recommendationMean?.buy || 0,
        hold: quote.recommendationMean?.hold || 0,
        sell: quote.recommendationMean?.sell || 0,
        strongSell: quote.recommendationMean?.strongSell || 0,
      },
      recommendationKey: quote.recommendationKey || 'N/A',
      // Simulated institutional analysis (in production, this would come from premium APIs)
      institutionalAnalysis: {
        // These would typically come from Goldman Sachs, BlackRock, etc. via premium APIs
        note: 'Institutional research reports from Goldman Sachs, BlackRock, and other major institutions are typically available through premium data providers. This is a simulated structure.',
        sources: [
          {
            name: 'Goldman Sachs',
            available: false,
            note: 'Requires premium subscription or institutional access',
          },
          {
            name: 'BlackRock',
            available: false,
            note: 'Requires premium subscription or institutional access',
          },
        ],
      },
      // Available analyst data from free sources
      availableData: {
        priceTarget: quote.targetMeanPrice,
        priceTargetHigh: quote.targetHighPrice,
        priceTargetLow: quote.targetLowPrice,
        earningsEstimate: quote.earningsEstimate,
        revenueEstimate: quote.revenueEstimate,
      },
      // Additional analyst data
      earningsGrowth: quote.earningsGrowth || null,
      revenueGrowth: quote.revenueGrowth || null,
    };

    // Cache for 4 hours (analyst reports don't change frequently)
    setCache(cacheKey, report);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching analyst reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyst reports' },
      { status: 500 }
    );
  }
}
