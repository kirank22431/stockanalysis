import type { PricePoint } from '@/lib/types';
import { calculateIndicators, calculateKeyMetrics } from '@/lib/analyze';
import { analyzeValuation, type ValuationAnalysis } from './valuation';

export interface ReportSummary {
  label: 'Bullish' | 'Neutral' | 'Bearish';
  recommendation: 'Buy' | 'Hold' | 'Sell';
  confidence: number; // 0-100
}

export interface ReportSection {
  company?: CompanySection;
  valuation?: ValuationSection;
  valuationAnalysis?: ValuationAnalysis;
  financialHealth?: FinancialHealthSection;
  profitability?: ProfitabilitySection;
  growth?: GrowthSection;
  performance?: PerformanceSection;
  technicals?: TechnicalsSection;
  earnings?: EarningsSection;
  filings?: FilingsSection;
  risks?: RisksSection;
  crypto?: CryptoSection;
}

export interface CompanySection {
  name: string;
  symbol: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  employees?: string;
  exchange?: string;
  marketCap?: number;
  enterpriseValue?: number;
  freshAt: string;
}

export interface ValuationSection {
  peRatio?: number;
  priceToSales?: number;
  priceToBook?: number;
  evToEBITDA?: number;
  evToRevenue?: number;
  marketCap?: number;
  enterpriseValue?: number;
  freshAt: string;
}

export interface FinancialHealthSection {
  currentRatio?: number;
  debtToEquity?: number;
  debtToAssets?: number;
  interestCoverage?: number;
  workingCapital?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
  freshAt: string;
}

export interface ProfitabilitySection {
  profitMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
  roa?: number;
  roic?: number;
  freshAt: string;
}

export interface GrowthSection {
  revenueGrowthYOY?: number;
  revenueGrowthQOQ?: number;
  earningsGrowthYOY?: number;
  earningsGrowthQOQ?: number;
  epsGrowth?: number;
  freshAt: string;
}

export interface PerformanceSection {
  price52wHigh?: number;
  price52wLow?: number;
  currentPrice: number;
  priceChange1d?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  priceChange1y?: number;
  volatility?: number;
  freshAt: string;
}

export interface TechnicalsSection {
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  priceVsSMA50?: number; // percentage
  priceVsSMA200?: number; // percentage
  freshAt: string;
}

export interface EarningsSection {
  history: Array<{
    date: string;
    eps: number | null;
    epsEstimated: number | null;
    revenue: number | null;
    revenueEstimated: number | null;
    beat?: boolean;
  }>;
  nextEarningsDate?: string;
  freshAt: string;
}

export interface FilingsSection {
  recent: Array<{
    type: string;
    date: string;
    reportDate: string | null;
    link: string;
    description: string;
  }>;
  keyFacts?: {
    revenue?: number;
    netIncome?: number;
    sharesOutstanding?: number;
  };
  freshAt: string;
}

export interface RisksSection {
  factors: string[];
  level: 'Low' | 'Medium' | 'High';
}

export interface CryptoSection {
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number | null;
  priceChange7d?: number;
  priceChange30d?: number;
  volatility?: number;
  ath?: number;
  athChange?: number;
  atl?: number;
  atlChange?: number;
  freshAt: string;
}

export interface Report {
  symbol: string;
  assetType: 'stock' | 'crypto';
  generatedAt: string;
  summary: ReportSummary;
  why: string[];
  sections: ReportSection;
  sources: Record<string, string[]>;
}

// Scoring functions
function calculateValuationScore(
  peRatio?: number,
  priceToSales?: number,
  priceToBook?: number
): number {
  let score = 50; // Base score

  if (peRatio !== undefined && peRatio > 0) {
    if (peRatio < 15) score += 20;
    else if (peRatio < 25) score += 10;
    else if (peRatio < 40) score += 0;
    else if (peRatio < 60) score -= 10;
    else score -= 20;
  }

  if (priceToSales !== undefined && priceToSales > 0) {
    if (priceToSales < 2) score += 10;
    else if (priceToSales < 5) score += 5;
    else if (priceToSales > 10) score -= 10;
  }

  if (priceToBook !== undefined && priceToBook > 0) {
    if (priceToBook < 2) score += 10;
    else if (priceToBook > 5) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateGrowthScore(
  revenueGrowthYOY?: number,
  earningsGrowthYOY?: number,
  epsGrowth?: number
): number {
  let score = 50;

  if (revenueGrowthYOY !== undefined) {
    if (revenueGrowthYOY > 20) score += 20;
    else if (revenueGrowthYOY > 10) score += 10;
    else if (revenueGrowthYOY > 0) score += 5;
    else if (revenueGrowthYOY < -10) score -= 20;
    else if (revenueGrowthYOY < 0) score -= 10;
  }

  if (earningsGrowthYOY !== undefined) {
    if (earningsGrowthYOY > 25) score += 15;
    else if (earningsGrowthYOY > 10) score += 10;
    else if (earningsGrowthYOY < -20) score -= 15;
    else if (earningsGrowthYOY < 0) score -= 10;
  }

  if (epsGrowth !== undefined) {
    if (epsGrowth > 20) score += 10;
    else if (epsGrowth < -20) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateProfitabilityScore(
  profitMargin?: number,
  operatingMargin?: number,
  roe?: number,
  roa?: number
): number {
  let score = 50;

  if (profitMargin !== undefined) {
    if (profitMargin > 0.2) score += 20;
    else if (profitMargin > 0.1) score += 10;
    else if (profitMargin > 0) score += 5;
    else if (profitMargin < 0) score -= 20;
  }

  if (operatingMargin !== undefined) {
    if (operatingMargin > 0.15) score += 10;
    else if (operatingMargin < 0) score -= 15;
  }

  if (roe !== undefined) {
    if (roe > 0.2) score += 10;
    else if (roe < 0) score -= 10;
  }

  if (roa !== undefined) {
    if (roa > 0.1) score += 5;
    else if (roa < 0) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateHealthScore(
  currentRatio?: number,
  debtToEquity?: number,
  operatingCashFlow?: number,
  freeCashFlow?: number
): number {
  let score = 50;

  if (currentRatio !== undefined) {
    if (currentRatio > 2) score += 15;
    else if (currentRatio > 1.5) score += 10;
    else if (currentRatio > 1) score += 5;
    else if (currentRatio < 1) score -= 15;
  }

  if (debtToEquity !== undefined) {
    if (debtToEquity < 0.5) score += 10;
    else if (debtToEquity < 1) score += 5;
    else if (debtToEquity > 2) score -= 10;
    else if (debtToEquity > 3) score -= 20;
  }

  if (operatingCashFlow !== undefined && operatingCashFlow > 0) {
    score += 10;
  } else if (operatingCashFlow !== undefined && operatingCashFlow < 0) {
    score -= 15;
  }

  if (freeCashFlow !== undefined && freeCashFlow > 0) {
    score += 10;
  } else if (freeCashFlow !== undefined && freeCashFlow < 0) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateMomentumScore(
  prices: PricePoint[],
  indicators: ReturnType<typeof calculateIndicators>
): number {
  if (prices.length === 0) return 50;

  let score = 50;
  const lastPrice = prices[prices.length - 1].close;
  const closePrices = prices.map(p => p.close);

  // Calculate SMA200 if we have enough data
  let sma200: number | undefined;
  if (closePrices.length >= 200) {
    const sma200Values = closePrices.slice(-200);
    sma200 = sma200Values.reduce((a, b) => a + b, 0) / sma200Values.length;
  }

  // Price vs moving averages
  if (indicators.sma50 && lastPrice > indicators.sma50) {
    score += 10;
  } else if (indicators.sma50 && lastPrice < indicators.sma50) {
    score -= 5;
  }

  if (sma200 && lastPrice > sma200) {
    score += 10;
  } else if (sma200 && lastPrice < sma200) {
    score -= 10;
  }

  // RSI
  if (indicators.rsi >= 50 && indicators.rsi <= 70) {
    score += 10;
  } else if (indicators.rsi > 75) {
    score -= 10; // Overbought
  } else if (indicators.rsi < 30) {
    score -= 5; // Oversold but could be buying opportunity
  }

  // MACD
  if (indicators.macd.histogram > 0) {
    score += 5;
  } else {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateRiskPenalty(
  volatility?: number,
  drawdown?: number,
  revenueDeclining?: boolean,
  negativeFCF?: boolean
): number {
  let penalty = 0;

  if (volatility !== undefined) {
    if (volatility > 50) penalty += 15;
    else if (volatility > 30) penalty += 10;
    else if (volatility > 20) penalty += 5;
  }

  if (drawdown !== undefined) {
    if (drawdown > 0.3) penalty += 15;
    else if (drawdown > 0.2) penalty += 10;
    else if (drawdown > 0.15) penalty += 5;
  }

  if (revenueDeclining) penalty += 10;
  if (negativeFCF) penalty += 10;

  return penalty;
}

export function buildStockReport(input: {
  symbol: string;
  prices: PricePoint[];
  companyProfile?: any;
  keyMetrics?: any[];
  incomeStatements?: any[];
  balanceSheets?: any[];
  cashFlows?: any[];
  earnings?: any[];
  filings?: any[];
  keyFacts?: { revenue?: number; netIncome?: number; sharesOutstanding?: number };
  sources: Record<string, string[]>;
}): Report {
  const now = new Date().toISOString();
  const metrics = calculateKeyMetrics(input.prices);
  const indicators = calculateIndicators(input.prices);

  // Calculate scores
  const latestMetrics = input.keyMetrics?.[0];
  const latestIncome = input.incomeStatements?.[0];
  const previousIncome = input.incomeStatements?.[1];
  const latestBalance = input.balanceSheets?.[0];
  const latestCashFlow = input.cashFlows?.[0];

  const valuationScore = calculateValuationScore(
    latestMetrics?.peRatio,
    latestMetrics?.priceToSalesRatio,
    latestMetrics?.pbRatio
  );

  const revenueGrowthYOY = latestIncome && previousIncome
    ? ((latestIncome.revenue - previousIncome.revenue) / Math.abs(previousIncome.revenue)) * 100
    : undefined;

  const earningsGrowthYOY = latestIncome && previousIncome && previousIncome.netIncome !== 0
    ? ((latestIncome.netIncome - previousIncome.netIncome) / Math.abs(previousIncome.netIncome)) * 100
    : undefined;

  const growthScore = calculateGrowthScore(
    revenueGrowthYOY,
    earningsGrowthYOY,
    latestMetrics?.earningsYield
  );

  const profitabilityScore = calculateProfitabilityScore(
    latestIncome?.netIncomeRatio,
    latestIncome?.operatingIncomeRatio,
    latestMetrics?.roe,
    latestMetrics?.returnOnTangibleAssets
  );

  const healthScore = calculateHealthScore(
    latestMetrics?.currentRatio,
    latestMetrics?.debtToEquity,
    latestCashFlow?.operatingCashFlow,
    latestCashFlow?.freeCashFlow
  );

  const momentumScore = calculateMomentumScore(input.prices, indicators);

  const riskPenalty = calculateRiskPenalty(
    metrics.volatility,
    metrics.return90d < 0 ? Math.abs(metrics.return90d) / 100 : undefined,
    revenueGrowthYOY !== undefined && revenueGrowthYOY < 0,
    latestCashFlow?.freeCashFlow !== undefined && latestCashFlow.freeCashFlow < 0
  );

  // Aggregate score
  const totalScore = (
    valuationScore * 0.15 +
    growthScore * 0.20 +
    profitabilityScore * 0.20 +
    healthScore * 0.15 +
    momentumScore * 0.20 +
    (50 - riskPenalty) * 0.10
  );

  const finalScore = Math.max(0, Math.min(100, totalScore));

  // Determine label and recommendation
  let label: 'Bullish' | 'Neutral' | 'Bearish';
  let recommendation: 'Buy' | 'Hold' | 'Sell';
  let confidence: number;

  if (finalScore >= 60) {
    label = 'Bullish';
    recommendation = 'Buy';
    confidence = Math.min(95, 60 + (finalScore - 60) * 0.875);
  } else if (finalScore >= 40) {
    label = 'Neutral';
    recommendation = 'Hold';
    confidence = 40 + (finalScore - 40) * 1.0;
  } else {
    label = 'Bearish';
    recommendation = 'Sell';
    confidence = Math.max(20, 50 - (40 - finalScore) * 0.75);
  }

  // Generate "why" reasons
  const why: string[] = [];

  if (valuationScore > 60) {
    why.push(`Attractive valuation metrics (PE: ${latestMetrics?.peRatio?.toFixed(1) || 'N/A'}, PS: ${latestMetrics?.priceToSalesRatio?.toFixed(1) || 'N/A'})`);
  } else if (valuationScore < 40) {
    why.push(`Valuation appears stretched (PE: ${latestMetrics?.peRatio?.toFixed(1) || 'N/A'})`);
  }

  if (growthScore > 60 && revenueGrowthYOY) {
    why.push(`Strong revenue growth of ${revenueGrowthYOY.toFixed(1)}% year-over-year`);
  } else if (growthScore < 40 && revenueGrowthYOY !== undefined) {
    why.push(`Revenue growth concerns (${revenueGrowthYOY.toFixed(1)}% YoY)`);
  }

  if (profitabilityScore > 60) {
    why.push(`Strong profitability metrics (Profit Margin: ${(latestIncome?.netIncomeRatio || 0) * 100}%)`);
  } else if (profitabilityScore < 40) {
    why.push(`Profitability challenges (Profit Margin: ${(latestIncome?.netIncomeRatio || 0) * 100}%)`);
  }

  if (healthScore > 60) {
    why.push(`Solid financial health (Current Ratio: ${latestMetrics?.currentRatio?.toFixed(2) || 'N/A'})`);
  } else if (healthScore < 40) {
    why.push(`Financial health concerns (Current Ratio: ${latestMetrics?.currentRatio?.toFixed(2) || 'N/A'})`);
  }

  if (momentumScore > 60) {
    why.push(`Positive price momentum (Price above key moving averages)`);
  } else if (momentumScore < 40) {
    why.push(`Weak price momentum (Price below key moving averages)`);
  }

  if (riskPenalty > 10) {
    why.push(`Elevated risk factors (Volatility: ${metrics.volatility.toFixed(1)}%)`);
  }

  if (indicators.rsi > 70) {
    why.push(`RSI indicates overbought conditions (${indicators.rsi.toFixed(1)})`);
  } else if (indicators.rsi < 30) {
    why.push(`RSI indicates oversold conditions (${indicators.rsi.toFixed(1)})`);
  }

  if (why.length < 5) {
    why.push(`Overall score: ${finalScore.toFixed(0)}/100 based on comprehensive analysis`);
  }

  // Build sections
  const sections: ReportSection = {};

  if (input.companyProfile) {
    sections.company = {
      name: input.companyProfile.companyName || input.symbol,
      symbol: input.symbol,
      sector: input.companyProfile.sector,
      industry: input.companyProfile.industry,
      description: input.companyProfile.description,
      website: input.companyProfile.website,
      employees: input.companyProfile.fullTimeEmployees,
      exchange: input.companyProfile.exchange,
      marketCap: input.companyProfile.mktCap,
      enterpriseValue: latestMetrics?.enterpriseValue,
      freshAt: now,
    };
  }

  if (latestMetrics) {
    sections.valuation = {
      peRatio: latestMetrics.peRatio,
      priceToSales: latestMetrics.priceToSalesRatio,
      priceToBook: latestMetrics.pbRatio,
      evToEBITDA: latestMetrics.enterpriseValueOverEBITDA,
      evToRevenue: latestMetrics.evToSales,
      marketCap: input.companyProfile?.mktCap,
      enterpriseValue: latestMetrics.enterpriseValue,
      freshAt: now,
    };

    // Perform comprehensive valuation analysis
    // Calculate EPS from available data
    let eps: number | undefined;
    if (latestIncome?.eps) {
      eps = latestIncome.eps;
    } else if (latestMetrics?.earningsYield && metrics.lastClose) {
      // EPS = Price / (1 / Earnings Yield) = Price * Earnings Yield
      eps = metrics.lastClose * (latestMetrics.earningsYield / 100);
    } else if (latestIncome?.netIncome && input.keyFacts?.sharesOutstanding) {
      eps = latestIncome.netIncome / input.keyFacts.sharesOutstanding;
    }

    const valuationAnalysis = analyzeValuation(
      metrics.lastClose,
      input.companyProfile?.sector,
      {
        eps: eps,
        bookValue: latestMetrics?.bookValuePerShare || latestMetrics?.tangibleBookValuePerShare,
        freeCashFlow: latestCashFlow?.freeCashFlow,
        revenue: latestIncome?.revenue,
        revenueGrowth: revenueGrowthYOY,
        earningsGrowth: earningsGrowthYOY,
        profitMargin: latestIncome?.netIncomeRatio ? latestIncome.netIncomeRatio * 100 : undefined,
        peRatio: latestMetrics?.peRatio,
        evToEbitda: latestMetrics?.enterpriseValueOverEBITDA,
        priceToSales: latestMetrics?.priceToSalesRatio,
        priceToBook: latestMetrics?.pbRatio,
        ebitda: latestIncome?.ebitda,
        sharesOutstanding: input.keyFacts?.sharesOutstanding,
      }
    );

    sections.valuationAnalysis = valuationAnalysis;

    // Add valuation insights to "why" reasons
    if (valuationAnalysis.valuationStatus === 'undervalued') {
      why.push(`Stock appears undervalued - fair value estimate: $${valuationAnalysis.intrinsicValue.average?.toFixed(2) || 'N/A'} (${valuationAnalysis.upsideDownside.fairValueUpside.toFixed(1)}% upside)`);
    } else if (valuationAnalysis.valuationStatus === 'overvalued') {
      why.push(`Stock appears overvalued - fair value estimate: $${valuationAnalysis.intrinsicValue.average?.toFixed(2) || 'N/A'} (${Math.abs(valuationAnalysis.upsideDownside.fairValueUpside).toFixed(1)}% downside)`);
    }
  }

  if (latestBalance || latestMetrics) {
    sections.financialHealth = {
      currentRatio: latestMetrics?.currentRatio,
      debtToEquity: latestMetrics?.debtToEquity,
      debtToAssets: latestMetrics?.debtToAssets,
      interestCoverage: latestMetrics?.interestCoverage,
      workingCapital: latestMetrics?.workingCapital,
      operatingCashFlow: latestCashFlow?.operatingCashFlow,
      freeCashFlow: latestCashFlow?.freeCashFlow,
      freshAt: now,
    };
  }

  if (latestIncome || latestMetrics) {
    sections.profitability = {
      profitMargin: latestIncome?.netIncomeRatio,
      operatingMargin: latestIncome?.operatingIncomeRatio,
      netMargin: latestIncome?.netIncomeRatio,
      roe: latestMetrics?.roe,
      roa: latestMetrics?.returnOnTangibleAssets,
      roic: latestMetrics?.roic,
      freshAt: now,
    };
  }

  if (latestIncome && previousIncome) {
    sections.growth = {
      revenueGrowthYOY,
      revenueGrowthQOQ: ((latestIncome.revenue - previousIncome.revenue) / Math.abs(previousIncome.revenue)) * 100,
      earningsGrowthYOY,
      freshAt: now,
    };
  }

  sections.performance = {
    currentPrice: metrics.lastClose,
    price52wHigh: metrics.high90d,
    price52wLow: metrics.low90d,
    priceChange1d: metrics.return20d, // Approximation
    priceChange30d: metrics.return20d,
    priceChange1y: metrics.return90d,
    volatility: metrics.volatility,
    freshAt: now,
  };

  // Calculate SMA200
  const closePrices = input.prices.map(p => p.close);
  let sma200: number | undefined;
  if (closePrices.length >= 200) {
    const sma200Values = closePrices.slice(-200);
    sma200 = sma200Values.reduce((a, b) => a + b, 0) / sma200Values.length;
  }

  sections.technicals = {
    sma50: indicators.sma50,
    sma200: sma200,
    rsi: indicators.rsi,
    macd: indicators.macd,
    priceVsSMA50: indicators.sma50 ? ((metrics.lastClose - indicators.sma50) / indicators.sma50) * 100 : undefined,
    priceVsSMA200: sma200 ? ((metrics.lastClose - sma200) / sma200) * 100 : undefined,
    freshAt: now,
  };

  if (input.earnings && input.earnings.length > 0) {
    sections.earnings = {
      history: input.earnings.map((e) => ({
        date: e.date,
        eps: e.eps,
        epsEstimated: e.epsEstimated,
        revenue: e.revenue,
        revenueEstimated: e.revenueEstimated,
        beat: e.eps !== null && e.epsEstimated !== null && e.eps > e.epsEstimated,
      })),
      freshAt: now,
    };
  }

  if (input.filings && input.filings.length > 0) {
    sections.filings = {
      recent: input.filings.slice(0, 10),
      keyFacts: input.keyFacts,
      freshAt: now,
    };
  }

  sections.risks = {
    factors: [],
    level: riskPenalty > 15 ? 'High' : riskPenalty > 8 ? 'Medium' : 'Low',
  };

  if (metrics.volatility > 40) {
    sections.risks.factors.push(`High volatility (${metrics.volatility.toFixed(1)}%)`);
  }
  if (revenueGrowthYOY !== undefined && revenueGrowthYOY < -10) {
    sections.risks.factors.push('Declining revenue');
  }
  if (latestCashFlow?.freeCashFlow !== undefined && latestCashFlow.freeCashFlow < 0) {
    sections.risks.factors.push('Negative free cash flow');
  }
  if (latestMetrics?.debtToEquity && latestMetrics.debtToEquity > 2) {
    sections.risks.factors.push('High debt levels');
  }

  return {
    symbol: input.symbol,
    assetType: 'stock',
    generatedAt: now,
    summary: { label, recommendation, confidence: Math.round(confidence) },
    why,
    sections,
    sources: input.sources,
    prices: input.prices, // Include prices for charting
  };
}

export function buildCryptoReport(input: {
  symbol: string;
  coinId: string;
  coinData: any;
  marketChart: any;
  sources: Record<string, string[]>;
}): Report {
  const now = new Date().toISOString();
  const prices: PricePoint[] = input.marketChart.prices
    .slice(-365) // Last year
    .map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      close: price,
      volume: 0,
    }));

  const metrics = calculateKeyMetrics(prices);
  const indicators = calculateIndicators(prices);

  // Calculate crypto-specific scores
  const priceChange7d = input.coinData.price_change_percentage_7d_in_currency || 0;
  const priceChange30d = input.coinData.price_change_percentage_30d_in_currency || 0;
  const marketCapRank = input.coinData.market_cap_rank || 999;

  let score = 50;

  // Market cap rank (lower is better)
  if (marketCapRank <= 10) score += 15;
  else if (marketCapRank <= 50) score += 10;
  else if (marketCapRank <= 100) score += 5;

  // Price momentum
  if (priceChange7d > 10) score += 15;
  else if (priceChange7d > 5) score += 10;
  else if (priceChange7d > 0) score += 5;
  else if (priceChange7d < -20) score -= 20;
  else if (priceChange7d < -10) score -= 10;

  if (priceChange30d > 20) score += 10;
  else if (priceChange30d < -30) score -= 15;

  // Technical indicators
  if (indicators.rsi >= 50 && indicators.rsi <= 70) score += 10;
  else if (indicators.rsi > 75) score -= 10;
  else if (indicators.rsi < 30) score -= 5;

  if (indicators.macd.histogram > 0) score += 5;
  else score -= 5;

  // Volatility penalty
  if (metrics.volatility > 60) score -= 15;
  else if (metrics.volatility > 40) score -= 10;

  const finalScore = Math.max(0, Math.min(100, score));

  let label: 'Bullish' | 'Neutral' | 'Bearish';
  let recommendation: 'Buy' | 'Hold' | 'Sell';
  let confidence: number;

  if (finalScore >= 60) {
    label = 'Bullish';
    recommendation = 'Buy';
    confidence = Math.min(95, 60 + (finalScore - 60) * 0.875);
  } else if (finalScore >= 40) {
    label = 'Neutral';
    recommendation = 'Hold';
    confidence = 40 + (finalScore - 40) * 1.0;
  } else {
    label = 'Bearish';
    recommendation = 'Sell';
    confidence = Math.max(20, 50 - (40 - finalScore) * 0.75);
  }

  const why: string[] = [];

  if (marketCapRank <= 10) {
    why.push(`Top ${marketCapRank} cryptocurrency by market cap`);
  }

  if (priceChange7d > 10) {
    why.push(`Strong 7-day performance (+${priceChange7d.toFixed(1)}%)`);
  } else if (priceChange7d < -10) {
    why.push(`Weak 7-day performance (${priceChange7d.toFixed(1)}%)`);
  }

  if (priceChange30d > 20) {
    why.push(`Strong 30-day performance (+${priceChange30d.toFixed(1)}%)`);
  }

  if (indicators.rsi > 70) {
    why.push(`RSI indicates overbought conditions (${indicators.rsi.toFixed(1)})`);
  } else if (indicators.rsi < 30) {
    why.push(`RSI indicates oversold conditions (${indicators.rsi.toFixed(1)})`);
  }

  if (metrics.volatility > 50) {
    why.push(`High volatility (${metrics.volatility.toFixed(1)}%)`);
  }

  if (input.coinData.ath && input.coinData.current_price) {
    const fromATH = ((input.coinData.current_price - input.coinData.ath) / input.coinData.ath) * 100;
    if (fromATH < -50) {
      why.push(`Trading ${Math.abs(fromATH).toFixed(1)}% below all-time high`);
    }
  }

  const sections: ReportSection = {
    crypto: {
      marketCap: input.coinData.market_cap,
      volume24h: input.coinData.total_volume,
      circulatingSupply: input.coinData.circulating_supply,
      totalSupply: input.coinData.total_supply,
      maxSupply: input.coinData.max_supply,
      priceChange7d: priceChange7d,
      priceChange30d: priceChange30d,
      volatility: metrics.volatility,
      ath: input.coinData.ath,
      athChange: input.coinData.ath_change_percentage,
      atl: input.coinData.atl,
      atlChange: input.coinData.atl_change_percentage,
      freshAt: now,
    },
    performance: {
      currentPrice: input.coinData.current_price || 0,
      priceChange7d: priceChange7d,
      priceChange30d: priceChange30d,
      volatility: metrics.volatility,
      freshAt: now,
    },
    technicals: {
      sma50: indicators.sma50,
      sma200: closePrices.length >= 200
        ? closePrices.slice(-200).reduce((a, b) => a + b, 0) / 200
        : undefined,
      rsi: indicators.rsi,
      macd: indicators.macd,
      freshAt: now,
    },
    risks: {
      factors: metrics.volatility > 50 ? ['High volatility'] : [],
      level: metrics.volatility > 50 ? 'High' : metrics.volatility > 30 ? 'Medium' : 'Low',
    },
  };

  return {
    symbol: input.symbol,
    assetType: 'crypto',
    generatedAt: now,
    summary: { label, recommendation, confidence: Math.round(confidence) },
    why,
    sections,
    sources: input.sources,
    prices, // Include prices for charting
  };
}
