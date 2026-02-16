import { z } from 'zod';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Zod schemas for Alpha Vantage responses
const TimeSeriesDailySchema = z.object({
  'Meta Data': z.object({
    '2. Symbol': z.string(),
    '3. Last Refreshed': z.string(),
  }),
  'Time Series (Daily)': z.record(z.object({
    '1. open': z.string(),
    '2. high': z.string(),
    '3. low': z.string(),
    '4. close': z.string(),
    '5. volume': z.string(),
  })),
});

const SectorPerformanceSchema = z.object({
  'Meta Data': z.object({
    'Information': z.string(),
    'Last Refreshed': z.string(),
  }),
  'Rank A: Real-Time Performance': z.record(z.object({
    'Information Technology': z.string().optional(),
    'Consumer Discretionary': z.string().optional(),
    'Communication Services': z.string().optional(),
    'Financials': z.string().optional(),
    'Health Care': z.string().optional(),
    'Industrials': z.string().optional(),
    'Consumer Staples': z.string().optional(),
    'Energy': z.string().optional(),
    'Utilities': z.string().optional(),
    'Real Estate': z.string().optional(),
    'Materials': z.string().optional(),
  })),
});

const ErrorResponseSchema = z.object({
  'Error Message': z.string().optional(),
  'Note': z.string().optional(),
  'Information': z.string().optional(),
});

interface ProviderError {
  error: string;
  retryable: boolean;
  rateLimit?: boolean;
}

async function fetchWithRetry(
  url: string,
  maxRetries = 2,
  timeout = 10000
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'StockAnalysisApp/1.0',
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getStockPriceHistory(
  symbol: string,
  cacheKey?: string
): Promise<{ data: z.infer<typeof TimeSeriesDailySchema>; error?: ProviderError }> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return {
      data: {} as any,
      error: { error: 'Alpha Vantage API key not configured', retryable: false },
    };
  }

  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return {
        data: {} as any,
        error: {
          error: `HTTP ${response.status}`,
          retryable: response.status >= 500,
        },
      };
    }

    const json = await response.json();

    // Check for errors first
    if (json['Error Message']) {
      const errorMsg = json['Error Message'];
      return {
        data: {} as any,
        error: {
          error: errorMsg,
          retryable: false,
          rateLimit: errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('api call frequency') || errorMsg.toLowerCase().includes('thank you for using'),
        },
      };
    }

    if (json['Note']) {
      const noteMsg = json['Note'];
      // Check if it's a rate limit message
      if (noteMsg.toLowerCase().includes('thank you for using') || noteMsg.toLowerCase().includes('api call frequency')) {
        return {
          data: {} as any,
          error: {
            error: 'Rate limit exceeded. Please try again later. Free tier: 5 calls/minute, 500 calls/day.',
            retryable: false,
            rateLimit: true,
          },
        };
      }
    }

    // Check if we have the expected data structure
    if (!json['Time Series (Daily)'] && !json['Meta Data']) {
      console.error('Alpha Vantage unexpected response:', JSON.stringify(json, null, 2));
      return {
        data: {} as any,
        error: {
          error: json['Note'] || json['Error Message'] || 'Invalid data format from Alpha Vantage',
          retryable: false,
        },
      };
    }

    const validated = TimeSeriesDailySchema.safeParse(json);
    if (!validated.success) {
      console.error('Alpha Vantage validation error:', validated.error);
      console.error('Alpha Vantage response keys:', Object.keys(json));
      return {
        data: {} as any,
        error: {
          error: json['Note'] || json['Error Message'] || 'Invalid data format from Alpha Vantage. Please check your API key and try again.',
          retryable: false,
        },
      };
    }

    return { data: validated.data };
  } catch (error) {
    return {
      data: {} as any,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getSectorPerformance(): Promise<{
  data: z.infer<typeof SectorPerformanceSchema> | null;
  error?: ProviderError;
}> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return {
      data: null,
      error: { error: 'Alpha Vantage API key not configured', retryable: false },
    };
  }

  try {
    const url = `${BASE_URL}?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return {
        data: null,
        error: {
          error: `HTTP ${response.status}`,
          retryable: response.status >= 500,
        },
      };
    }

    const json = await response.json();

    const errorCheck = ErrorResponseSchema.safeParse(json);
    if (errorCheck.success && (errorCheck.data['Error Message'] || errorCheck.data['Note'])) {
      return {
        data: null,
        error: {
          error: errorCheck.data['Error Message'] || errorCheck.data['Note'] || 'Unknown error',
          retryable: false,
          rateLimit: true,
        },
      };
    }

    const validated = SectorPerformanceSchema.safeParse(json);
    if (!validated.success) {
      return { data: null };
    }

    return { data: validated.data };
  } catch (error) {
    return {
      data: null,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}
