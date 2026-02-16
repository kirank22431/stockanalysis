/**
 * Valuation Analysis Module
 * Calculates intrinsic value, projections, and determines if stock is overvalued/undervalued
 * Uses multiple methods: DCF, Graham's formula, relative valuation (Damodaran)
 */

import { compareToIndustry, getIndustryMetrics } from '@/lib/providers/damodaran';

export interface ValuationAnalysis {
  currentPrice: number;
  intrinsicValue: {
    graham: number | null;
    dcf: number | null;
    relative: number | null;
    average: number | null;
  };
  fairValueRange: {
    low: number;
    high: number;
  };
  valuationStatus: 'undervalued' | 'fair' | 'overvalued';
  upsideDownside: {
    upside: number; // percentage
    downside: number; // percentage
    fairValueUpside: number; // percentage to fair value
  };
  projections: {
    oneYear: {
      optimistic: number;
      base: number;
      pessimistic: number;
    };
    threeYear: {
      optimistic: number;
      base: number;
      pessimistic: number;
    };
  };
  relativeValuation: {
    status: 'undervalued' | 'fair' | 'overvalued';
    details: Array<{ metric: string; stock: number | undefined; industry: number; difference: number }>;
  };
  confidence: number; // 0-100
  methodology: string[];
}

/**
 * Calculate Graham's Intrinsic Value
 * Formula: sqrt(22.5 * EPS * Book Value per Share)
 * Modified for modern markets: sqrt(15 * EPS * Book Value per Share) as conservative estimate
 */
export function calculateGrahamValue(
  eps: number | undefined,
  bookValue: number | undefined,
  currentPrice: number
): number | null {
  if (!eps || !bookValue || eps <= 0 || bookValue <= 0) {
    return null;
  }

  // Graham's original formula: sqrt(22.5 * EPS * BVPS)
  // Using 15 as more conservative multiplier for modern markets
  const grahamValue = Math.sqrt(15 * eps * bookValue);
  return grahamValue;
}

/**
 * Simplified DCF (Discounted Cash Flow) Valuation
 * Uses free cash flow projections with growth assumptions
 */
export function calculateDCFValue(
  freeCashFlow: number | undefined,
  revenue: number | undefined,
  revenueGrowth: number | undefined,
  profitMargin: number | undefined,
  currentPrice: number,
  sharesOutstanding: number | undefined
): number | null {
  if (!freeCashFlow && !revenue) {
    return null;
  }

  // If we have FCF, use it directly
  // Otherwise, estimate FCF from revenue and profit margin
  let baseFCF = freeCashFlow;
  if (!baseFCF && revenue && profitMargin) {
    // Estimate FCF as 60% of net income (rough estimate)
    const netIncome = revenue * (profitMargin / 100);
    baseFCF = netIncome * 0.6;
  }

  if (!baseFCF || baseFCF <= 0) {
    return null;
  }

  // Growth assumptions
  const growthRate = revenueGrowth ? Math.min(revenueGrowth / 100, 0.15) : 0.05; // Cap at 15%
  const terminalGrowth = 0.03; // 3% terminal growth
  const discountRate = 0.10; // 10% WACC (Weighted Average Cost of Capital)

  // Project FCF for 5 years
  let pv = 0;
  let projectedFCF = baseFCF;

  for (let year = 1; year <= 5; year++) {
    projectedFCF = projectedFCF * (1 + growthRate);
    const discountFactor = Math.pow(1 + discountRate, year);
    pv += projectedFCF / discountFactor;
  }

  // Terminal value
  const terminalFCF = projectedFCF * (1 + terminalGrowth);
  const terminalValue = terminalFCF / (discountRate - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, 5);

  const enterpriseValue = pv + pvTerminal;

  // Convert to equity value (simplified - assume net debt is 0)
  // In reality, you'd subtract net debt
  const equityValue = enterpriseValue;

  // Calculate per share value
  if (sharesOutstanding && sharesOutstanding > 0) {
    return equityValue / sharesOutstanding;
  }

  // If no shares outstanding, return enterprise value
  return equityValue;
}

/**
 * Relative Valuation using Industry Multiples (Damodaran methodology)
 */
export function calculateRelativeValue(
  currentPrice: number,
  sector: string | undefined,
  metrics: {
    peRatio?: number;
    evToEbitda?: number;
    priceToSales?: number;
    priceToBook?: number;
    eps?: number;
    revenue?: number;
    bookValue?: number;
    ebitda?: number;
  }
): number | null {
  if (!sector) return null;

  const industry = getIndustryMetrics(sector);
  if (!industry) return null;

  const values: number[] = [];

  // P/E based valuation
  if (metrics.peRatio && metrics.eps && industry.peRatio) {
    const fairPE = industry.peRatio;
    const fairValue = fairPE * metrics.eps;
    values.push(fairValue);
  }

  // P/B based valuation
  if (metrics.priceToBook && metrics.bookValue && industry.priceToBook) {
    const fairPB = industry.priceToBook;
    const fairValue = fairPB * metrics.bookValue;
    values.push(fairValue);
  }

  // P/S based valuation (if we can estimate revenue per share)
  if (metrics.priceToSales && metrics.revenue && industry.priceToSales) {
    // This is simplified - would need shares outstanding for accurate calculation
    // Using current price as proxy
    const fairPS = industry.priceToSales;
    // Rough estimate: if current P/S is X and fair is Y, adjust price
    if (metrics.priceToSales > 0) {
      const adjustment = fairPS / metrics.priceToSales;
      const fairValue = currentPrice * adjustment;
      values.push(fairValue);
    }
  }

  if (values.length === 0) return null;

  // Return average of calculated values
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate price projections based on growth and valuation
 */
export function calculateProjections(
  currentPrice: number,
  revenueGrowth: number | undefined,
  earningsGrowth: number | undefined,
  peRatio: number | undefined,
  industryPE: number | undefined
): {
  oneYear: { optimistic: number; base: number; pessimistic: number };
  threeYear: { optimistic: number; base: number; pessimistic: number };
} {
  const growth = earningsGrowth ? earningsGrowth / 100 : revenueGrowth ? revenueGrowth / 100 : 0.05;
  const baseGrowth = Math.max(0, Math.min(growth, 0.20)); // Cap at 20%
  const optimisticGrowth = baseGrowth * 1.5;
  const pessimisticGrowth = baseGrowth * 0.5;

  // Base case: current growth rate
  const oneYearBase = currentPrice * (1 + baseGrowth);
  const threeYearBase = currentPrice * Math.pow(1 + baseGrowth, 3);

  // Optimistic: higher growth
  const oneYearOptimistic = currentPrice * (1 + optimisticGrowth);
  const threeYearOptimistic = currentPrice * Math.pow(1 + optimisticGrowth, 3);

  // Pessimistic: lower growth
  const oneYearPessimistic = currentPrice * (1 + pessimisticGrowth);
  const threeYearPessimistic = currentPrice * Math.pow(1 + pessimisticGrowth, 3);

  // Adjust for P/E normalization if available
  if (peRatio && industryPE) {
    const peAdjustment = industryPE / peRatio;
    const adjustmentFactor = Math.min(1.2, Math.max(0.8, peAdjustment)); // Cap adjustment

    return {
      oneYear: {
        optimistic: oneYearOptimistic * adjustmentFactor,
        base: oneYearBase * adjustmentFactor,
        pessimistic: oneYearPessimistic * adjustmentFactor,
      },
      threeYear: {
        optimistic: threeYearOptimistic * Math.pow(adjustmentFactor, 3),
        base: threeYearBase * Math.pow(adjustmentFactor, 3),
        pessimistic: threeYearPessimistic * Math.pow(adjustmentFactor, 3),
      },
    };
  }

  return {
    oneYear: {
      optimistic: oneYearOptimistic,
      base: oneYearBase,
      pessimistic: oneYearPessimistic,
    },
    threeYear: {
      optimistic: threeYearOptimistic,
      base: threeYearBase,
      pessimistic: threeYearPessimistic,
    },
  };
}

/**
 * Main valuation analysis function
 */
export function analyzeValuation(
  currentPrice: number,
  sector: string | undefined,
  metrics: {
    eps?: number;
    bookValue?: number;
    freeCashFlow?: number;
    revenue?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    profitMargin?: number;
    peRatio?: number;
    evToEbitda?: number;
    priceToSales?: number;
    priceToBook?: number;
    ebitda?: number;
    sharesOutstanding?: number;
  }
): ValuationAnalysis {
  // Calculate intrinsic values using different methods
  const grahamValue = calculateGrahamValue(metrics.eps, metrics.bookValue, currentPrice);
  const dcfValue = calculateDCFValue(
    metrics.freeCashFlow,
    metrics.revenue,
    metrics.revenueGrowth,
    metrics.profitMargin,
    currentPrice,
    metrics.sharesOutstanding
  );
  const relativeValue = calculateRelativeValue(currentPrice, sector, metrics);

  // Calculate average intrinsic value
  const values = [grahamValue, dcfValue, relativeValue].filter((v): v is number => v !== null);
  const averageValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

  // Fair value range (±20% of average)
  const fairValueRange = averageValue
    ? {
        low: averageValue * 0.8,
        high: averageValue * 1.2,
      }
    : {
        low: currentPrice * 0.8,
        high: currentPrice * 1.2,
      };

  // Determine valuation status
  let valuationStatus: 'undervalued' | 'fair' | 'overvalued' = 'fair';
  if (averageValue) {
    const deviation = ((currentPrice - averageValue) / averageValue) * 100;
    if (deviation < -15) {
      valuationStatus = 'undervalued';
    } else if (deviation > 15) {
      valuationStatus = 'overvalued';
    }
  }

  // Calculate upside/downside
  const upsideDownside = averageValue
    ? {
        upside: ((fairValueRange.high - currentPrice) / currentPrice) * 100,
        downside: ((currentPrice - fairValueRange.low) / currentPrice) * 100,
        fairValueUpside: ((averageValue - currentPrice) / currentPrice) * 100,
      }
    : {
        upside: 20,
        downside: 20,
        fairValueUpside: 0,
      };

  // Calculate projections
  const projections = calculateProjections(
    currentPrice,
    metrics.revenueGrowth,
    metrics.earningsGrowth,
    metrics.peRatio,
    sector ? getIndustryMetrics(sector)?.peRatio : undefined
  );

  // Relative valuation comparison
  const relativeValuation = compareToIndustry(
    {
      peRatio: metrics.peRatio,
      evToEbitda: metrics.evToEbitda,
      priceToSales: metrics.priceToSales,
      priceToBook: metrics.priceToBook,
      profitMargin: metrics.profitMargin,
      roe: undefined, // Would need ROE
      roa: undefined, // Would need ROA
      debtToEquity: undefined,
      dividendYield: undefined,
      beta: undefined,
    },
    sector || ''
  );

  // Calculate confidence based on data availability
  let confidence = 50; // Base confidence
  if (grahamValue) confidence += 15;
  if (dcfValue) confidence += 15;
  if (relativeValue) confidence += 15;
  if (metrics.peRatio) confidence += 5;
  confidence = Math.min(100, confidence);

  // Methodology notes
  const methodology: string[] = [];
  if (grahamValue) {
    methodology.push('Graham Intrinsic Value: Based on EPS and Book Value per Share');
  }
  if (dcfValue) {
    methodology.push('DCF Valuation: Discounted Cash Flow analysis with growth projections');
  }
  if (relativeValue) {
    methodology.push('Relative Valuation: Comparison to industry averages (Damodaran methodology)');
  }
  if (methodology.length === 0) {
    methodology.push('Limited data available for valuation analysis');
  }

  return {
    currentPrice,
    intrinsicValue: {
      graham: grahamValue,
      dcf: dcfValue,
      relative: relativeValue,
      average: averageValue,
    },
    fairValueRange,
    valuationStatus,
    upsideDownside,
    projections,
    relativeValuation,
    confidence,
    methodology,
  };
}
