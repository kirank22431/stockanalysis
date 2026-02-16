import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import YahooFinance from 'yahoo-finance2';

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

  // Check cache
  const cacheKey = `overview:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Fetch company data from Yahoo Finance
    const yf = new YahooFinance();
    const quote = await yf.quote(normalizedSymbol);
    
    if (!quote) {
      return NextResponse.json(null);
    }

    // Try to get additional data from Finnhub if available (optional)
    let finnhubData = null;
    if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'your_finnhub_api_key_here') {
      try {
        const [profileRes, metricsRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${normalizedSymbol}&token=${FINNHUB_API_KEY}`, {
            next: { revalidate: 7200 },
          }).catch(() => null),
          fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${normalizedSymbol}&metric=all&token=${FINNHUB_API_KEY}`, {
            next: { revalidate: 7200 },
          }).catch(() => null),
        ]);

        if (profileRes?.ok && metricsRes?.ok) {
          const profile = await profileRes.json();
          const metrics = await metricsRes.json();
          if (!profile.error && !metrics.error) {
            finnhubData = { profile, metrics };
          }
        }
      } catch (e) {
        // Finnhub is optional, continue without it
        console.log('Finnhub data not available, using Yahoo Finance only');
      }
    }

    // Transform to Alpha Vantage format for compatibility
    const transformed = {
      Symbol: normalizedSymbol,
      Name: quote.longName || quote.shortName || '',
      Description: quote.longBusinessSummary || '',
      Exchange: quote.fullExchangeName || quote.exchange || '',
      Currency: quote.currency || 'USD',
      Country: quote.country || 'US',
      Sector: quote.sector || '',
      Industry: quote.industry || '',
      MarketCapitalization: quote.marketCap ? quote.marketCap.toString() : '',
      PERatio: quote.trailingPE ? quote.trailingPE.toString() : '',
      PEGRatio: quote.trailingPegRatio ? quote.trailingPegRatio.toString() : '',
      BookValue: quote.bookValue ? quote.bookValue.toString() : '',
      DividendPerShare: quote.trailingAnnualDividendRate ? quote.trailingAnnualDividendRate.toString() : '',
      DividendYield: quote.trailingAnnualDividendYield ? quote.trailingAnnualDividendYield.toString() : '',
      EPS: quote.trailingEps ? quote.trailingEps.toString() : '',
      RevenuePerShareTTM: '',
      ProfitMargin: quote.profitMargins ? (quote.profitMargins * 100).toString() : '',
      OperatingMarginTTM: quote.operatingMargins ? (quote.operatingMargins * 100).toString() : '',
      ReturnOnAssetsTTM: quote.returnOnAssets ? (quote.returnOnAssets * 100).toString() : '',
      ReturnOnEquityTTM: quote.returnOnEquity ? (quote.returnOnEquity * 100).toString() : '',
      RevenueTTM: quote.totalRevenue ? quote.totalRevenue.toString() : '',
      GrossProfitTTM: quote.grossProfits ? quote.grossProfits.toString() : '',
      DilutedEPSTTM: quote.trailingEps ? quote.trailingEps.toString() : '',
      QuarterlyEarningsGrowthYOY: quote.earningsQuarterlyGrowth ? (quote.earningsQuarterlyGrowth * 100).toString() : '',
      QuarterlyRevenueGrowthYOY: quote.revenueGrowth ? (quote.revenueGrowth * 100).toString() : '',
      AnalystTargetPrice: quote.targetMeanPrice ? quote.targetMeanPrice.toString() : '',
      TrailingPE: quote.trailingPE ? quote.trailingPE.toString() : '',
      ForwardPE: quote.forwardPE ? quote.forwardPE.toString() : '',
      PriceToSalesRatioTTM: quote.priceToSalesTrailing12Months ? quote.priceToSalesTrailing12Months.toString() : '',
      PriceToBookRatio: quote.priceToBook ? quote.priceToBook.toString() : '',
      EVToRevenue: '',
      EVToEBITDA: '',
      Beta: quote.beta ? quote.beta.toString() : '',
      '52WeekHigh': quote.fiftyTwoWeekHigh ? quote.fiftyTwoWeekHigh.toString() : '',
      '52WeekLow': quote.fiftyTwoWeekLow ? quote.fiftyTwoWeekLow.toString() : '',
      '50DayMovingAverage': quote.fiftyDayAverage ? quote.fiftyDayAverage.toString() : '',
      '200DayMovingAverage': quote.twoHundredDayAverage ? quote.twoHundredDayAverage.toString() : '',
      SharesOutstanding: quote.sharesOutstanding ? quote.sharesOutstanding.toString() : '',
    };

    // Enhance with Finnhub data if available
    if (finnhubData) {
      const { profile, metrics } = finnhubData;
      if (profile.marketCapitalization) transformed.MarketCapitalization = profile.marketCapitalization.toString();
      if (metrics.metric?.peNormalizedAnnual) transformed.PERatio = metrics.metric.peNormalizedAnnual.toString();
      if (metrics.metric?.revenueTTM) transformed.RevenueTTM = metrics.metric.revenueTTM.toString();
      if (metrics.metric?.netProfitMarginTTM) transformed.ProfitMargin = (metrics.metric.netProfitMarginTTM * 100).toString();
    }

    // Cache the result
    setCache(cacheKey, transformed);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching overview:', error);
    // Return null on error (graceful degradation)
    return NextResponse.json(null);
  }
}
