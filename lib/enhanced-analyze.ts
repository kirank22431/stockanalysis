import type {
  PricePoint,
  IndicatorValues,
  KeyMetrics,
  OverviewData,
  NewsSentimentData,
  DetailedRecommendation,
  ProsCons,
  RiskFactors,
  EarningsData,
  IncomeStatement,
} from '@/lib/types';
import {
  calculateKeyMetrics,
  calculateIndicators,
  generateScenarios,
} from './analyze';

/**
 * Enhanced analysis engine with detailed pros/cons, risk factors, and comprehensive recommendations
 */

export function generateDetailedRecommendation(
  prices: PricePoint[],
  indicators: IndicatorValues,
  fundamentals: OverviewData | null,
  newsSentiment: NewsSentimentData | null,
  earnings: EarningsData[] | null,
  incomeStatements: IncomeStatement[] | null
): DetailedRecommendation {
  const pros: string[] = [];
  const cons: string[] = [];
  const bullishIndicators: string[] = [];
  const bearishIndicators: string[] = [];
  let score = 50; // Base score
  const reasons: string[] = [];

  const lastClose = prices[prices.length - 1].close;
  const { sma20 = lastClose, sma50 = lastClose, rsi, macd, volatility } = indicators;

  // Technical Analysis
  if (lastClose > sma20) {
    score += 5;
    pros.push('Price is above 20-day moving average');
    bullishIndicators.push('Price above SMA20');
  } else {
    score -= 5;
    cons.push('Price is below 20-day moving average');
    bearishIndicators.push('Price below SMA20');
  }

  if (lastClose > sma50) {
    score += 5;
    pros.push('Price is above 50-day moving average');
    bullishIndicators.push('Price above SMA50');
  } else {
    score -= 5;
    cons.push('Price is below 50-day moving average');
    bearishIndicators.push('Price below SMA50');
  }

  if (sma20 > sma50) {
    score += 5;
    pros.push('Bullish moving average crossover (20-day above 50-day)');
    bullishIndicators.push('SMA20 > SMA50 (Golden Cross)');
  } else {
    score -= 3;
    cons.push('Bearish moving average pattern (20-day below 50-day)');
    bearishIndicators.push('SMA20 < SMA50');
  }

  // RSI Analysis
  if (rsi >= 50 && rsi <= 70) {
    score += 8;
    pros.push('RSI indicates healthy momentum');
    bullishIndicators.push('RSI in optimal range (50-70)');
  } else if (rsi > 75) {
    score -= 10;
    cons.push('RSI suggests overbought conditions');
    bearishIndicators.push('RSI overbought (>75)');
  } else if (rsi < 35) {
    score -= 8;
    cons.push('RSI indicates weak momentum');
    bearishIndicators.push('RSI oversold (<35)');
  } else if (rsi < 50) {
    score -= 3;
    cons.push('RSI is below neutral');
  }

  // MACD Analysis
  if (macd.histogram > 0) {
    score += 5;
    pros.push('MACD histogram is positive (bullish momentum)');
    bullishIndicators.push('MACD histogram positive');
  } else {
    score -= 3;
    cons.push('MACD histogram is negative');
    bearishIndicators.push('MACD histogram negative');
  }

  // Volatility Analysis
  if (volatility > 30) {
    score -= 8;
    cons.push('High volatility detected (increased risk)');
  } else if (volatility < 15) {
    score += 3;
    pros.push('Low volatility environment (stable)');
  }

  // Fundamental Analysis
  if (fundamentals) {
    const pe = parseFloat(fundamentals.PERatio || fundamentals.TrailingPE || '0');
    if (pe > 0 && pe < 25) {
      score += 5;
      pros.push(`Reasonable P/E ratio of ${pe.toFixed(1)}`);
    } else if (pe >= 25 && pe < 50) {
      score += 2;
      pros.push(`Moderate P/E ratio of ${pe.toFixed(1)}`);
    } else if (pe >= 80) {
      score -= 8;
      cons.push(`Very high P/E ratio of ${pe.toFixed(1)} (overvalued)`);
    }

    const profitMargin = parseFloat(fundamentals.ProfitMargin || '0');
    if (profitMargin > 0.15) {
      score += 8;
      pros.push(`Strong profit margin of ${(profitMargin * 100).toFixed(1)}%`);
    } else if (profitMargin > 0) {
      score += 5;
      pros.push(`Positive profit margin of ${(profitMargin * 100).toFixed(1)}%`);
    } else if (profitMargin < 0) {
      score -= 10;
      cons.push(`Negative profit margin of ${(profitMargin * 100).toFixed(1)}%`);
    }

    const revenueGrowth = parseFloat(fundamentals.QuarterlyRevenueGrowthYOY || '0');
    if (revenueGrowth > 10) {
      score += 8;
      pros.push(`Strong revenue growth of ${revenueGrowth.toFixed(1)}% YoY`);
    } else if (revenueGrowth > 0) {
      score += 5;
      pros.push(`Positive revenue growth of ${revenueGrowth.toFixed(1)}% YoY`);
    } else if (revenueGrowth < -10) {
      score -= 10;
      cons.push(`Declining revenue of ${revenueGrowth.toFixed(1)}% YoY`);
    }

    const marketCap = parseFloat(fundamentals.MarketCapitalization || '0');
    if (marketCap > 1e12) {
      pros.push('Large-cap stock (more stable)');
    } else if (marketCap < 300e6) {
      cons.push('Small-cap stock (higher risk)');
    }
  }

  // Earnings Analysis
  if (earnings && earnings.length > 0) {
    const recentEarnings = earnings.slice(0, 4);
    const beats = recentEarnings.filter(e => 
      e.eps !== null && e.epsEstimated !== null && e.eps > e.epsEstimated
    ).length;
    
    if (beats >= 3) {
      score += 10;
      pros.push(`Strong earnings track record: ${beats}/${recentEarnings.length} recent beats`);
      bullishIndicators.push('Consistent earnings beats');
    } else if (beats === 0 && recentEarnings.length >= 2) {
      score -= 10;
      cons.push('Consistent earnings misses');
      bearishIndicators.push('Earnings misses');
    }

    // Check earnings growth trend
    const epsValues = recentEarnings
      .map(e => e.eps)
      .filter((e): e is number => e !== null)
      .slice(0, 4);
    
    if (epsValues.length >= 2) {
      const growth = ((epsValues[0] - epsValues[epsValues.length - 1]) / Math.abs(epsValues[epsValues.length - 1])) * 100;
      if (growth > 20) {
        score += 8;
        pros.push(`Strong EPS growth trend: ${growth.toFixed(1)}%`);
      } else if (growth < -20) {
        score -= 8;
        cons.push(`Declining EPS trend: ${growth.toFixed(1)}%`);
      }
    }
  }

  // Income Statement Analysis
  if (incomeStatements && incomeStatements.length > 0) {
    const latest = incomeStatements[0];
    const previous = incomeStatements[1];

    if (previous) {
      const revenueGrowth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
      if (revenueGrowth > 15) {
        score += 8;
        pros.push(`Strong revenue growth: ${revenueGrowth.toFixed(1)}%`);
      } else if (revenueGrowth < -10) {
        score -= 8;
        cons.push(`Revenue decline: ${revenueGrowth.toFixed(1)}%`);
      }

      const profitMargin = (latest.netIncome / latest.revenue) * 100;
      if (profitMargin > 20) {
        score += 5;
        pros.push(`Excellent profit margin: ${profitMargin.toFixed(1)}%`);
      } else if (profitMargin < 0) {
        score -= 10;
        cons.push(`Negative profit margin: ${profitMargin.toFixed(1)}%`);
      }
    }
  }

  // News Sentiment
  if (newsSentiment && newsSentiment.feed && newsSentiment.feed.length > 0) {
    const sentimentScores = newsSentiment.feed
      .map(article => article.overall_sentiment_score || 0)
      .filter(score => score !== 0);

    if (sentimentScores.length > 0) {
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      if (avgSentiment > 0.2) {
        score += 5;
        pros.push('Very positive news sentiment');
        bullishIndicators.push('Positive news sentiment');
      } else if (avgSentiment > 0.1) {
        score += 3;
        pros.push('Positive news sentiment');
      } else if (avgSentiment < -0.2) {
        score -= 8;
        cons.push('Very negative news sentiment');
        bearishIndicators.push('Negative news sentiment');
      } else if (avgSentiment < -0.1) {
        score -= 5;
        cons.push('Negative news sentiment');
      }
    }
  }

  // Risk Factors
  const riskFactors: RiskFactors = {
    level: 'Medium',
    factors: [],
  };

  if (volatility > 40) {
    riskFactors.level = 'High';
    riskFactors.factors.push('Very high volatility');
  } else if (volatility < 15) {
    riskFactors.level = 'Low';
  }

  if (rsi > 80 || rsi < 20) {
    riskFactors.factors.push('Extreme RSI levels');
  }

  if (fundamentals) {
    const pe = parseFloat(fundamentals.PERatio || '0');
    if (pe > 100) {
      riskFactors.level = 'High';
      riskFactors.factors.push('Extremely high P/E ratio');
    }

    const debtToEquity = parseFloat(fundamentals.EVToEBITDA || '0');
    if (debtToEquity > 10) {
      riskFactors.factors.push('High debt levels');
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine action and confidence
  let action: 'Buy' | 'Watch' | 'Avoid';
  let confidence: number;

  if (score >= 70) {
    action = 'Buy';
    confidence = Math.min(95, 60 + (score - 70) * 1.17);
  } else if (score >= 50) {
    action = 'Watch';
    confidence = 40 + (score - 50) * 1.0;
  } else {
    action = 'Avoid';
    confidence = Math.max(20, 50 - (50 - score) * 0.6);
  }

  // Adjust confidence based on data completeness
  let dataCompleteness = 1.0;
  if (!fundamentals) dataCompleteness -= 0.15;
  if (!newsSentiment) dataCompleteness -= 0.1;
  if (!earnings) dataCompleteness -= 0.1;
  if (!incomeStatements) dataCompleteness -= 0.1;
  if (prices.length < 100) dataCompleteness -= 0.1;

  confidence = confidence * dataCompleteness;
  confidence = Math.max(20, Math.min(95, Math.round(confidence)));

  // Generate price target
  const metrics = calculateKeyMetrics(prices);
  const scenarios = generateScenarios(prices, metrics.lastClose);
  const priceTarget = {
    optimistic: scenarios.threeMonth.optimistic,
    base: scenarios.threeMonth.base,
    pessimistic: scenarios.threeMonth.pessimistic,
    timeframe: '3 months',
  };

  return {
    action,
    confidence,
    reasons,
    score,
    pros,
    cons,
    riskFactors,
    bullishIndicators,
    bearishIndicators,
    priceTarget,
  };
}
