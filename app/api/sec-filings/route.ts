import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

// SEC EDGAR API is free and doesn't require an API key
// Documentation: https://www.sec.gov/edgar/sec-api-documentation

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const cik = searchParams.get('cik');

  if (!symbol && !cik) {
    return NextResponse.json(
      { error: 'Symbol or CIK parameter is required' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `sec:${symbol || cik}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    let cikToUse = cik;

    // If we have symbol but not CIK, we need to get CIK first
    if (symbol && !cik) {
      // Try to get CIK from company tickers JSON
      const tickersUrl = 'https://www.sec.gov/files/company_tickers.json';
      const tickersResponse = await fetch(tickersUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Educational Tool)',
          'Accept': 'application/json',
        },
      });

      if (tickersResponse.ok) {
        const tickersData = await tickersResponse.json();
        const tickerEntry = Object.values(tickersData).find(
          (entry: any) => entry.ticker === symbol.toUpperCase()
        ) as any;

        if (tickerEntry) {
          cikToUse = tickerEntry.cik_str.toString().padStart(10, '0');
        } else {
          return NextResponse.json(
            { error: 'Symbol not found in SEC database' },
            { status: 404 }
          );
        }
      }
    }

    if (!cikToUse) {
      return NextResponse.json(
        { error: 'Could not determine CIK' },
        { status: 400 }
      );
    }

    // Get company filings
    const filingsUrl = `https://data.sec.gov/submissions/CIK${cikToUse}.json`;
    const filingsResponse = await fetch(filingsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Educational Tool)',
        'Accept': 'application/json',
      },
    });

    if (!filingsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch SEC filings' },
        { status: filingsResponse.status }
      );
    }

    const filingsData = await filingsResponse.json();

    // Transform SEC data from array format to object format for easier use
    if (filingsData.filings && filingsData.filings.recent) {
      const recent = filingsData.filings.recent;
      const transformedFilings = [];
      
      // SEC returns data as parallel arrays, convert to objects
      if (recent.accessionNumber && recent.accessionNumber.length > 0) {
        for (let i = 0; i < recent.accessionNumber.length; i++) {
          transformedFilings.push({
            accessionNumber: recent.accessionNumber[i],
            filingDate: recent.filingDate[i],
            reportDate: recent.reportDate[i],
            acceptanceDateTime: recent.acceptanceDateTime[i],
            act: recent.act[i],
            form: recent.form[i],
            fileNumber: recent.fileNumber[i],
            filmNumber: recent.filmNumber[i],
            items: recent.items[i],
            size: recent.size[i],
            isXBRL: recent.isXBRL[i],
            isInlineXBRL: recent.isInlineXBRL[i],
            primaryDocument: recent.primaryDocument[i],
            primaryDocDescription: recent.primaryDocDescription[i],
          });
        }
      }
      
      filingsData.filings.recent = transformedFilings;
    }

    // Cache for 1 hour (SEC data doesn't change frequently)
    setCache(cacheKey, filingsData);

    return NextResponse.json(filingsData);
  } catch (error) {
    console.error('Error fetching SEC filings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
