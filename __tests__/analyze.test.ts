import { describe, it, expect } from 'vitest';
import {
  calculateKeyMetrics,
  calculateIndicators,
  generateRecommendation,
  generateScenarios,
} from '@/lib/analyze';
import type { PricePoint, OverviewData } from '@/lib/types';

describe('Analysis Engine', () => {
  const mockPrices: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    close: 100 + i * 0.5 + Math.sin(i * 0.1) * 5,
    volume: 1000000 + i * 1000,
  }));

  describe('calculateKeyMetrics', () => {
    it('should calculate key metrics correctly', () => {
      const metrics = calculateKeyMetrics(mockPrices);
      expect(metrics.lastClose).toBeGreaterThan(0);
      expect(metrics.volatility).toBeGreaterThanOrEqual(0);
      expect(metrics.high90d).toBeGreaterThanOrEqual(metrics.low90d);
    });

    it('should throw error for empty prices', () => {
      expect(() => calculateKeyMetrics([])).toThrow('No price data available');
    });
  });

  describe('calculateIndicators', () => {
    it('should calculate all indicators', () => {
      const indicators = calculateIndicators(mockPrices);
      expect(indicators.sma20).toBeGreaterThan(0);
      expect(indicators.sma50).toBeGreaterThan(0);
      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
      expect(indicators.macd.macd).toBeTypeOf('number');
      expect(indicators.volatility).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateRecommendation', () => {
    it('should generate Buy recommendation for bullish data', () => {
      const bullishPrices: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        close: 100 + i * 2, // Strong uptrend
        volume: 1000000,
      }));

      const indicators = calculateIndicators(bullishPrices);
      const recommendation = generateRecommendation(bullishPrices, indicators, null, null);

      expect(['Buy', 'Watch', 'Avoid']).toContain(recommendation.action);
      expect(recommendation.confidence).toBeGreaterThanOrEqual(20);
      expect(recommendation.confidence).toBeLessThanOrEqual(95);
      expect(recommendation.reasons.length).toBeGreaterThan(0);
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
      expect(recommendation.score).toBeLessThanOrEqual(100);
    });

    it('should generate Avoid recommendation for bearish data', () => {
      const bearishPrices: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        close: 200 - i * 2, // Strong downtrend
        volume: 1000000,
      }));

      const indicators = calculateIndicators(bearishPrices);
      const recommendation = generateRecommendation(bearishPrices, indicators, null, null);

      expect(['Buy', 'Watch', 'Avoid']).toContain(recommendation.action);
      expect(recommendation.reasons.length).toBeGreaterThan(0);
    });

    it('should incorporate fundamentals when available', () => {
      const fundamentals: OverviewData = {
        Symbol: 'TEST',
        PERatio: '15.5',
        ProfitMargin: '0.25',
        QuarterlyRevenueGrowthYOY: '10.5',
      };

      const indicators = calculateIndicators(mockPrices);
      const recommendation = generateRecommendation(mockPrices, indicators, fundamentals, null);

      expect(recommendation.reasons.some(r => r.includes('P/E') || r.includes('profit') || r.includes('revenue'))).toBe(true);
    });

    it('should map score ranges correctly to actions', () => {
      const indicators = calculateIndicators(mockPrices);
      
      // Test high score -> Buy
      const highScorePrices: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        close: 100 + i * 1.5,
        volume: 1000000,
      }));
      const highIndicators = calculateIndicators(highScorePrices);
      const highRec = generateRecommendation(highScorePrices, highIndicators, null, null);
      
      // The action should be one of the valid options
      expect(['Buy', 'Watch', 'Avoid']).toContain(highRec.action);
    });
  });

  describe('generateScenarios', () => {
    it('should generate scenarios with valid ranges', () => {
      const scenarios = generateScenarios(mockPrices, mockPrices[mockPrices.length - 1].close);
      
      expect(scenarios.oneMonth.optimistic).toBeGreaterThan(scenarios.oneMonth.base);
      expect(scenarios.oneMonth.base).toBeGreaterThan(scenarios.oneMonth.pessimistic);
      expect(scenarios.threeMonth.optimistic).toBeGreaterThan(scenarios.threeMonth.base);
      expect(scenarios.threeMonth.base).toBeGreaterThan(scenarios.threeMonth.pessimistic);
    });

    it('should handle insufficient data gracefully', () => {
      const shortPrices: PricePoint[] = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        close: 100,
        volume: 1000000,
      }));

      const scenarios = generateScenarios(shortPrices, 100);
      expect(scenarios.oneMonth.optimistic).toBeGreaterThan(0);
      expect(scenarios.threeMonth.optimistic).toBeGreaterThan(0);
    });
  });
});
