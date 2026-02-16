import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { EarningsResponse } from '@/lib/types';

const FMP_API_KEY = process.env.FMP_API_KEY;

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
  const cacheKey = `earnings:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // If no FMP API key, return null (graceful degradation)
  if (!FMP_API_KEY) {
    return NextResponse.json(null);
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${normalizedSymbol}?apikey=${FMP_API_KEY}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      // Return null on error (graceful degradation)
      return NextResponse.json(null);
    }

    const data = await response.json();

    // Validate response
    if (Array.isArray(data) && data.length > 0) {
      // Cache the result
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    // Return null on error (graceful degradation)
    return NextResponse.json(null);
  }
}
