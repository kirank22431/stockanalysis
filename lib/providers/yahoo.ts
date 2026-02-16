import YahooFinance from 'yahoo-finance2';
import type { PricePoint } from '@/lib/types';

interface ProviderError {
  error: string;
  retryable: boolean;
}

const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });

export async function getStockPriceHistory(
  symbol: string
): Promise<{ data: PricePoint[]; error?: ProviderError }> {
  try {
    // Normalize symbol (remove common suffixes that might cause issues)
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    const chartResult = await yf.chart(normalizedSymbol, {
      period1: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000), // 1 year ago
      period2: Math.floor(Date.now() / 1000),
      interval: '1d',
    });

    if (!chartResult?.quotes || chartResult.quotes.length === 0) {
      return {
        data: [],
        error: { error: 'No price data available for symbol', retryable: false },
      };
    }

    const prices: PricePoint[] = chartResult.quotes
      .filter((q: any) => q.date && q.close !== undefined && q.close !== null)
      .map((q: any) => {
        const date = q.date instanceof Date ? q.date : new Date(q.date * 1000);
        return {
          date: date.toISOString().split('T')[0],
          close: q.close,
          volume: q.volume || 0,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (prices.length === 0) {
      return {
        data: [],
        error: { error: 'No valid price data found', retryable: false },
      };
    }

    return { data: prices };
  } catch (error) {
    // Check if it's a "not found" or "delisted" error - these are expected for some symbols
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFoundError = errorMessage.includes('No data found') || 
                           errorMessage.includes('delisted') ||
                           errorMessage.includes('not found') ||
                           errorMessage.includes('Invalid symbol');

    // Only log unexpected errors, not "not found" errors which are common
    if (!isNotFoundError) {
      console.error(`Yahoo Finance error for ${symbol}:`, errorMessage);
    }

    return {
      data: [],
      error: {
        error: isNotFoundError ? 'Symbol not found or delisted' : errorMessage,
        retryable: !isNotFoundError, // Don't retry if symbol is not found
      },
    };
  }
}

export async function getCompanyQuote(symbol: string): Promise<{
  data: {
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap?: number;
    volume?: number;
    high52w?: number;
    low52w?: number;
    pe?: number;
    eps?: number;
  } | null;
  error?: ProviderError;
}> {
  try {
    const quote = await yf.quote(symbol);

    if (!quote) {
      return { data: null, error: { error: 'Symbol not found', retryable: false } };
    }

    return {
      data: {
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        marketCap: quote.marketCap,
        volume: quote.regularMarketVolume,
        high52w: quote.fiftyTwoWeekHigh,
        low52w: quote.fiftyTwoWeekLow,
        pe: quote.trailingPE,
        eps: quote.trailingEps,
      },
    };
  } catch (error) {
    return {
      data: null,
      error: {
        error: error instanceof Error ? error.message : 'Failed to fetch quote',
        retryable: true,
      },
    };
  }
}

export async function getSectorPerformance(): Promise<{
  data: Array<{ sector: string; performance: number }> | null;
  error?: ProviderError;
}> {
  // Yahoo Finance doesn't have a direct sector performance endpoint
  // We'll use a list of major sector ETFs to approximate
  const sectorETFs = [
    { symbol: 'XLK', sector: 'Technology' },
    { symbol: 'XLE', sector: 'Energy' },
    { symbol: 'XLF', sector: 'Financial Services' },
    { symbol: 'XLV', sector: 'Healthcare' },
    { symbol: 'XLI', sector: 'Industrials' },
    { symbol: 'XLP', sector: 'Consumer Defensive' },
    { symbol: 'XLY', sector: 'Consumer Cyclical' },
    { symbol: 'XLU', sector: 'Utilities' },
    { symbol: 'XLB', sector: 'Basic Materials' },
    { symbol: 'XLRE', sector: 'Real Estate' },
    { symbol: 'XLC', sector: 'Communication Services' },
  ];
  
  // Map ETF sector names to our internal sector names
  const sectorNameMap: Record<string, string> = {
    'Financials': 'Financial Services',
    'Consumer Staples': 'Consumer Defensive',
    'Consumer Discretionary': 'Consumer Cyclical',
    'Materials': 'Basic Materials',
  };

  try {
    const quotes = await Promise.allSettled(
      sectorETFs.map((etf) => yf.quote(etf.symbol))
    );

    const sectors = quotes
      .map((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          const quote = result.value;
          const changePercent = quote.regularMarketChangePercent || 0;
          let sectorName = sectorETFs[idx].sector;
          // Map to our internal sector names
          sectorName = sectorNameMap[sectorName] || sectorName;
          return {
            sector: sectorName,
            performance: changePercent * 100, // Convert to percentage
          };
        }
        return null;
      })
      .filter((s): s is { sector: string; performance: number } => s !== null)
      .sort((a, b) => b.performance - a.performance);

    return { data: sectors };
  } catch (error) {
    return {
      data: null,
      error: {
        error: error instanceof Error ? error.message : 'Failed to fetch sector performance',
        retryable: true,
      },
    };
  }
}
