import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import {
  getCIKFromTicker,
  getSubmissions,
  normalizeFilings,
  getCompanyFacts,
  extractKeyFacts,
} from '@/lib/providers/sec';
import { getCompanyProfile } from '@/lib/providers/fmp';
import { analyzeFilings } from '@/lib/analysis/secAnalysis';

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
  const cacheKey = `filings:${normalizedSymbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Try to get CIK from FMP profile first, then fallback to SEC ticker mapping
    let cik: string | null = null;
    let cikError: string | null = null;

    // Try FMP first (if available)
    const profileResult = await getCompanyProfile(normalizedSymbol);
    if (profileResult.data?.cik) {
      cik = profileResult.data.cik;
    } else if (profileResult.error) {
      console.log('FMP profile lookup failed, trying SEC ticker mapping:', profileResult.error);
    }

    // Fallback to SEC ticker mapping
    if (!cik) {
      const cikResult = await getCIKFromTicker(normalizedSymbol);
      if (cikResult.cik) {
        cik = cikResult.cik;
      } else if (cikResult.error) {
        cikError = cikResult.error.error;
        console.error('SEC ticker mapping error:', cikResult.error);
      }
    }

    if (!cik) {
      return NextResponse.json(
        { 
          error: `Could not find CIK for symbol ${normalizedSymbol}. ${cikError ? `Error: ${cikError}` : 'The symbol may not be registered with the SEC.'}` 
        },
        { status: 404 }
      );
    }

    console.log(`Found CIK for ${normalizedSymbol}: ${cik}`);

    const [submissionsResult, factsResult] = await Promise.all([
      getSubmissions(cik),
      getCompanyFacts(cik),
    ]);

    if (!submissionsResult.data) {
      const errorMsg = submissionsResult.error?.error || 'Unknown error';
      console.error('SEC submissions error:', errorMsg);
      return NextResponse.json(
        { 
          error: `Failed to fetch SEC filings: ${errorMsg}. The SEC API may be temporarily unavailable or the CIK may be invalid.` 
        },
        { status: 500 }
      );
    }

    const filings = normalizeFilings(submissionsResult.data);
    let keyFacts: { revenue?: number | null; netIncome?: number | null; sharesOutstanding?: number | null } | null = null;
    
    // Extract key facts if available, but don't fail if it errors
    if (factsResult.data) {
      try {
        keyFacts = extractKeyFacts(factsResult.data);
      } catch (error: any) {
        console.error('Error extracting key facts:', error);
        console.error('Error details:', error?.message, error?.stack);
        // Continue without key facts - this is not critical
        keyFacts = null;
      }
    }

    // Analyze filings for investment briefing
    const filingAnalysis = analyzeFilings(filings, keyFacts || undefined);

    const result = {
      symbol: normalizedSymbol,
      companyName: submissionsResult.data.name,
      cik,
      filings: filings.slice(0, 20), // Latest 20 filings
      keyFacts,
      analysis: filingAnalysis,
      generatedAt: new Date().toISOString(),
    };

    // Cache for 2 hours
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching filings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
