import { NextRequest, NextResponse } from 'next/server';
import type { PricePoint } from '@/lib/types';
import {
  calculateKeyMetrics,
  calculateIndicators,
  generateScenarios,
} from '@/lib/analyze';
import { generateDetailedRecommendation } from '@/lib/enhanced-analyze';

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

  try {
    // Get CIK from overview first (needed for SEC filings)
    const overviewRes = await fetch(`${request.nextUrl.origin}/api/overview?symbol=${normalizedSymbol}`);
    const overview = overviewRes.ok ? await overviewRes.json() : null;
    const cik = overview?.CIK;

    // Fetch all data in parallel
    const [quoteRes, newsRes, secRes, earningsRes, financialsRes, analystRes] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/quote?symbol=${normalizedSymbol}`),
      fetch(`${request.nextUrl.origin}/api/news?symbol=${normalizedSymbol}`),
      cik ? fetch(`${request.nextUrl.origin}/api/sec-filings?symbol=${normalizedSymbol}&cik=${cik}`) : Promise.resolve({ ok: false }),
      fetch(`${request.nextUrl.origin}/api/earnings?symbol=${normalizedSymbol}`),
      fetch(`${request.nextUrl.origin}/api/financials?symbol=${normalizedSymbol}&statement=income-statement`),
      fetch(`${request.nextUrl.origin}/api/analyst-reports?symbol=${normalizedSymbol}`),
    ]);

    // Handle quote data (required)
    if (!quoteRes.ok) {
      const errorData = await quoteRes.json();
      console.log('=== Analyze Route: Quote API Error ===');
      console.log('Status:', quoteRes.status);
      console.log('Error data:', JSON.stringify(errorData, null, 2));
      console.log('======================================');
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to fetch quote data', 
          rateLimit: errorData.rateLimit,
          apiResponse: errorData.apiResponse, // Pass through API response for debugging
          validationError: errorData.validationError,
          dataKeys: errorData.dataKeys,
          hasMetaData: errorData.hasMetaData,
          hasTimeSeries: errorData.hasTimeSeries
        },
        { status: quoteRes.status }
      );
    }

    const quoteData = await quoteRes.json();
    const timeSeries = quoteData['Time Series (Daily)'];

    if (!timeSeries) {
      return NextResponse.json(
        { error: 'No time series data available' },
        { status: 404 }
      );
    }

    // Convert to PricePoint array (last 100 trading days)
    const prices: PricePoint[] = Object.entries(timeSeries)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-100)
      .map(([date, data]: [string, any]) => ({
        date,
        close: parseFloat(data['4. close']),
        volume: parseFloat(data['5. volume']), // TIME_SERIES_DAILY uses '5. volume' (not '6. volume')
      }));

    if (prices.length === 0) {
      return NextResponse.json(
        { error: 'No price data available' },
        { status: 404 }
      );
    }

    // Get all optional data
    const news = newsRes.ok ? await newsRes.json() : null;
    const secFilings = secRes.ok ? await secRes.json() : null;
    const earnings = earningsRes.ok ? await earningsRes.json() : null;
    const incomeStatements = financialsRes.ok ? await financialsRes.json() : null;
    const analystReports = analystRes.ok ? await analystRes.json() : null;

    // Calculate metrics and indicators
    const metrics = calculateKeyMetrics(prices);
    const indicators = calculateIndicators(prices);
    const scenarios = generateScenarios(prices, metrics.lastClose);
    
    // Generate enhanced recommendation with all data
    const recommendation = generateDetailedRecommendation(
      prices,
      indicators,
      overview,
      news,
      earnings,
      incomeStatements
    );

    return NextResponse.json({
      symbol: normalizedSymbol,
      prices,
      metrics,
      indicators,
      fundamentals: overview,
      newsSentiment: news,
      recommendation,
      scenarios,
      secFilings,
      earnings,
      incomeStatements,
      analystReports,
    });
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
