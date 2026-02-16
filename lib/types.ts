import { z } from 'zod';

// Alpha Vantage API Response Schemas
// Using TIME_SERIES_DAILY (free tier) - note: no adjusted close or dividend/split data
export const TimeSeriesDailySchema = z.object({
  'Meta Data': z.object({
    '1. Information': z.string(),
    '2. Symbol': z.string(),
    '3. Last Refreshed': z.string(),
    '4. Output Size': z.string(),
    '5. Time Zone': z.string(),
  }),
  'Time Series (Daily)': z.record(z.object({
    '1. open': z.string(),
    '2. high': z.string(),
    '3. low': z.string(),
    '4. close': z.string(),
    '5. volume': z.string(),
  })),
});

export const OverviewSchema = z.object({
  Symbol: z.string(),
  AssetType: z.string().optional(),
  Name: z.string().optional(),
  Description: z.string().optional(),
  CIK: z.string().optional(),
  Exchange: z.string().optional(),
  Currency: z.string().optional(),
  Country: z.string().optional(),
  Sector: z.string().optional(),
  Industry: z.string().optional(),
  Address: z.string().optional(),
  FullTimeEmployees: z.string().optional(),
  FiscalYearEnd: z.string().optional(),
  LatestQuarter: z.string().optional(),
  MarketCapitalization: z.string().optional(),
  EBITDA: z.string().optional(),
  PERatio: z.string().optional(),
  PEGRatio: z.string().optional(),
  BookValue: z.string().optional(),
  DividendPerShare: z.string().optional(),
  DividendYield: z.string().optional(),
  EPS: z.string().optional(),
  RevenuePerShareTTM: z.string().optional(),
  ProfitMargin: z.string().optional(),
  OperatingMarginTTM: z.string().optional(),
  ReturnOnAssetsTTM: z.string().optional(),
  ReturnOnEquityTTM: z.string().optional(),
  RevenueTTM: z.string().optional(),
  GrossProfitTTM: z.string().optional(),
  DilutedEPSTTM: z.string().optional(),
  QuarterlyEarningsGrowthYOY: z.string().optional(),
  QuarterlyRevenueGrowthYOY: z.string().optional(),
  AnalystTargetPrice: z.string().optional(),
  TrailingPE: z.string().optional(),
  ForwardPE: z.string().optional(),
  PriceToSalesRatioTTM: z.string().optional(),
  PriceToBookRatio: z.string().optional(),
  EVToRevenue: z.string().optional(),
  EVToEBITDA: z.string().optional(),
  Beta: z.string().optional(),
  '52WeekHigh': z.string().optional(),
  '52WeekLow': z.string().optional(),
  '50DayMovingAverage': z.string().optional(),
  '200DayMovingAverage': z.string().optional(),
  SharesOutstanding: z.string().optional(),
  DividendDate: z.string().optional(),
  ExDividendDate: z.string().optional(),
});

export const NewsSentimentSchema = z.object({
  feed: z.array(z.object({
    title: z.string(),
    url: z.string(),
    time_published: z.string(),
    authors: z.array(z.string()).optional(),
    summary: z.string().optional(),
    banner_image: z.string().optional(),
    source: z.string(),
    category_within_source: z.string().optional(),
    source_domain: z.string().optional(),
    topics: z.array(z.object({
      topic: z.string(),
      relevance_score: z.string(),
    })).optional(),
    overall_sentiment_score: z.number().optional(),
    overall_sentiment_label: z.string().optional(),
    ticker_sentiment: z.array(z.object({
      ticker: z.string(),
      relevance_score: z.string(),
      ticker_sentiment_score: z.string(),
      ticker_sentiment_label: z.string(),
    })).optional(),
  })).optional(),
});

export const ErrorResponseSchema = z.object({
  'Error Message': z.string().optional(),
  'Note': z.string().optional(),
  'Information': z.string().optional(),
});

// Internal Types
export type TimeSeriesData = z.infer<typeof TimeSeriesDailySchema>;
export type OverviewData = z.infer<typeof OverviewSchema>;
export type NewsSentimentData = z.infer<typeof NewsSentimentSchema>;

export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  sma20: number;
  sma50: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  volatility: number;
}

export interface KeyMetrics {
  lastClose: number;
  return20d: number;
  return90d: number;
  volatility: number;
  high90d: number;
  low90d: number;
}

export interface Recommendation {
  action: 'Buy' | 'Watch' | 'Avoid';
  confidence: number;
  reasons: string[];
  score: number;
}

export interface ScenarioOutlook {
  oneMonth: {
    optimistic: number;
    base: number;
    pessimistic: number;
  };
  threeMonth: {
    optimistic: number;
    base: number;
    pessimistic: number;
  };
}

// SEC Filing Types
export interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  acceptanceDateTime: string;
  act: string;
  form: string;
  fileNumber: string;
  filmNumber: string;
  items: string;
  size: number;
  isXBRL: number;
  isInlineXBRL: number;
  primaryDocument: string;
  primaryDocDescription: string;
}

export interface SECFilingsResponse {
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
    files: Array<{
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }>;
  };
  name: string;
  cik: string;
  ticker: string;
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  addresses: {
    mailing: {
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      phone: string;
    };
    business: {
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      phone: string;
    };
  };
  flags: string;
  formerNames: Array<{
    name: string;
    from: string;
    to: string;
  }>;
  filings: {
    recent: SECFiling[];
    files: Array<{
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }>;
  };
}

// Earnings Types
export interface EarningsData {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  time: string;
  revenue: number | null;
  revenueEstimated: number | null;
}

export interface EarningsResponse {
  symbol: string;
  historical: EarningsData[];
}

// Financial Statements Types
export interface IncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
}

// Enhanced Analysis Types
export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface RiskFactors {
  level: 'Low' | 'Medium' | 'High';
  factors: string[];
}

export interface DetailedRecommendation extends Recommendation {
  pros: string[];
  cons: string[];
  riskFactors: RiskFactors;
  bullishIndicators: string[];
  bearishIndicators: string[];
  priceTarget?: {
    optimistic: number;
    base: number;
    pessimistic: number;
    timeframe: string;
  };
}

export interface AnalystReport {
  symbol: string;
  companyName: string;
  currentPrice: number;
  targetPrice: number | null;
  analystCount: number;
  recommendations: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  recommendationKey: string;
  institutionalAnalysis: {
    note: string;
    sources: Array<{
      name: string;
      available: boolean;
      note: string;
    }>;
  };
  availableData: {
    priceTarget: number | null;
    priceTargetHigh: number | null;
    priceTargetLow: number | null;
    earningsEstimate: number | null;
    revenueEstimate: number | null;
  };
}

export interface StockAnalysis {
  symbol: string;
  prices: PricePoint[];
  metrics: KeyMetrics;
  indicators: IndicatorValues;
  fundamentals: OverviewData | null;
  newsSentiment: NewsSentimentData | null;
  recommendation: DetailedRecommendation;
  scenarios: ScenarioOutlook;
  secFilings: SECFilingsResponse | null;
  earnings: EarningsData[] | null;
  incomeStatements: IncomeStatement[] | null;
  analystReports: AnalystReport | null;
}
