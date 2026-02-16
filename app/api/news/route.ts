import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

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
  if (!/^[A-Z.]+$/.test(normalizedSymbol)) {
    return NextResponse.json(
      { error: 'Invalid symbol format' },
      { status: 400 }
    );
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json(null); // Graceful degradation
  }

  // Check cache
  const cacheKey = `news:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Get news from last 7 days
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `https://finnhub.io/api/v1/company-news?symbol=${normalizedSymbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(null); // Graceful degradation
    }

    const data = await response.json();

    // Check for errors
    if (data.error || !Array.isArray(data)) {
      return NextResponse.json(null); // Graceful degradation
    }

    // Transform Finnhub format to Alpha Vantage format for compatibility
    const transformed = {
      feed: data.slice(0, 10).map((article: any) => ({
        title: article.headline || '',
        url: article.url || '',
        time_published: article.datetime ? new Date(article.datetime * 1000).toISOString() : '',
        authors: article.source ? [article.source] : [],
        summary: article.summary || '',
        banner_image: article.image || '',
        source: article.source || '',
        category_within_source: article.category || '',
        source_domain: article.source || '',
        topics: [],
        overall_sentiment_score: 0, // Finnhub doesn't provide sentiment scores
        overall_sentiment_label: 'Neutral',
        ticker_sentiment: [{
          ticker: normalizedSymbol,
          relevance_score: '1.0',
          ticker_sentiment_score: '0',
          ticker_sentiment_label: 'Neutral',
        }],
      })),
    };

    // Cache the result
    setCache(cacheKey, transformed);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return null on error (graceful degradation)
    return NextResponse.json(null);
  }
}
