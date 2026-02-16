import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { getStocksForSector } from '@/lib/data/sectorStocks';
import { getStockPriceHistory } from '@/lib/providers/yahoo';
import { getCompanyProfile, getKeyMetrics } from '@/lib/providers/fmp';
import { buildStockReport } from '@/lib/analysis/reportBuilder';

interface StockAnalysis {
  symbol: string;
  name: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  confidence: number;
  grahamScore?: number;
  grahamReasoning?: string[];
  strategyFit?: 'defensive' | 'enterprising' | 'both';
  keyMetrics?: {
    peRatio?: number;
    dividendYield?: number;
    debtToEquity?: number;
    currentRatio?: number;
    marketCap?: number;
  };
}

/**
 * Evaluate stock against Graham's criteria
 */
function evaluateGrahamCriteria(
  profile: any,
  keyMetrics: any,
  strategy: 'defensive' | 'enterprising'
): { score: number; reasoning: string[]; strategyFit: 'defensive' | 'enterprising' | 'both' } {
  let score = 0;
  const reasoning: string[] = [];
  let defensiveFit = false;
  let enterprisingFit = false;

  const peRatio = keyMetrics?.peRatio;
  const dividendYield = keyMetrics?.dividendYield || 0;
  const debtToEquity = keyMetrics?.debtToEquity;
  const currentRatio = keyMetrics?.currentRatio;
  const marketCap = keyMetrics?.marketCap || profile?.mktCap || 0;
  const isLargeCap = marketCap >= 10_000_000_000; // $10B+

  // P/E Ratio evaluation (Graham's key metric)
  if (peRatio && peRatio > 0) {
    if (peRatio < 15) {
      score += 20;
      reasoning.push(`Excellent P/E ratio of ${peRatio.toFixed(1)} - well below Graham's preferred range`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (peRatio < 25) {
      score += 15;
      reasoning.push(`Good P/E ratio of ${peRatio.toFixed(1)} - within reasonable range`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (peRatio < 40) {
      score += 5;
      reasoning.push(`Moderate P/E ratio of ${peRatio.toFixed(1)} - acceptable for growth`);
      enterprisingFit = true;
    } else {
      score -= 10;
      reasoning.push(`High P/E ratio of ${peRatio.toFixed(1)} - may be overvalued`);
    }
  }

  // Dividend Yield (important for defensive investors)
  if (dividendYield > 0) {
    if (dividendYield >= 3) {
      score += 15;
      reasoning.push(`Strong dividend yield of ${(dividendYield * 100).toFixed(2)}% - provides income`);
      defensiveFit = true;
    } else if (dividendYield >= 1.5) {
      score += 10;
      reasoning.push(`Moderate dividend yield of ${(dividendYield * 100).toFixed(2)}%`);
      defensiveFit = true;
    } else if (dividendYield > 0) {
      score += 5;
      reasoning.push(`Pays dividends (${(dividendYield * 100).toFixed(2)}%)`);
    }
  }

  // Market Cap / Size (Graham prefers large, prominent companies)
  if (isLargeCap) {
    score += 15;
    reasoning.push(`Large-cap company ($${(marketCap / 1_000_000_000).toFixed(1)}B market cap) - Graham's preferred size`);
    defensiveFit = true;
    enterprisingFit = true;
  } else if (marketCap >= 2_000_000_000) {
    score += 8;
    reasoning.push(`Mid-cap company ($${(marketCap / 1_000_000_000).toFixed(1)}B market cap)`);
    enterprisingFit = true;
  }

  // Financial Strength - Debt to Equity
  if (debtToEquity !== undefined) {
    if (debtToEquity < 0.5) {
      score += 15;
      reasoning.push(`Strong balance sheet - low debt-to-equity ratio of ${debtToEquity.toFixed(2)}`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (debtToEquity < 1.0) {
      score += 10;
      reasoning.push(`Moderate debt levels - debt-to-equity of ${debtToEquity.toFixed(2)}`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (debtToEquity < 2.0) {
      score += 5;
      reasoning.push(`Higher debt levels - debt-to-equity of ${debtToEquity.toFixed(2)}`);
      enterprisingFit = true;
    } else {
      score -= 5;
      reasoning.push(`High debt levels - debt-to-equity of ${debtToEquity.toFixed(2)}`);
    }
  }

  // Current Ratio (liquidity)
  if (currentRatio !== undefined) {
    if (currentRatio >= 2.0) {
      score += 10;
      reasoning.push(`Strong liquidity - current ratio of ${currentRatio.toFixed(2)}`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (currentRatio >= 1.5) {
      score += 5;
      reasoning.push(`Adequate liquidity - current ratio of ${currentRatio.toFixed(2)}`);
      defensiveFit = true;
      enterprisingFit = true;
    } else if (currentRatio < 1.0) {
      score -= 5;
      reasoning.push(`Weak liquidity - current ratio of ${currentRatio.toFixed(2)}`);
    }
  }

  // Strategy-specific criteria
  if (strategy === 'defensive') {
    // Defensive: Prefer established, dividend-paying, low volatility
    if (isLargeCap && dividendYield > 0 && peRatio && peRatio < 25) {
      score += 10;
      reasoning.push('Meets defensive investor criteria: large-cap, dividend-paying, reasonable valuation');
    }
  } else {
    // Enterprising: Can accept more growth, but still quality-focused
    if (peRatio && peRatio < 30 && (isLargeCap || marketCap >= 2_000_000_000)) {
      score += 10;
      reasoning.push('Meets enterprising investor criteria: quality company with growth potential');
    }
  }

  const strategyFit = defensiveFit && enterprisingFit ? 'both' : 
                     defensiveFit ? 'defensive' : 
                     enterprisingFit ? 'enterprising' : 'both';

  return { score: Math.max(0, Math.min(100, score)), reasoning, strategyFit };
}

/**
 * Analyze a stock quickly for portfolio recommendations with Graham criteria
 */
async function quickAnalyzeStock(
  symbol: string,
  strategy: 'defensive' | 'enterprising' = 'defensive'
): Promise<StockAnalysis | null> {
  try {
    const cacheKey = `quick-analysis:${symbol}:${strategy}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return cached as StockAnalysis;
    }

    const [priceResult, profileResult, keyMetricsResult] = await Promise.all([
      getStockPriceHistory(symbol),
      getCompanyProfile(symbol),
      getKeyMetrics(symbol),
    ]);

    if (priceResult.error || !priceResult.data || priceResult.data.length === 0) {
      return null;
    }

    const report = buildStockReport({
      symbol,
      prices: priceResult.data,
      companyProfile: profileResult.data || undefined,
      keyMetrics: keyMetricsResult.data || undefined,
      incomeStatements: undefined,
      balanceSheets: undefined,
      cashFlows: undefined,
      earnings: undefined,
      filings: undefined,
      keyFacts: undefined,
      sources: {},
    });

    // Evaluate Graham criteria
    const grahamEval = evaluateGrahamCriteria(
      profileResult.data,
      keyMetricsResult.data?.[0],
      strategy
    );

    const keyMetrics = keyMetricsResult.data?.[0];

    const analysis: StockAnalysis = {
      symbol,
      name: profileResult.data?.companyName || symbol,
      recommendation: report.summary.recommendation,
      confidence: report.summary.confidence,
      grahamScore: grahamEval.score,
      grahamReasoning: grahamEval.reasoning,
      strategyFit: grahamEval.strategyFit,
      keyMetrics: {
        peRatio: keyMetrics?.peRatio,
        dividendYield: keyMetrics?.dividendYield,
        debtToEquity: keyMetrics?.debtToEquity,
        currentRatio: keyMetrics?.currentRatio,
        marketCap: keyMetrics?.marketCap || profileResult.data?.mktCap,
      },
    };

    setCache(cacheKey, analysis); // Cache for default TTL (15 minutes)
    return analysis;
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

/**
 * Get top stocks from a sector based on strategy and Graham criteria
 */
async function getTopStocksFromSector(
  sector: string,
  count: number,
  strategy: 'defensive' | 'enterprising',
  minConfidence: number = 60
): Promise<StockAnalysis[]> {
  const stocks = getStocksForSector(sector);
  const analyses = await Promise.all(
    stocks.slice(0, Math.min(count * 3, stocks.length)).map(symbol => 
      quickAnalyzeStock(symbol, strategy)
    )
  );

  // Filter and sort based on strategy
  const validStocks = analyses.filter((a): a is StockAnalysis => {
    if (!a) return false;
    
    // Must have Buy recommendation or high confidence
    if (a.recommendation !== 'Buy' && a.confidence < minConfidence) {
      return false;
    }

    // Strategy-specific filtering
    if (strategy === 'defensive') {
      // Defensive: Prefer stocks that fit defensive criteria
      return a.strategyFit === 'defensive' || a.strategyFit === 'both';
    } else {
      // Enterprising: Can accept both, but prefer enterprising fit
      return a.strategyFit === 'enterprising' || a.strategyFit === 'both' || a.strategyFit === 'defensive';
    }
  });

  // Sort by combined score (Graham score + confidence)
  const combinedScore = (stock: StockAnalysis) => {
    const grahamWeight = 0.4;
    const confidenceWeight = 0.6;
    return (stock.grahamScore || 0) * grahamWeight + stock.confidence * confidenceWeight;
  };

  return validStocks
    .sort((a, b) => combinedScore(b) - combinedScore(a))
    .slice(0, count);
}

/**
 * Generate Defensive Investor portfolio allocation (Graham's approach)
 * Based on "The Intelligent Investor" - Conservative, minimal effort strategy
 */
function generateDefensiveAllocation(amount: number, investorAge?: number): any {
  // Graham's Defensive Investor: 50-50 or 75-25 stock/bond split
  // For younger investors (< 40), can go 75% stocks / 25% bonds
  // For older investors (>= 40), use 50% stocks / 50% bonds
  const stockPercentage = investorAge && investorAge < 40 ? 75 : 50;
  const bondPercentage = 100 - stockPercentage;

  const allocations = [
    {
      category: 'Large-Cap Quality Stocks',
      percentage: stockPercentage * 0.6, // 60% of stock allocation
      rationale: 'Graham recommends large, prominent companies with strong financial positions. Focus on established companies with consistent earnings and dividends.',
      sectors: ['Technology', 'Healthcare', 'Consumer Defensive'],
      grahamPrinciple: 'Large, prominent companies with strong financial position',
    },
    {
      category: 'Value Stocks (Undervalued)',
      percentage: stockPercentage * 0.4, // 40% of stock allocation
      rationale: 'Graham\'s value investing: Look for companies trading below intrinsic value with margin of safety. Focus on reasonable P/E ratios and strong fundamentals.',
      sectors: ['Financial Services', 'Industrials', 'Basic Materials'],
      grahamPrinciple: 'Margin of safety - buy below intrinsic value',
    },
    {
      category: 'Bonds / Fixed Income',
      percentage: bondPercentage,
      rationale: 'Graham recommends bonds for stability and income. For defensive investors, bonds provide capital preservation and regular income.',
      sectors: [],
      grahamPrinciple: 'Capital preservation and income generation',
    },
  ];

  return allocations.map(allocation => ({
    ...allocation,
    amount: (amount * allocation.percentage) / 100,
    stocks: [], // Will be populated
  }));
}

/**
 * Generate Enterprising Investor portfolio allocation (Graham's approach)
 * Based on "The Intelligent Investor" - More active, research-intensive strategy
 */
function generateEnterprisingAllocation(amount: number): any {
  // Enterprising investors can allocate more to stocks (up to 100%)
  // But must do thorough research and maintain diversification
  const allocations = [
    {
      category: 'Quality Growth Stocks',
      percentage: 40,
      rationale: 'Graham\'s enterprising approach: Focus on companies with strong growth potential but maintain quality standards. Look for established companies with competitive advantages.',
      sectors: ['Technology', 'Healthcare', 'Communication Services'],
      grahamPrinciple: 'Quality companies with competitive advantages',
    },
    {
      category: 'Value Stocks (Deep Value)',
      percentage: 30,
      rationale: 'Graham\'s value investing core: Seek undervalued companies with strong fundamentals. Look for low P/E, strong balance sheets, and consistent earnings.',
      sectors: ['Financial Services', 'Industrials', 'Basic Materials'],
      grahamPrinciple: 'Deep value - significant margin of safety',
    },
    {
      category: 'Dividend Aristocrats',
      percentage: 20,
      rationale: 'Companies with consistent dividend growth. Graham emphasizes companies that have increased dividends for many years, indicating financial strength.',
      sectors: ['Consumer Defensive', 'Utilities', 'Real Estate'],
      grahamPrinciple: 'Consistent dividend payments indicate financial strength',
    },
    {
      category: 'Bonds / Cash Reserve',
      percentage: 10,
      rationale: 'Maintain some fixed income for stability and opportunities. Graham recommends keeping cash reserves for buying opportunities during market downturns.',
      sectors: [],
      grahamPrinciple: 'Reserve for opportunities and capital preservation',
    },
  ];

  return allocations.map(allocation => ({
    ...allocation,
    amount: (amount * allocation.percentage) / 100,
    stocks: [], // Will be populated
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amountParam = searchParams.get('amount');
  const investorType = searchParams.get('type') || 'defensive'; // 'defensive' or 'enterprising'
  const investorAgeParam = searchParams.get('age');

  if (!amountParam) {
    return NextResponse.json(
      { error: 'Amount parameter is required' },
      { status: 400 }
    );
  }

  const amount = parseFloat(amountParam);
  const investorAge = investorAgeParam ? parseInt(investorAgeParam) : undefined;

  if (isNaN(amount) || amount < 100) {
    return NextResponse.json(
      { error: 'Amount must be at least $100' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `portfolio:${investorType}:${investorAge || 'default'}:${Math.floor(amount / 1000)}k`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Generate allocations based on Graham's principles
    const defensiveAllocation = generateDefensiveAllocation(amount, investorAge);
    const enterprisingAllocation = generateEnterprisingAllocation(amount);

    // Populate stocks for each allocation category
    const allAllocations = investorType === 'enterprising' 
      ? enterprisingAllocation 
      : defensiveAllocation;

    for (const allocation of allAllocations) {
      if (allocation.sectors.length > 0 && allocation.stocks.length === 0) {
        // Graham recommends 10-30 stocks for proper diversification
        // For each category, get 2-3 stocks per sector
        const stocksPerSector = Math.max(2, Math.min(3, Math.floor(30 / allocation.sectors.length)));
        const allStocks: StockAnalysis[] = [];

        for (const sector of allocation.sectors.slice(0, 3)) {
          const sectorStocks = await getTopStocksFromSector(
            sector, 
            stocksPerSector, 
            investorType as 'defensive' | 'enterprising',
            60
          );
          allStocks.push(...sectorStocks);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Sort by confidence and take top stocks
        const topStocks = allStocks
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, Math.min(5, allStocks.length)); // Limit to 5 stocks per category
        
        // Distribute allocation amount across stocks
        if (topStocks.length > 0) {
          const perStockPercentage = 100 / topStocks.length;
          allocation.stocks = topStocks.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name,
            percentage: perStockPercentage,
            amount: (allocation.amount * perStockPercentage) / 100,
            recommendation: stock.recommendation,
            confidence: stock.confidence,
            grahamScore: stock.grahamScore,
            grahamReasoning: stock.grahamReasoning,
            strategyFit: stock.strategyFit,
            keyMetrics: stock.keyMetrics,
          }));
        }
      }
    }

    // Determine risk levels based on Graham's principles
    const defensiveRisk = 'Low';
    const enterprisingRisk = amount < 10000 ? 'Medium' : 'High';

    // Generate recommendations based on "The Intelligent Investor"
    const grahamPrinciples = [
      'Maintain a margin of safety: Only invest in companies with strong fundamentals trading at reasonable valuations',
      investorType === 'defensive'
        ? 'As a Defensive Investor: Focus on large, prominent companies with consistent earnings and dividends'
        : 'As an Enterprising Investor: Do thorough research on each company before investing',
      'Diversify across 10-30 stocks minimum to reduce individual company risk',
      'Rebalance your portfolio annually to maintain your target allocation (Graham recommends annual rebalancing)',
      'Use dollar-cost averaging: Invest regularly over time rather than all at once',
      'Think long-term: Graham emphasizes investing for the long term, not speculation',
      'Avoid over-concentration: No single stock should exceed 5-10% of your portfolio',
      'Focus on quality: Invest in companies with strong financial positions, consistent earnings, and reasonable P/E ratios',
    ];

    const result = {
      totalAmount: amount,
      investorType: investorType === 'enterprising' ? 'Enterprising' : 'Defensive',
      defensive: {
        allocation: defensiveAllocation,
        riskLevel: defensiveRisk,
        expectedReturn: investorAge && investorAge < 40 ? '6-9% annually' : '5-8% annually',
        timeHorizon: 'Long-term (5+ years)',
        description: 'Graham\'s Defensive Investor approach: Conservative strategy requiring minimal effort. Focus on large, quality companies and bonds.',
      },
      enterprising: {
        allocation: enterprisingAllocation,
        riskLevel: enterprisingRisk,
        expectedReturn: '8-12% annually',
        timeHorizon: 'Long-term (5+ years)',
        description: 'Graham\'s Enterprising Investor approach: More active strategy requiring research. Can achieve higher returns with careful stock selection.',
      },
      recommendations: grahamPrinciples,
      grahamPrinciples: {
        marginOfSafety: 'Always buy below intrinsic value with a margin of safety',
        diversification: 'Hold 10-30 stocks across different sectors',
        quality: 'Focus on large, established companies with strong financial positions',
        longTerm: 'Invest for the long term, not speculation',
        rebalancing: 'Rebalance annually to maintain target allocation',
      },
      generatedAt: new Date().toISOString(),
    };

    // Cache for 1 hour
    setCache(cacheKey, result, 3600000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating portfolio plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
