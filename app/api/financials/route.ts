import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

const FMP_API_KEY = process.env.FMP_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const statement = searchParams.get('statement') || 'income-statement'; // income-statement, balance-sheet, cash-flow

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  const normalizedSymbol = symbol.toUpperCase().trim();

  // Check cache
  const cacheKey = `financials:${normalizedSymbol}:${statement}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // If no FMP API key, return null (graceful degradation)
  if (!FMP_API_KEY) {
    return NextResponse.json(null);
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/${statement}/${normalizedSymbol}?limit=5&apikey=${FMP_API_KEY}`;
    
    const response = await fetch(url, {
      next: { revalidate: 7200 }, // Cache for 2 hours
    });

    if (!response.ok) {
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
    console.error('Error fetching financials:', error);
    return NextResponse.json(null);
  }
}
