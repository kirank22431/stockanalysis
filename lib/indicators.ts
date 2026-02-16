/**
 * Technical indicator calculations
 * All functions are pure and unit tested
 */

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function computeSMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    return [];
  }

  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function computeRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral if not enough data
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains: number[] = changes.map(c => c > 0 ? c : 0);
  const losses: number[] = changes.map(c => c < 0 ? -c : 0);

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Use Wilder's smoothing method for subsequent values
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function computeMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (prices.length < slowPeriod + signalPeriod) {
    return null;
  }

  // Calculate EMA for fast and slow periods
  const fastEMA = computeEMA(prices, fastPeriod);
  const slowEMA = computeEMA(prices, slowPeriod);

  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return null;
  }

  // Align arrays (slow EMA starts later)
  const startIdx = slowPeriod - fastPeriod;
  const macdLine: number[] = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length + startIdx);

  for (let i = startIdx; i < minLength; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i - startIdx]);
  }

  if (macdLine.length < signalPeriod) {
    return null;
  }

  // Calculate signal line (EMA of MACD line)
  const signalLine = computeEMA(macdLine, signalPeriod);
  if (signalLine.length === 0) {
    return null;
  }

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const histogram = lastMacd - lastSignal;

  return {
    macd: lastMacd,
    signal: lastSignal,
    histogram,
  };
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Helper function for MACD
 */
function computeEMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);

  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function computeVolatility(returns: number[]): number {
  if (returns.length === 0) {
    return 0;
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

/**
 * Calculate returns from prices
 */
export function computeReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculate percentage change
 */
export function computePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
