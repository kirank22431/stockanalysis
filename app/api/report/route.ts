import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { getStockPriceHistory } from '@/lib/providers/yahoo';
import {
  getCompanyProfile,
  getKeyMetrics,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlowStatements,
  getEarningsHistory,
} from '@/lib/providers/fmp';
import {
  getCIKFromTicker,
  getSubmissions,
  getCompanyFacts,
  normalizeFilings,
  extractKeyFacts,
} from '@/lib/providers/sec';
import { getCoinData, getCoinMarketChart } from '@/lib/providers/coingecko';
import { buildStockReport, buildCryptoReport } from '@/lib/analysis/reportBuilder';
import type { PricePoint } from '@/lib/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || searchParams.get('id');
  const type = searchParams.get('type') || 'stock';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol or id parameter is required' },
      { status: 400 }
    );
  }

  const normalizedSymbol = symbol.toUpperCase().trim();
  const assetType = type.toLowerCase() === 'crypto' ? 'crypto' : 'stock';

  // Check cache
  const cacheKey = `report:${assetType}:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const sources: Record<string, string[]> = {};

  try {
    if (assetType === 'stock') {
      // Stock analysis
      const [
        priceHistory,
        companyProfile,
        keyMetrics,
        incomeStatements,
        balanceSheets,
        cashFlows,
        earnings,
      ] = await Promise.all([
        getStockPriceHistory(normalizedSymbol),
        getCompanyProfile(normalizedSymbol),
        getKeyMetrics(normalizedSymbol),
        getIncomeStatements(normalizedSymbol),
        getBalanceSheets(normalizedSymbol),
        getCashFlowStatements(normalizedSymbol),
        getEarningsHistory(normalizedSymbol),
      ]);

      if (priceHistory.error || !priceHistory.data || priceHistory.data.length === 0) {
        return NextResponse.json(
          {
            error: priceHistory.error?.error || 'Failed to fetch price data',
          },
          { status: 500 }
        );
      }

      const prices = priceHistory.data;

      sources['Yahoo Finance'] = ['chart'];
      if (companyProfile.data) sources['Financial Modeling Prep'] = ['company/profile'];
      if (keyMetrics.data.length > 0) sources['Financial Modeling Prep'].push('key-metrics-ttm');
      if (incomeStatements.data.length > 0) sources['Financial Modeling Prep'].push('income-statement');
      if (balanceSheets.data.length > 0) sources['Financial Modeling Prep'].push('balance-sheet-statement');
      if (cashFlows.data.length > 0) sources['Financial Modeling Prep'].push('cash-flow-statement');
      if (earnings.data.length > 0) sources['Financial Modeling Prep'].push('historical/earning_calendar');

      // Get SEC filings
      let filings: any[] = [];
      let keyFacts: { revenue?: number; netIncome?: number; sharesOutstanding?: number } | undefined;

      if (companyProfile.data?.cik) {
        const cikResult = await getSubmissions(companyProfile.data.cik);
        if (cikResult.data) {
          filings = normalizeFilings(cikResult.data);
          sources['SEC EDGAR'] = ['submissions'];

          const factsResult = await getCompanyFacts(companyProfile.data.cik);
          if (factsResult.data) {
            const extracted = extractKeyFacts(factsResult.data);
            keyFacts = {
              revenue: extracted.revenue ?? undefined,
              netIncome: extracted.netIncome ?? undefined,
              sharesOutstanding: extracted.sharesOutstanding ?? undefined,
            };
            sources['SEC EDGAR'].push('companyfacts');
          }
        }
      } else {
        // Try to get CIK from ticker
        const cikResult = await getCIKFromTicker(normalizedSymbol);
        if (cikResult.cik) {
          const submissionsResult = await getSubmissions(cikResult.cik);
          if (submissionsResult.data) {
            filings = normalizeFilings(submissionsResult.data);
            sources['SEC EDGAR'] = ['submissions'];

            const factsResult = await getCompanyFacts(cikResult.cik);
            if (factsResult.data) {
              const extracted = extractKeyFacts(factsResult.data);
              keyFacts = {
                revenue: extracted.revenue ?? undefined,
                netIncome: extracted.netIncome ?? undefined,
                sharesOutstanding: extracted.sharesOutstanding ?? undefined,
              };
              sources['SEC EDGAR'].push('companyfacts');
            }
          }
        }
      }

      const report = buildStockReport({
        symbol: normalizedSymbol,
        prices,
        companyProfile: companyProfile.data,
        keyMetrics: keyMetrics.data,
        incomeStatements: incomeStatements.data,
        balanceSheets: balanceSheets.data,
        cashFlows: cashFlows.data,
        earnings: earnings.data,
        filings,
        keyFacts,
        sources,
      });

      // Cache for 1 hour
      setCache(cacheKey, report);

      return NextResponse.json(report);
    } else {
      // Crypto analysis
      const coinId = normalizedSymbol.toLowerCase();
      const [coinData, marketChart] = await Promise.all([
        getCoinData(coinId),
        getCoinMarketChart(coinId, 365),
      ]);

      if (coinData.error || !coinData.data) {
        return NextResponse.json(
          {
            error: coinData.error?.error || 'Failed to fetch crypto data',
            rateLimit: coinData.error?.rateLimit,
          },
          { status: 500 }
        );
      }

      if (marketChart.error || !marketChart.data) {
        return NextResponse.json(
          {
            error: marketChart.error?.error || 'Failed to fetch market chart',
            rateLimit: marketChart.error?.rateLimit,
          },
          { status: 500 }
        );
      }

      sources['CoinGecko'] = ['coins', 'market_chart'];

      const report = buildCryptoReport({
        symbol: normalizedSymbol,
        coinId,
        coinData: coinData.data,
        marketChart: marketChart.data,
        sources,
      });

      // Cache for 1 hour
      setCache(cacheKey, report);

      return NextResponse.json(report);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
