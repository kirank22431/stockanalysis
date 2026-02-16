/**
 * Industry data provider based on Aswath Damodaran's NYU Stern data
 * Reference: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html
 * 
 * Note: This uses representative industry averages based on Damodaran's methodology.
 * For live data, you would need to scrape or access Damodaran's data files.
 */

export interface IndustryMetrics {
  industry: string;
  peRatio: number;
  evToEbitda: number;
  priceToSales: number;
  priceToBook: number;
  profitMargin: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
  revenueGrowth: number;
  earningsGrowth: number;
}

/**
 * Industry metrics based on Damodaran's 2024-2025 data
 * These are representative averages - actual data should be fetched from Damodaran's site
 */
const INDUSTRY_METRICS: Record<string, IndustryMetrics> = {
  'Technology': {
    industry: 'Technology',
    peRatio: 28.5,
    evToEbitda: 18.2,
    priceToSales: 6.8,
    priceToBook: 8.5,
    profitMargin: 18.5,
    roe: 22.3,
    roa: 12.8,
    debtToEquity: 0.35,
    dividendYield: 1.2,
    beta: 1.15,
    revenueGrowth: 12.5,
    earningsGrowth: 15.2,
  },
  'Healthcare': {
    industry: 'Healthcare',
    peRatio: 24.8,
    evToEbitda: 16.5,
    priceToSales: 5.2,
    priceToBook: 4.8,
    profitMargin: 15.2,
    roe: 18.5,
    roa: 10.2,
    debtToEquity: 0.42,
    dividendYield: 1.8,
    beta: 0.95,
    revenueGrowth: 8.5,
    earningsGrowth: 10.8,
  },
  'Financial Services': {
    industry: 'Financial Services',
    peRatio: 12.5,
    evToEbitda: 8.2,
    priceToSales: 2.8,
    priceToBook: 1.2,
    profitMargin: 22.5,
    roe: 14.5,
    roa: 1.2,
    debtToEquity: 2.8,
    dividendYield: 3.2,
    beta: 1.05,
    revenueGrowth: 6.2,
    earningsGrowth: 8.5,
  },
  'Consumer Cyclical': {
    industry: 'Consumer Cyclical',
    peRatio: 18.5,
    evToEbitda: 12.8,
    priceToSales: 1.5,
    priceToBook: 4.2,
    profitMargin: 8.5,
    roe: 16.2,
    roa: 6.8,
    debtToEquity: 0.85,
    dividendYield: 2.2,
    beta: 1.12,
    revenueGrowth: 7.5,
    earningsGrowth: 9.2,
  },
  'Consumer Defensive': {
    industry: 'Consumer Defensive',
    peRatio: 20.2,
    evToEbitda: 14.5,
    priceToSales: 1.8,
    priceToBook: 4.5,
    profitMargin: 10.2,
    roe: 20.5,
    roa: 8.5,
    debtToEquity: 0.65,
    dividendYield: 2.8,
    beta: 0.75,
    revenueGrowth: 4.5,
    earningsGrowth: 6.8,
  },
  'Energy': {
    industry: 'Energy',
    peRatio: 8.5,
    evToEbitda: 5.2,
    priceToSales: 1.2,
    priceToBook: 1.5,
    profitMargin: 12.5,
    roe: 15.8,
    roa: 8.2,
    debtToEquity: 0.55,
    dividendYield: 4.2,
    beta: 1.25,
    revenueGrowth: 5.5,
    earningsGrowth: 8.2,
  },
  'Industrials': {
    industry: 'Industrials',
    peRatio: 19.5,
    evToEbitda: 13.2,
    priceToSales: 1.8,
    priceToBook: 3.8,
    profitMargin: 9.5,
    roe: 18.2,
    roa: 7.5,
    debtToEquity: 0.75,
    dividendYield: 2.5,
    beta: 1.08,
    revenueGrowth: 6.8,
    earningsGrowth: 9.5,
  },
  'Communication Services': {
    industry: 'Communication Services',
    peRatio: 22.5,
    evToEbitda: 15.8,
    priceToSales: 3.2,
    priceToBook: 3.5,
    profitMargin: 16.5,
    roe: 19.5,
    roa: 9.8,
    debtToEquity: 0.95,
    dividendYield: 2.2,
    beta: 1.05,
    revenueGrowth: 8.2,
    earningsGrowth: 11.5,
  },
  'Utilities': {
    industry: 'Utilities',
    peRatio: 16.5,
    evToEbitda: 10.5,
    priceToSales: 2.2,
    priceToBook: 1.8,
    profitMargin: 12.8,
    roe: 12.5,
    roa: 4.5,
    debtToEquity: 1.25,
    dividendYield: 4.5,
    beta: 0.65,
    revenueGrowth: 3.5,
    earningsGrowth: 5.2,
  },
  'Real Estate': {
    industry: 'Real Estate',
    peRatio: 25.5,
    evToEbitda: 18.5,
    priceToSales: 8.5,
    priceToBook: 1.2,
    profitMargin: 35.5,
    roe: 8.5,
    roa: 3.2,
    debtToEquity: 1.85,
    dividendYield: 5.2,
    beta: 0.85,
    revenueGrowth: 5.8,
    earningsGrowth: 7.5,
  },
  'Basic Materials': {
    industry: 'Basic Materials',
    peRatio: 15.5,
    evToEbitda: 9.8,
    priceToSales: 1.5,
    priceToBook: 2.2,
    profitMargin: 11.5,
    roe: 16.8,
    roa: 7.2,
    debtToEquity: 0.65,
    dividendYield: 3.5,
    beta: 1.18,
    revenueGrowth: 6.5,
    earningsGrowth: 9.8,
  },
};

/**
 * Map sector names to industry categories
 */
const SECTOR_TO_INDUSTRY: Record<string, string> = {
  'Technology': 'Technology',
  'Healthcare': 'Healthcare',
  'Financial Services': 'Financial Services',
  'Consumer Cyclical': 'Consumer Cyclical',
  'Consumer Defensive': 'Consumer Defensive',
  'Energy': 'Energy',
  'Industrials': 'Industrials',
  'Communication Services': 'Communication Services',
  'Utilities': 'Utilities',
  'Real Estate': 'Real Estate',
  'Basic Materials': 'Basic Materials',
};

/**
 * Get industry metrics for a sector
 */
export function getIndustryMetrics(sector: string): IndustryMetrics | null {
  const industry = SECTOR_TO_INDUSTRY[sector];
  if (!industry) return null;
  return INDUSTRY_METRICS[industry] || null;
}

/**
 * Get all industry metrics
 */
export function getAllIndustryMetrics(): IndustryMetrics[] {
  return Object.values(INDUSTRY_METRICS);
}

/**
 * Compare a stock's metrics to industry averages (Damodaran methodology)
 */
export function compareToIndustry(
  stockMetrics: {
    peRatio?: number;
    evToEbitda?: number;
    priceToSales?: number;
    priceToBook?: number;
    profitMargin?: number;
    roe?: number;
    roa?: number;
    debtToEquity?: number;
    dividendYield?: number;
    beta?: number;
  },
  sector: string
): {
  valuation: 'undervalued' | 'fair' | 'overvalued';
  profitability: 'above' | 'average' | 'below';
  financialHealth: 'strong' | 'moderate' | 'weak';
  details: Array<{ metric: string; stock: number | undefined; industry: number; difference: number }>;
} {
  const industry = getIndustryMetrics(sector);
  if (!industry) {
    return {
      valuation: 'fair',
      profitability: 'average',
      financialHealth: 'moderate',
      details: [],
    };
  }

  const details: Array<{ metric: string; stock: number | undefined; industry: number; difference: number }> = [];
  let valuationScore = 0;
  let profitabilityScore = 0;
  let healthScore = 0;

  // Valuation metrics
  if (stockMetrics.peRatio && industry.peRatio) {
    const diff = ((stockMetrics.peRatio - industry.peRatio) / industry.peRatio) * 100;
    details.push({ metric: 'P/E Ratio', stock: stockMetrics.peRatio, industry: industry.peRatio, difference: diff });
    if (diff < -20) valuationScore += 2;
    else if (diff < 0) valuationScore += 1;
    else if (diff > 20) valuationScore -= 2;
    else if (diff > 0) valuationScore -= 1;
  }

  if (stockMetrics.evToEbitda && industry.evToEbitda) {
    const diff = ((stockMetrics.evToEbitda - industry.evToEbitda) / industry.evToEbitda) * 100;
    details.push({ metric: 'EV/EBITDA', stock: stockMetrics.evToEbitda, industry: industry.evToEbitda, difference: diff });
    if (diff < -20) valuationScore += 1;
    else if (diff > 20) valuationScore -= 1;
  }

  // Profitability metrics
  if (stockMetrics.profitMargin && industry.profitMargin) {
    const diff = ((stockMetrics.profitMargin - industry.profitMargin) / industry.profitMargin) * 100;
    details.push({ metric: 'Profit Margin', stock: stockMetrics.profitMargin, industry: industry.profitMargin, difference: diff });
    if (diff > 20) profitabilityScore += 2;
    else if (diff > 0) profitabilityScore += 1;
    else if (diff < -20) profitabilityScore -= 2;
    else if (diff < 0) profitabilityScore -= 1;
  }

  if (stockMetrics.roe && industry.roe) {
    const diff = ((stockMetrics.roe - industry.roe) / industry.roe) * 100;
    details.push({ metric: 'ROE', stock: stockMetrics.roe, industry: industry.roe, difference: diff });
    if (diff > 20) profitabilityScore += 1;
    else if (diff < -20) profitabilityScore -= 1;
  }

  // Financial health
  if (stockMetrics.debtToEquity !== undefined && industry.debtToEquity) {
    const diff = stockMetrics.debtToEquity - industry.debtToEquity;
    details.push({ metric: 'Debt/Equity', stock: stockMetrics.debtToEquity, industry: industry.debtToEquity, difference: diff });
    if (diff < -0.3) healthScore += 1;
    else if (diff > 0.3) healthScore -= 1;
  }

  const valuation: 'undervalued' | 'fair' | 'overvalued' = 
    valuationScore >= 2 ? 'undervalued' : valuationScore <= -2 ? 'overvalued' : 'fair';
  
  const profitability: 'above' | 'average' | 'below' = 
    profitabilityScore >= 2 ? 'above' : profitabilityScore <= -2 ? 'below' : 'average';
  
  const financialHealth: 'strong' | 'moderate' | 'weak' = 
    healthScore >= 1 ? 'strong' : healthScore <= -1 ? 'weak' : 'moderate';

  return { valuation, profitability, financialHealth, details };
}
