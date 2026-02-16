import { z } from 'zod';

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Zod schemas for FMP responses
const CompanyProfileSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  beta: z.number().optional(),
  volAvg: z.number().optional(),
  mktCap: z.number().optional(),
  lastDiv: z.number().optional(),
  range: z.string().optional(),
  changes: z.number().optional(),
  companyName: z.string(),
  currency: z.string(),
  cik: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  exchange: z.string(),
  exchangeShortName: z.string(),
  industry: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  ceo: z.string().optional(),
  sector: z.string().optional(),
  country: z.string(),
  fullTimeEmployees: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dcfDiff: z.number().optional(),
  dcf: z.number().optional(),
  image: z.string().optional(),
  ipoDate: z.string().optional(),
  defaultImage: z.boolean().optional(),
  isEtf: z.boolean().optional(),
  isActivelyTrading: z.boolean().optional(),
  isADR: z.boolean().optional(),
  isFund: z.boolean().optional(),
});

const KeyMetricsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  period: z.string(),
  revenuePerShare: z.number().optional(),
  netIncomePerShare: z.number().optional(),
  operatingCashFlowPerShare: z.number().optional(),
  freeCashFlowPerShare: z.number().optional(),
  cashPerShare: z.number().optional(),
  bookValuePerShare: z.number().optional(),
  tangibleBookValuePerShare: z.number().optional(),
  shareholdersEquityPerShare: z.number().optional(),
  interestDebtPerShare: z.number().optional(),
  marketCap: z.number().optional(),
  enterpriseValue: z.number().optional(),
  peRatio: z.number().optional(),
  priceToSalesRatio: z.number().optional(),
  pocfratio: z.number().optional(),
  pfcfRatio: z.number().optional(),
  pbRatio: z.number().optional(),
  ptbRatio: z.number().optional(),
  evToSales: z.number().optional(),
  enterpriseValueOverEBITDA: z.number().optional(),
  evToOperatingCashFlow: z.number().optional(),
  evToFreeCashFlow: z.number().optional(),
  earningsYield: z.number().optional(),
  freeCashFlowYield: z.number().optional(),
  debtToEquity: z.number().optional(),
  debtToAssets: z.number().optional(),
  netDebtToEBITDA: z.number().optional(),
  currentRatio: z.number().optional(),
  interestCoverage: z.number().optional(),
  incomeQuality: z.number().optional(),
  dividendYield: z.number().optional(),
  payoutRatio: z.number().optional(),
  salesGeneralAndAdministrativeToRevenue: z.number().optional(),
  researchAndDevelopmentToRevenue: z.number().optional(),
  intangiblesToTotalAssets: z.number().optional(),
  capexToOperatingCashFlow: z.number().optional(),
  capexToRevenue: z.number().optional(),
  capexToDepreciation: z.number().optional(),
  stockBasedCompensationToRevenue: z.number().optional(),
  grahamNumber: z.number().optional(),
  roic: z.number().optional(),
  returnOnTangibleAssets: z.number().optional(),
  grahamNetNet: z.number().optional(),
  workingCapital: z.number().optional(),
  tangibleAssetValue: z.number().optional(),
  netCurrentAssetValue: z.number().optional(),
  investedCapital: z.number().optional(),
  averageReceivables: z.number().optional(),
  averagePayables: z.number().optional(),
  averageInventory: z.number().optional(),
  daysSalesOutstanding: z.number().optional(),
  daysPayablesOutstanding: z.number().optional(),
  daysOfInventoryOnHand: z.number().optional(),
  receivablesTurnover: z.number().optional(),
  payablesTurnover: z.number().optional(),
  inventoryTurnover: z.number().optional(),
  roe: z.number().optional(),
  capexPerShare: z.number().optional(),
});

const IncomeStatementSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string(),
  cik: z.string(),
  fillingDate: z.string(),
  acceptedDate: z.string(),
  calendarYear: z.string(),
  period: z.string(),
  revenue: z.number(),
  costOfRevenue: z.number(),
  grossProfit: z.number(),
  grossProfitRatio: z.number(),
  researchAndDevelopmentExpenses: z.number(),
  generalAndAdministrativeExpenses: z.number(),
  sellingAndMarketingExpenses: z.number(),
  sellingGeneralAndAdministrativeExpenses: z.number(),
  otherExpenses: z.number(),
  operatingExpenses: z.number(),
  costAndExpenses: z.number(),
  interestIncome: z.number(),
  interestExpense: z.number(),
  depreciationAndAmortization: z.number(),
  ebitda: z.number(),
  ebitdaratio: z.number(),
  operatingIncome: z.number(),
  operatingIncomeRatio: z.number(),
  totalOtherIncomeExpensesNet: z.number(),
  incomeBeforeTax: z.number(),
  incomeBeforeTaxRatio: z.number(),
  incomeTaxExpense: z.number(),
  netIncome: z.number(),
  netIncomeRatio: z.number(),
  eps: z.number(),
  epsdiluted: z.number(),
  weightedAverageShsOut: z.number(),
  weightedAverageShsOutDil: z.number(),
  link: z.string().optional(),
  finalLink: z.string().optional(),
});

const BalanceSheetSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string(),
  cik: z.string(),
  fillingDate: z.string(),
  acceptedDate: z.string(),
  calendarYear: z.string(),
  period: z.string(),
  cashAndCashEquivalents: z.number(),
  shortTermInvestments: z.number(),
  cashAndShortTermInvestments: z.number(),
  netReceivables: z.number(),
  inventory: z.number(),
  otherCurrentAssets: z.number(),
  totalCurrentAssets: z.number(),
  propertyPlantEquipmentNet: z.number(),
  goodwill: z.number(),
  intangibleAssets: z.number(),
  goodwillAndIntangibleAssets: z.number(),
  longTermInvestments: z.number(),
  taxAssets: z.number(),
  otherNonCurrentAssets: z.number(),
  totalNonCurrentAssets: z.number(),
  otherAssets: z.number(),
  totalAssets: z.number(),
  accountPayables: z.number(),
  shortTermDebt: z.number(),
  taxPayables: z.number(),
  deferredRevenue: z.number(),
  otherCurrentLiabilities: z.number(),
  totalCurrentLiabilities: z.number(),
  longTermDebt: z.number(),
  deferredRevenueNonCurrent: z.number(),
  deferredTaxLiabilitiesNonCurrent: z.number(),
  otherNonCurrentLiabilities: z.number(),
  totalNonCurrentLiabilities: z.number(),
  otherLiabilities: z.number(),
  capitalLeaseObligations: z.number(),
  totalLiabilities: z.number(),
  preferredStock: z.number(),
  commonStock: z.number(),
  retainedEarnings: z.number(),
  accumulatedOtherComprehensiveIncomeLoss: z.number(),
  othertotalStockholdersEquity: z.number(),
  totalStockholdersEquity: z.number(),
  totalEquity: z.number(),
  totalLiabilitiesAndStockholdersEquity: z.number(),
  minorityInterest: z.number(),
  totalLiabilitiesAndTotalEquity: z.number(),
  totalInvestments: z.number(),
  totalDebt: z.number(),
  netDebt: z.number(),
  link: z.string().optional(),
  finalLink: z.string().optional(),
});

const CashFlowSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string(),
  cik: z.string(),
  fillingDate: z.string(),
  acceptedDate: z.string(),
  calendarYear: z.string(),
  period: z.string(),
  netIncome: z.number(),
  depreciationAndAmortization: z.number(),
  deferredIncomeTax: z.number(),
  stockBasedCompensation: z.number(),
  changeInWorkingCapital: z.number(),
  accountsReceivables: z.number(),
  inventory: z.number(),
  accountsPayables: z.number(),
  otherWorkingCapital: z.number(),
  otherNonCashItems: z.number(),
  netCashProvidedByOperatingActivities: z.number(),
  investmentsInPropertyPlantAndEquipment: z.number(),
  acquisitionsNet: z.number(),
  purchasesOfInvestments: z.number(),
  salesMaturitiesOfInvestments: z.number(),
  otherInvestingActivites: z.number(),
  netCashUsedForInvestingActivites: z.number(),
  debtRepayment: z.number(),
  commonStockIssued: z.number(),
  commonStockRepurchased: z.number(),
  dividendsPaid: z.number(),
  otherFinancingActivites: z.number(),
  netCashUsedProvidedByFinancingActivities: z.number(),
  effectOfForexChangesOnCash: z.number(),
  netChangeInCash: z.number(),
  cashAtEndOfPeriod: z.number(),
  cashAtBeginningOfPeriod: z.number(),
  operatingCashFlow: z.number(),
  capitalExpenditure: z.number(),
  freeCashFlow: z.number(),
  link: z.string().optional(),
  finalLink: z.string().optional(),
});

const EarningsSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  eps: z.number().nullable(),
  epsEstimated: z.number().nullable(),
  time: z.string(),
  revenue: z.number().nullable(),
  revenueEstimated: z.number().nullable(),
});

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

export async function getCompanyProfile(
  symbol: string
): Promise<{ data: z.infer<typeof CompanyProfileSchema> | null; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return {
      data: null,
      error: { error: 'FMP API key not configured', retryable: false },
    };
  }

  try {
    const url = `${BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return {
        data: null,
        error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 },
      };
    }

    const json = await response.json();
    if (Array.isArray(json) && json.length > 0) {
      const validated = CompanyProfileSchema.safeParse(json[0]);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: null };
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

export async function getKeyMetrics(
  symbol: string
): Promise<{ data: z.infer<typeof KeyMetricsSchema>[]; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return { data: [], error: { error: 'FMP API key not configured', retryable: false } };
  }

  try {
    const url = `${BASE_URL}/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { data: [], error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 } };
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      const validated = z.array(KeyMetricsSchema).safeParse(json);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getIncomeStatements(
  symbol: string,
  limit = 5
): Promise<{ data: z.infer<typeof IncomeStatementSchema>[]; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return { data: [], error: { error: 'FMP API key not configured', retryable: false } };
  }

  try {
    const url = `${BASE_URL}/income-statement/${symbol}?limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { data: [], error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 } };
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      const validated = z.array(IncomeStatementSchema).safeParse(json);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getBalanceSheets(
  symbol: string,
  limit = 5
): Promise<{ data: z.infer<typeof BalanceSheetSchema>[]; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return { data: [], error: { error: 'FMP API key not configured', retryable: false } };
  }

  try {
    const url = `${BASE_URL}/balance-sheet-statement/${symbol}?limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { data: [], error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 } };
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      const validated = z.array(BalanceSheetSchema).safeParse(json);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getCashFlowStatements(
  symbol: string,
  limit = 5
): Promise<{ data: z.infer<typeof CashFlowSchema>[]; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return { data: [], error: { error: 'FMP API key not configured', retryable: false } };
  }

  try {
    const url = `${BASE_URL}/cash-flow-statement/${symbol}?limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { data: [], error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 } };
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      const validated = z.array(CashFlowSchema).safeParse(json);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}

export async function getEarningsHistory(
  symbol: string,
  limit = 10
): Promise<{ data: z.infer<typeof EarningsSchema>[]; error?: ProviderError }> {
  if (!FMP_API_KEY) {
    return { data: [], error: { error: 'FMP API key not configured', retryable: false } };
  }

  try {
    const url = `${BASE_URL}/historical/earning_calendar/${symbol}?limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { data: [], error: { error: `HTTP ${response.status}`, retryable: response.status >= 500 } };
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      const validated = z.array(EarningsSchema).safeParse(json);
      if (validated.success) {
        return { data: validated.data };
      }
    }

    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
    };
  }
}
