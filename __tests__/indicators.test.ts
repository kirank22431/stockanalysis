import { describe, it, expect } from 'vitest';
import {
  computeSMA,
  computeRSI,
  computeMACD,
  computeVolatility,
  computeReturns,
} from '@/lib/indicators';

describe('Indicator Calculations', () => {
  describe('computeSMA', () => {
    it('should calculate SMA correctly for valid data', () => {
      const prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
      const sma = computeSMA(prices, 5);
      expect(sma).toHaveLength(6);
      expect(sma[0]).toBeCloseTo(14, 2); // (10+12+14+16+18)/5
      expect(sma[sma.length - 1]).toBeCloseTo(24, 2); // (20+22+24+26+28)/5
    });

    it('should return empty array if not enough data', () => {
      const prices = [10, 12, 14];
      const sma = computeSMA(prices, 5);
      expect(sma).toHaveLength(0);
    });
  });

  describe('computeRSI', () => {
    it('should calculate RSI for trending up prices', () => {
      const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130];
      const rsi = computeRSI(prices, 14);
      expect(rsi).toBeGreaterThan(50);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should calculate RSI for trending down prices', () => {
      const prices = [130, 128, 126, 124, 122, 120, 118, 116, 114, 112, 110, 108, 106, 104, 102, 100];
      const rsi = computeRSI(prices, 14);
      expect(rsi).toBeLessThan(50);
      expect(rsi).toBeGreaterThanOrEqual(0);
    });

    it('should return 50 (neutral) if not enough data', () => {
      const prices = [100, 102, 104];
      const rsi = computeRSI(prices, 14);
      expect(rsi).toBe(50);
    });
  });

  describe('computeMACD', () => {
    it('should calculate MACD for sufficient data', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const macd = computeMACD(prices, 12, 26, 9);
      expect(macd).not.toBeNull();
      if (macd) {
        expect(macd.macd).toBeTypeOf('number');
        expect(macd.signal).toBeTypeOf('number');
        expect(macd.histogram).toBeTypeOf('number');
      }
    });

    it('should return null if not enough data', () => {
      const prices = [100, 102, 104];
      const macd = computeMACD(prices, 12, 26, 9);
      expect(macd).toBeNull();
    });
  });

  describe('computeVolatility', () => {
    it('should calculate volatility correctly', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02, -0.01, 0.01, 0.02];
      const volatility = computeVolatility(returns);
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(1);
    });

    it('should return 0 for empty array', () => {
      const returns: number[] = [];
      const volatility = computeVolatility(returns);
      expect(volatility).toBe(0);
    });

    it('should return 0 for constant returns', () => {
      const returns = [0.01, 0.01, 0.01, 0.01];
      const volatility = computeVolatility(returns);
      expect(volatility).toBe(0);
    });
  });

  describe('computeReturns', () => {
    it('should calculate returns correctly', () => {
      const prices = [100, 110, 105, 115];
      const returns = computeReturns(prices);
      expect(returns).toHaveLength(3);
      expect(returns[0]).toBeCloseTo(0.1, 2); // (110-100)/100
      expect(returns[1]).toBeCloseTo(-0.0455, 2); // (105-110)/110
      expect(returns[2]).toBeCloseTo(0.0952, 2); // (115-105)/105
    });

    it('should return empty array for single price', () => {
      const prices = [100];
      const returns = computeReturns(prices);
      expect(returns).toHaveLength(0);
    });
  });
});
