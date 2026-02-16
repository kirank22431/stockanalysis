import { z } from 'zod';

// SEC EDGAR API - Free, no API key required
const SEC_BASE_URL = 'https://data.sec.gov';

// Ticker to CIK mapping (we'll fetch this dynamically)
const TICKER_CIK_MAP_URL = 'https://www.sec.gov/files/company_tickers.json';

const SECFilingSchema = z.object({
  accessionNumber: z.string(),
  filingDate: z.string(),
  reportDate: z.string(),
  acceptanceDateTime: z.string(),
  act: z.string(),
  form: z.string(),
  fileNumber: z.string(),
  filmNumber: z.string(),
  items: z.string(),
  size: z.number(),
  isXBRL: z.number(),
  isInlineXBRL: z.number(),
  primaryDocument: z.string(),
  primaryDocDescription: z.string(),
});

// Make SubmissionsSchema lenient - SEC API can have varying structures
const SubmissionsSchema = z.object({
  cik: z.string(),
  entityType: z.string().optional(),
  sic: z.string().optional(),
  sicDescription: z.string().optional(),
  ownerOrg: z.string().optional(), // Added field seen in responses
  insiderTransactionForOwnerExists: z.number().optional(),
  insiderTransactionForIssuerExists: z.number().optional(),
  name: z.string(),
  tickers: z.array(z.string()).optional(),
  exchanges: z.array(z.string()).optional(),
  ein: z.string().optional(),
  lei: z.string().optional(), // Added field seen in responses
  description: z.string().optional(),
  website: z.string().optional(),
  investorWebsite: z.string().optional(),
  category: z.string().optional(),
  fiscalYearEnd: z.string().optional(),
  stateOfIncorporation: z.string().optional(),
  stateOfIncorporationDescription: z.string().optional(),
  addresses: z.object({
    mailing: z.object({
      street1: z.string(),
      street2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      phone: z.string().optional(),
    }).optional(),
    business: z.object({
      street1: z.string(),
      street2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      phone: z.string().optional(),
    }).optional(),
  }).optional(),
  phone: z.string().optional(),
  flags: z.string().optional(),
  formerNames: z.array(z.object({
    name: z.string(),
    from: z.string(),
    to: z.string(),
  })).optional(),
  filings: z.object({
    recent: z.object({
      accessionNumber: z.array(z.string()),
      filingDate: z.array(z.string()),
      reportDate: z.array(z.string()).optional(),
      acceptanceDateTime: z.array(z.string()).optional(),
      act: z.array(z.string()).optional(),
      form: z.array(z.string()),
      fileNumber: z.array(z.string()).optional(),
      filmNumber: z.array(z.string()).optional(),
      items: z.array(z.string()).optional(),
      size: z.array(z.number()).optional(),
      isXBRL: z.array(z.number()).optional(),
      isInlineXBRL: z.array(z.number()).optional(),
      primaryDocument: z.array(z.string()).optional(),
      primaryDocDescription: z.array(z.string()).optional(),
    }),
    files: z.array(z.object({
      name: z.string(),
      filingCount: z.number(),
      filingFrom: z.string(),
      filingTo: z.string(),
    })).optional(),
  }),
}).passthrough(); // Allow extra fields

// Make CompanyFactsSchema very lenient since SEC XBRL data structure can vary
const CompanyFactsSchema = z.object({
  cik: z.string().optional(),
  entityType: z.string().optional(),
  sic: z.string().optional(),
  sicDescription: z.string().optional(),
  insiderTransactionForOwnerExists: z.number().optional(),
  insiderTransactionForIssuerExists: z.number().optional(),
  name: z.string().optional(),
  tickers: z.array(z.string()).optional(),
  exchanges: z.array(z.string()).optional(),
  ein: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  investorWebsite: z.string().optional(),
  category: z.string().optional(),
  fiscalYearEnd: z.string().optional(),
  stateOfIncorporation: z.string().optional(),
  stateOfIncorporationDescription: z.string().optional(),
  facts: z.record(z.any()).optional(), // XBRL facts can be complex, we'll parse selectively
}).passthrough(); // Allow extra fields

interface ProviderError {
  error: string;
  retryable: boolean;
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
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        // Disable Next.js caching for large SEC responses
        cache: 'no-store',
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

export async function getCIKFromTicker(ticker: string): Promise<{ cik: string | null; error?: ProviderError }> {
  try {
    const response = await fetchWithRetry(TICKER_CIK_MAP_URL);

    if (!response.ok) {
      return {
        cik: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const data = await response.json();
    const tickerUpper = ticker.toUpperCase();

    // Find ticker in the mapping
    for (const entry of Object.values(data) as any[]) {
      if (entry.ticker === tickerUpper) {
        return { cik: entry.cik_str.toString().padStart(10, '0') };
      }
    }

    return { cik: null };
  } catch (error) {
    return {
      cik: null,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getSubmissions(
  cik: string
): Promise<{ data: z.infer<typeof SubmissionsSchema> | null; error?: ProviderError }> {
  try {
    const paddedCIK = cik.padStart(10, '0');
    const url = `${SEC_BASE_URL}/submissions/CIK${paddedCIK}.json`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`SEC submissions HTTP ${response.status} for CIK ${cik}:`, errorText);
      return {
        data: null,
        error: { 
          error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`, 
          retryable: response.status >= 500 || response.status === 429 
        },
      };
    }

    const json = await response.json();
    const validated = SubmissionsSchema.safeParse(json);

    if (!validated.success) {
      // Log error safely - only log the issues array
      try {
        const issues = validated.error?.issues;
        if (issues && Array.isArray(issues)) {
          console.warn('SEC submissions validation warning:', issues.length, 'issues (continuing anyway)');
        }
      } catch (e) {
        // Ignore logging errors
      }
      // Even if validation fails, try to extract filings from the raw data
      // This is more lenient - we'll handle missing fields in normalizeFilings
      if (json && json.filings && json.filings.recent) {
        console.log('Using raw SEC data despite validation warnings');
        return { data: json as any };
      }
      return { 
        data: null,
        error: { error: 'Invalid SEC response format - missing filings data', retryable: false }
      };
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

export async function getCompanyFacts(
  cik: string
): Promise<{ data: z.infer<typeof CompanyFactsSchema> | null; error?: ProviderError }> {
  try {
    const paddedCIK = cik.padStart(10, '0');
    const url = `${SEC_BASE_URL}/api/xbrl/companyfacts/CIK${paddedCIK}.json`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      // If 404, company facts might not be available - that's okay
      if (response.status === 404) {
        return { data: null };
      }
      return {
        data: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const json = await response.json();
    
    // Use passthrough to allow any structure, we'll handle it defensively
    const validated = CompanyFactsSchema.safeParse(json);

    if (!validated.success) {
      // Log error safely - only log the issues array, not the full error object
      try {
        const issues = validated.error?.issues;
        if (issues && Array.isArray(issues)) {
          console.warn('Company facts validation warning (non-critical):', issues.length, 'issues found');
        }
      } catch (e) {
        // Ignore logging errors - this is non-critical
      }
      // Return the raw data anyway - we'll handle it defensively in extractKeyFacts
      return { data: json as any };
    }

    return { data: validated.data };
  } catch (error) {
    console.error('Error fetching company facts:', error);
    return {
      data: null,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export interface NormalizedFiling {
  type: string;
  date: string;
  reportDate: string | null;
  accessionNumber: string;
  link: string;
  description: string;
}

export function normalizeFilings(
  submissions: any // Accept any to handle lenient validation
): NormalizedFiling[] {
  const filings: NormalizedFiling[] = [];
  
  // Defensive checks
  if (!submissions || !submissions.filings || !submissions.filings.recent) {
    return [];
  }
  
  const recent = submissions.filings.recent;
  const cik = (submissions.cik || '').toString().padStart(10, '0');
  
  // Ensure arrays exist and have the same length
  const accessionNumbers = recent.accessionNumber || [];
  const forms = recent.form || [];
  const filingDates = recent.filingDate || [];
  const reportDates = recent.reportDate || [];
  const descriptions = recent.primaryDocDescription || [];

  const maxLength = Math.min(
    accessionNumbers.length,
    forms.length,
    filingDates.length
  );

  for (let i = 0; i < maxLength; i++) {
    const form = forms[i];
    // Filter for key investment-relevant filings
    if (form && ['10-K', '10-Q', '8-K', 'DEF 14A', 'S-1', 'S-3'].includes(form)) {
      const accession = accessionNumbers[i];
      const filingDate = filingDates[i];
      
      if (accession && filingDate) {
        filings.push({
          type: form,
          date: filingDate,
          reportDate: reportDates[i] || null,
          accessionNumber: accession,
          link: `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accession.replace(/-/g, '')}&xbrl_type=v`,
          description: descriptions[i] || form,
        });
      }
    }
  }

  return filings.sort((a, b) => b.date.localeCompare(a.date));
}

export function extractKeyFacts(companyFacts: any): {
  revenue: number | null;
  netIncome: number | null;
  sharesOutstanding: number | null;
} {
  // Defensive check - handle any structure
  if (!companyFacts || typeof companyFacts !== 'object') {
    return { revenue: null, netIncome: null, sharesOutstanding: null };
  }

  const facts = companyFacts.facts;
  if (!facts || typeof facts !== 'object') {
    return { revenue: null, netIncome: null, sharesOutstanding: null };
  }

  // Try to extract from us-gaap namespace
  const usgaap = facts['us-gaap'];
  if (!usgaap || typeof usgaap !== 'object') {
    return { revenue: null, netIncome: null, sharesOutstanding: null };
  }

  // Extract revenue (Revenues)
  let revenue: number | null = null;
  try {
    const revenuesData = usgaap['Revenues'];
    if (revenuesData && revenuesData.units && revenuesData.units['USD']) {
      const revenues = revenuesData.units['USD'];
      if (Array.isArray(revenues) && revenues.length > 0) {
        const firstItem = revenues[0];
        if (firstItem && typeof firstItem === 'object') {
          revenue = (firstItem as any).val ?? (firstItem as any).value ?? null;
          if (typeof revenue !== 'number') revenue = null;
        }
      }
    }
  } catch (e) {
    console.error('Error extracting revenue:', e);
    revenue = null;
  }

  // Extract net income (NetIncomeLoss)
  let netIncome: number | null = null;
  try {
    const netIncomeData = usgaap['NetIncomeLoss'];
    if (netIncomeData && netIncomeData.units && netIncomeData.units['USD']) {
      const netIncomeArray = netIncomeData.units['USD'];
      if (Array.isArray(netIncomeArray) && netIncomeArray.length > 0) {
        const firstItem = netIncomeArray[0];
        if (firstItem && typeof firstItem === 'object') {
          netIncome = (firstItem as any).val ?? (firstItem as any).value ?? null;
          if (typeof netIncome !== 'number') netIncome = null;
        }
      }
    }
  } catch (e) {
    console.error('Error extracting net income:', e);
    netIncome = null;
  }

  // Extract shares outstanding (EntityCommonStockSharesOutstanding)
  let sharesOutstanding: number | null = null;
  try {
    const sharesData = usgaap['EntityCommonStockSharesOutstanding'];
    if (sharesData && sharesData.units && sharesData.units['shares']) {
      const shares = sharesData.units['shares'];
      if (Array.isArray(shares) && shares.length > 0) {
        const firstItem = shares[0];
        if (firstItem && typeof firstItem === 'object') {
          sharesOutstanding = (firstItem as any).val ?? (firstItem as any).value ?? null;
          if (typeof sharesOutstanding !== 'number') sharesOutstanding = null;
        }
      }
    }
  } catch (e) {
    console.error('Error extracting shares outstanding:', e);
    sharesOutstanding = null;
  }

  return { revenue, netIncome, sharesOutstanding };
}
