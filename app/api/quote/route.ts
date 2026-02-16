import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache, clearCache } from '@/lib/cache';
import YahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const clearCacheParam = searchParams.get('clearCache');

  // Allow clearing cache via query parameter for debugging
  if (clearCacheParam === 'true') {
    clearCache();
    return NextResponse.json({ message: 'Cache cleared' });
  }

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // Validate and normalize symbol
  const normalizedSymbol = symbol.toUpperCase().trim();
  if (!/^[A-Z.]+$/.test(normalizedSymbol)) {
    return NextResponse.json(
      { error: 'Invalid symbol format' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `quote:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    console.log('=== Fetching from Yahoo Finance ===');
    console.log('Symbol:', normalizedSymbol);
    
    // Get historical data from Yahoo Finance (last 1 year, daily)
    // Use chart() method as historical() is deprecated
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const queryOptions = {
      period1: Math.floor(startDate.getTime() / 1000),
      period2: Math.floor(endDate.getTime() / 1000),
      interval: '1d' as const,
    };

    // Instantiate YahooFinance and fetch chart data
    // chart() takes symbol as first arg, options as second
    const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });
    const chartResult = await yf.chart(normalizedSymbol, queryOptions);
    
    // Extract the result array from chart response
    const result = chartResult.quotes || [];
    
    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'No data available for this symbol' },
        { status: 404 }
      );
    }

    console.log(`Fetched ${result.length} data points from Yahoo Finance`);

    // Transform Yahoo Finance format to Alpha Vantage-like format for compatibility
    const transformed = {
      'Meta Data': {
        '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
        '2. Symbol': normalizedSymbol,
        '3. Last Refreshed': result.length > 0 ? (() => {
          const lastDate = result[result.length - 1].date;
          if (lastDate instanceof Date) {
            return lastDate.toISOString().split('T')[0];
          } else if (typeof lastDate === 'number') {
            return new Date(lastDate * 1000).toISOString().split('T')[0];
          } else {
            return new Date().toISOString().split('T')[0];
          }
        })() : new Date().toISOString().split('T')[0],
        '4. Output Size': 'Full',
        '5. Time Zone': 'US/Eastern',
      },
      'Time Series (Daily)': {} as Record<string, any>,
    };

    // Convert Yahoo Finance chart data to Alpha Vantage format
    // Chart returns: {date (Date object or timestamp), open, high, low, close, volume}
    for (const day of result) {
      if (!day.date || day.open === undefined || day.open === null) continue; // Skip invalid data
      if (day.high === undefined || day.high === null) continue;
      if (day.low === undefined || day.low === null) continue;
      if (day.close === undefined || day.close === null) continue;
      
      // Handle date - could be Date object or timestamp
      let dateStr: string;
      if (day.date instanceof Date) {
        dateStr = day.date.toISOString().split('T')[0];
      } else if (typeof day.date === 'number') {
        dateStr = new Date(day.date * 1000).toISOString().split('T')[0];
      } else {
        continue; // Skip if date format is unexpected
      }
      
      transformed['Time Series (Daily)'][dateStr] = {
        '1. open': day.open.toFixed(4),
        '2. high': day.high.toFixed(4),
        '3. low': day.low.toFixed(4),
        '4. close': day.close.toFixed(4),
        '5. volume': (day.volume || 0).toString(),
      };
    }

    // Cache the result
    setCache(cacheKey, transformed);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching quote from Yahoo Finance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a symbol not found error
    if (errorMessage.includes('Invalid symbol') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Symbol not found. Please check the symbol and try again.',
          details: errorMessage
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from Yahoo Finance',
        details: errorMessage,
        hint: 'Yahoo Finance is free and doesn\'t require an API key. Please try again in a moment.'
      },
      { status: 500 }
    );
  }
}
