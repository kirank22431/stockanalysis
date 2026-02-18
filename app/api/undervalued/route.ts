import { NextRequest, NextResponse } from 'next/server';
import { getStockPriceHistory } from '@/lib/providers/yahoo';
import { getCompanyProfile, getKeyMetrics } from '@/lib/providers/fmp';
import { analyzeValuation } from '@/lib/analysis/valuation';
import { getIndustryMetrics } from '@/lib/providers/damodaran';
import { getCache, setCache } from '@/lib/cache';

interface UndervaluedStock {
  symbol: string;
  name: string;
  currentPrice: number;
  fairValue: number | null;
  upsidePotential: number;
  valuationStatus: 'undervalued' | 'fair' | 'overvalued';
  confidence: number;
  sector?: string;
  industry?: string;
  peRatio?: number;
  industryPE?: number;
  metrics: {
    peRatio?: number;
    priceToSales?: number;
    priceToBook?: number;
    evToEbitda?: number;
    profitMargin?: number;
  };
  relativeValuation: {
    status: 'undervalued' | 'fair' | 'overvalued';
    details: Array<{ metric: string; stock: number | undefined; industry: number; difference: number }>;
  };
  methodology: string[];
  intrinsicValues?: {
    graham: number | null;
    dcf: number | null;
    relative: number | null;
    average: number | null;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const minUpside = parseFloat(searchParams.get('minUpside') || '10'); // Minimum 10% upside
  const maxPE = parseFloat(searchParams.get('maxPE') || '50'); // Maximum P/E ratio

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  const normalizedSymbol = symbol.toUpperCase().trim();
  const cacheKey = `undervalued:${normalizedSymbol}`;
  const cached = getCache<UndervaluedStock>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Fetch data in parallel
    const [priceResult, profileResult, metricsResult] = await Promise.allSettled([
      getStockPriceHistory(normalizedSymbol),
      getCompanyProfile(normalizedSymbol),
      getKeyMetrics(normalizedSymbol),
    ]);

    // Check if we have price data
    if (priceResult.status === 'rejected' || !priceResult.value.data || priceResult.value.data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch price data for this symbol' },
        { status: 404 }
      );
    }

    const prices = priceResult.value.data;
    const currentPrice = prices[prices.length - 1].close;

    // Get company profile
    const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
    const metrics = metricsResult.status === 'fulfilled' && metricsResult.value.data 
      ? metricsResult.value.data[0] 
      : null;

    // Extract metrics
    const peRatio = metrics?.peRatio || undefined;
    const priceToSales = metrics?.priceToSalesRatio || undefined;
    const priceToBook = metrics?.pbRatio || metrics?.ptbRatio || undefined;
    const evToEbitda = metrics?.enterpriseValueOverEBITDA || undefined;
    const profitMargin = undefined; // Would need income statement
    const eps = undefined; // Would need income statement
    const bookValue = metrics?.bookValuePerShare || undefined;
    const revenue = undefined; // Would need income statement
    const revenueGrowth = undefined; // Would need multiple income statements
    const earningsGrowth = undefined; // Would need multiple income statements
    const freeCashFlow = metrics?.freeCashFlowPerShare ? 
      (metrics.freeCashFlowPerShare * (metrics.marketCap ? metrics.marketCap / currentPrice : 0)) : undefined;
    const sharesOutstanding = metrics?.marketCap ? metrics.marketCap / currentPrice : undefined;

    // Perform valuation analysis
    const valuation = analyzeValuation(
      currentPrice,
      profile?.sector,
      {
        eps,
        bookValue,
        freeCashFlow,
        revenue,
        revenueGrowth,
        earningsGrowth,
        profitMargin,
        peRatio,
        evToEbitda,
        priceToSales,
        priceToBook,
        sharesOutstanding,
      }
    );

    // More flexible criteria for undervalued stocks
    // Consider stocks that are:
    // 1. Marked as undervalued (>15% discount), OR
    // 2. Have positive upside potential above threshold, OR
    // 3. Are undervalued relative to industry (even if absolute valuation is fair)
    const hasPositiveUpside = valuation.upsideDownside.fairValueUpside >= minUpside;
    const isUndervaluedAbsolute = valuation.valuationStatus === 'undervalued';
    const isUndervaluedRelative = valuation.relativeValuation.status === 'undervalued';
    const isFairWithUpside = valuation.valuationStatus === 'fair' && hasPositiveUpside;
    const hasReasonablePE = !peRatio || peRatio <= maxPE;

    // Consider stock undervalued if:
    // - It's absolutely undervalued (>15% discount), OR
    // - It's relatively undervalued vs industry, OR  
    // - It's fair valued but has good upside potential
    const isUndervalued = (isUndervaluedAbsolute || isUndervaluedRelative || isFairWithUpside) && hasReasonablePE;

    // If it doesn't meet criteria, still return analysis but with a warning
    if (!isUndervalued) {
      return NextResponse.json(
        { 
          error: 'Stock does not meet strict undervalued criteria',
          warning: true,
          details: {
            valuationStatus: valuation.valuationStatus,
            relativeValuationStatus: valuation.relativeValuation.status,
            upsidePotential: valuation.upsideDownside.fairValueUpside,
            peRatio,
            meetsPE: hasReasonablePE,
            meetsUpside: hasPositiveUpside,
            meetsAbsolute: isUndervaluedAbsolute,
            meetsRelative: isUndervaluedRelative,
          },
          // Still return the full analysis so user can see why
          analysis: {
            symbol: normalizedSymbol,
            name: profile?.companyName || normalizedSymbol,
            currentPrice,
            fairValue: valuation.intrinsicValue.average,
            upsidePotential: valuation.upsideDownside.fairValueUpside,
            valuationStatus: valuation.valuationStatus,
            confidence: valuation.confidence,
            sector: profile?.sector,
            industry: profile?.industry,
            peRatio,
            industryPE: profile?.sector ? 
              getIndustryMetrics(profile.sector)?.peRatio : undefined,
            metrics: {
              peRatio,
              priceToSales,
              priceToBook,
              evToEbitda,
              profitMargin,
            },
            relativeValuation: valuation.relativeValuation,
            methodology: valuation.methodology,
            intrinsicValues: valuation.intrinsicValue,
          },
          // Return full result even if it doesn't meet strict criteria
          result: {
            symbol: normalizedSymbol,
            name: profile?.companyName || normalizedSymbol,
            currentPrice,
            fairValue: valuation.intrinsicValue.average,
            upsidePotential: valuation.upsideDownside.fairValueUpside,
            valuationStatus: valuation.valuationStatus,
            confidence: valuation.confidence,
            sector: profile?.sector,
            industry: profile?.industry,
            peRatio,
            industryPE: profile?.sector ? 
              getIndustryMetrics(profile.sector)?.peRatio : undefined,
            metrics: {
              peRatio,
              priceToSales,
              priceToBook,
              evToEbitda,
              profitMargin,
            },
            relativeValuation: valuation.relativeValuation,
            methodology: valuation.methodology,
            intrinsicValues: valuation.intrinsicValue,
          }
        },
        { status: 200 }
      );
    }

    const result: UndervaluedStock = {
      symbol: normalizedSymbol,
      name: profile?.companyName || normalizedSymbol,
      currentPrice,
      fairValue: valuation.intrinsicValue.average,
      upsidePotential: valuation.upsideDownside.fairValueUpside,
      valuationStatus: valuation.valuationStatus,
      confidence: valuation.confidence,
      sector: profile?.sector,
      industry: profile?.industry,
      peRatio,
      industryPE: profile?.sector ? 
        getIndustryMetrics(profile.sector)?.peRatio : undefined,
      metrics: {
        peRatio,
        priceToSales,
        priceToBook,
        evToEbitda,
        profitMargin,
      },
      relativeValuation: valuation.relativeValuation,
      methodology: valuation.methodology,
      intrinsicValues: valuation.intrinsicValue,
    };

    // Cache for 1 hour
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing undervalued stock:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}
