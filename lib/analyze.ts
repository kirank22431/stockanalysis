import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeVolatility,
  computeReturns,
  computePercentageChange,
} from './indicators';
import type {
  PricePoint,
  IndicatorValues,
  KeyMetrics,
  Recommendation,
  ScenarioOutlook,
  OverviewData,
  NewsSentimentData,
} from './types';

/**
 * Analysis engine that produces recommendations based on technical and fundamental data
 */

export function calculateKeyMetrics(prices: PricePoint[]): KeyMetrics {
  if (prices.length === 0) {
    throw new Error('No price data available');
  }

  const closePrices = prices.map(p => p.close);
  const lastClose = closePrices[closePrices.length - 1];

  // Calculate returns
  const returns = computeReturns(closePrices);
  const returns20d = returns.slice(-20);
  const returns90d = returns.slice(-90);

  // Calculate percentage returns
  const return20d = prices.length >= 21
    ? computePercentageChange(lastClose, closePrices[closePrices.length - 21])
    : 0;
  const return90d = prices.length >= 91
    ? computePercentageChange(lastClose, closePrices[closePrices.length - 91])
    : 0;

  // Calculate volatility (annualized from daily returns)
  const dailyVolatility = computeVolatility(returns90d.length > 0 ? returns90d : returns);
  const volatility = dailyVolatility * Math.sqrt(252) * 100; // Annualized as percentage

  // Find 90-day high and low
  const prices90d = closePrices.slice(-90);
  const high90d = Math.max(...prices90d);
  const low90d = Math.min(...prices90d);

  return {
    lastClose,
    return20d,
    return90d,
    volatility,
    high90d,
    low90d,
  };
}

export function calculateIndicators(prices: PricePoint[]): IndicatorValues {
  const closePrices = prices.map(p => p.close);

  // SMA
  const sma20Values = computeSMA(closePrices, 20);
  const sma50Values = computeSMA(closePrices, 50);
  const sma20 = sma20Values.length > 0 ? sma20Values[sma20Values.length - 1] : closePrices[closePrices.length - 1];
  const sma50 = sma50Values.length > 0 ? sma50Values[sma50Values.length - 1] : closePrices[closePrices.length - 1];

  // RSI
  const rsi = computeRSI(closePrices, 14);

  // MACD
  const macdResult = computeMACD(closePrices, 12, 26, 9);
  const macd = macdResult || { macd: 0, signal: 0, histogram: 0 };

  // Volatility
  const returns = computeReturns(closePrices);
  const volatility = computeVolatility(returns.slice(-60)) * Math.sqrt(252) * 100;

  return {
    sma20,
    sma50,
    rsi,
    macd,
    volatility,
  };
}

export function generateRecommendation(
  prices: PricePoint[],
  indicators: IndicatorValues,
  fundamentals: OverviewData | null,
  newsSentiment: NewsSentimentData | null
): Recommendation {
  let score = 50; // Base score
  const reasons: string[] = [];

  const lastClose = prices[prices.length - 1].close;
  const { sma20, sma50, rsi, macd, volatility } = indicators;

  // Technical Analysis Points
  // Price above moving averages
  if (lastClose > sma20) {
    score += 5;
    reasons.push('Price is above 20-day moving average');
  } else {
    score -= 5;
    reasons.push('Price is below 20-day moving average');
  }

  if (lastClose > sma50) {
    score += 5;
    reasons.push('Price is above 50-day moving average');
  } else {
    score -= 5;
    reasons.push('Price is below 50-day moving average');
  }

  // Moving average crossover
  if (sma20 > sma50) {
    score += 5;
    reasons.push('20-day MA is above 50-day MA (bullish trend)');
  } else {
    score -= 3;
    reasons.push('20-day MA is below 50-day MA');
  }

  // RSI analysis
  if (rsi >= 50 && rsi <= 70) {
    score += 8;
    reasons.push('RSI indicates healthy momentum');
  } else if (rsi > 75) {
    score -= 10;
    reasons.push('RSI suggests overbought conditions');
  } else if (rsi < 35) {
    score -= 8;
    reasons.push('RSI indicates weak momentum');
  } else if (rsi < 50) {
    score -= 3;
    reasons.push('RSI is below neutral');
  }

  // MACD analysis
  if (macd.histogram > 0) {
    score += 5;
    reasons.push('MACD histogram is positive');
  } else {
    score -= 3;
    reasons.push('MACD histogram is negative');
  }

  // Volatility analysis (using quartiles - simplified)
  // Assume high volatility if > 30% annualized
  if (volatility > 30) {
    score -= 8;
    reasons.push('High volatility detected');
  } else if (volatility < 15) {
    score += 3;
    reasons.push('Low volatility environment');
  }

  // Drawdown analysis
  const metrics = calculateKeyMetrics(prices);
  const drawdown = computePercentageChange(lastClose, metrics.high90d);
  if (drawdown < -15) {
    score -= 10;
    reasons.push(`Significant drawdown from 90-day high (${drawdown.toFixed(1)}%)`);
  }

  // Fundamental Analysis
  if (fundamentals) {
    // PE Ratio
    const pe = parseFloat(fundamentals.PERatio || fundamentals.TrailingPE || '0');
    if (pe > 0 && pe < 80) {
      if (pe > 0 && pe < 25) {
        score += 5;
        reasons.push('Reasonable P/E ratio');
      } else if (pe > 25 && pe < 50) {
        score += 2;
        reasons.push('Moderate P/E ratio');
      }
    } else if (pe >= 80) {
      score -= 8;
      reasons.push('Very high P/E ratio');
    }

    // Profit Margin
    const profitMargin = parseFloat(fundamentals.ProfitMargin || '0');
    if (profitMargin > 0) {
      score += 5;
      reasons.push('Positive profit margin');
    } else if (profitMargin < 0) {
      score -= 5;
      reasons.push('Negative profit margin');
    }

    // Revenue Growth
    const revenueGrowth = parseFloat(fundamentals.QuarterlyRevenueGrowthYOY || '0');
    if (revenueGrowth > 0) {
      score += 5;
      reasons.push('Positive revenue growth');
    } else if (revenueGrowth < -10) {
      score -= 5;
      reasons.push('Declining revenue');
    }
  }

  // News Sentiment
  if (newsSentiment && newsSentiment.feed && newsSentiment.feed.length > 0) {
    const sentimentScores = newsSentiment.feed
      .map(article => article.overall_sentiment_score || 0)
      .filter(score => score !== 0);

    if (sentimentScores.length > 0) {
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      if (avgSentiment > 0.1) {
        score += 5;
        reasons.push('Positive news sentiment');
      } else if (avgSentiment < -0.1) {
        score -= 5;
        reasons.push('Negative news sentiment');
      }
    }
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine action and confidence
  let action: 'Buy' | 'Watch' | 'Avoid';
  let confidence: number;

  if (score >= 70) {
    action = 'Buy';
    confidence = Math.min(95, 60 + (score - 70) * 1.17); // Scale 70-100 to 60-95
  } else if (score >= 50) {
    action = 'Watch';
    confidence = 40 + (score - 50) * 1.0; // Scale 50-69 to 40-59
  } else {
    action = 'Avoid';
    confidence = Math.max(20, 50 - (50 - score) * 0.6); // Scale 0-49 to 20-50
  }

  // Adjust confidence based on data completeness
  let dataCompleteness = 1.0;
  if (!fundamentals) dataCompleteness -= 0.15;
  if (!newsSentiment) dataCompleteness -= 0.1;
  if (prices.length < 100) dataCompleteness -= 0.1;

  confidence = confidence * dataCompleteness;
  confidence = Math.max(20, Math.min(95, Math.round(confidence)));

  return {
    action,
    confidence,
    reasons,
    score,
  };
}

export function generateScenarios(
  prices: PricePoint[],
  lastClose: number
): ScenarioOutlook {
  if (prices.length < 60) {
    // Not enough data, return neutral scenarios
    return {
      oneMonth: {
        optimistic: lastClose * 1.05,
        base: lastClose,
        pessimistic: lastClose * 0.95,
      },
      threeMonth: {
        optimistic: lastClose * 1.10,
        base: lastClose,
        pessimistic: lastClose * 0.90,
      },
    };
  }

  // Calculate returns from last 60 trading days
  const closePrices = prices.map(p => p.close);
  const recentPrices = closePrices.slice(-60);
  const returns = computeReturns(recentPrices);

  // Calculate mean and standard deviation of daily returns
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Project for 1 month (21 trading days) and 3 months (63 trading days)
  const days1Month = 21;
  const days3Month = 63;

  // Base case: mean return
  const base1Month = lastClose * Math.pow(1 + meanReturn, days1Month);
  const base3Month = lastClose * Math.pow(1 + meanReturn, days3Month);

  // Optimistic: mean + 1 std dev
  const optimistic1Month = lastClose * Math.pow(1 + meanReturn + stdDev, days1Month);
  const optimistic3Month = lastClose * Math.pow(1 + meanReturn + stdDev, days3Month);

  // Pessimistic: mean - 1 std dev
  const pessimistic1Month = lastClose * Math.pow(1 + meanReturn - stdDev, days1Month);
  const pessimistic3Month = lastClose * Math.pow(1 + meanReturn - stdDev, days3Month);

  return {
    oneMonth: {
      optimistic: optimistic1Month,
      base: base1Month,
      pessimistic: pessimistic1Month,
    },
    threeMonth: {
      optimistic: optimistic3Month,
      base: base3Month,
      pessimistic: pessimistic3Month,
    },
  };
}
