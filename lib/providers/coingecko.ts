import { z } from 'zod';

const BASE_URL = 'https://api.coingecko.com/api/v3';

const CoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  market_cap_change_24h: z.number().nullable(),
  market_cap_change_percentage_24h: z.number().nullable(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(),
  ath_change_percentage: z.number().nullable(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(),
  atl_change_percentage: z.number().nullable(),
  atl_date: z.string().nullable(),
  roi: z.object({
    times: z.number(),
    currency: z.string(),
    percentage: z.number(),
  }).nullable(),
  last_updated: z.string(),
});

const CoinHistorySchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_data: z.object({
    current_price: z.record(z.number()),
    market_cap: z.record(z.number()).optional(),
    total_volume: z.record(z.number()).optional(),
    high_24h: z.record(z.number()).optional(),
    low_24h: z.record(z.number()).optional(),
    price_change_percentage_7d: z.number().nullable().optional(),
    price_change_percentage_30d: z.number().nullable().optional(),
    price_change_percentage_1y: z.number().nullable().optional(),
  }),
  market_cap_rank: z.number().nullable().optional(),
  last_updated: z.string(),
});

const CoinMarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])), // [timestamp, price]
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
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

export async function getCoinData(
  coinId: string
): Promise<{ data: z.infer<typeof CoinSchema> | null; error?: ProviderError }> {
  try {
    const url = `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          data: null,
          error: { error: 'Rate limit exceeded', retryable: true, rateLimit: true },
        };
      }
      return {
        data: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const json = await response.json();
    const validated = CoinSchema.safeParse(json);

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

export async function getCoinMarketChart(
  coinId: string,
  days = 365
): Promise<{ data: z.infer<typeof CoinMarketChartSchema> | null; error?: ProviderError }> {
  try {
    const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          data: null,
          error: { error: 'Rate limit exceeded', retryable: true, rateLimit: true },
        };
      }
      return {
        data: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const json = await response.json();
    const validated = CoinMarketChartSchema.safeParse(json);

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

export async function getCoinHistory(
  coinId: string,
  date: string // YYYY-MM-DD format
): Promise<{ data: z.infer<typeof CoinHistorySchema> | null; error?: ProviderError }> {
  try {
    const url = `${BASE_URL}/coins/${coinId}/history?date=${date}&localization=false`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          data: null,
          error: { error: 'Rate limit exceeded', retryable: true, rateLimit: true },
        };
      }
      return {
        data: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const json = await response.json();
    const validated = CoinHistorySchema.safeParse(json);

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
