import type { NormalizedFiling } from '@/lib/providers/sec';

export interface FilingAnalysis {
  recentActivity: {
    filingCount: number;
    last10K?: string;
    last10Q?: string;
    recent8KCount: number;
  };
  keyInsights: string[];
  riskFactors: string[];
  opportunities: string[];
  financialTrends: {
    revenueTrend?: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    profitabilityTrend?: 'improving' | 'declining' | 'stable' | 'unknown';
    notes: string[];
  };
  investmentBriefing: {
    summary: string;
    recommendation: 'Positive' | 'Neutral' | 'Cautionary';
    confidence: number; // 0-100
    keyPoints: string[];
  };
}

/**
 * Analyze SEC filings to generate investment briefing
 */
export function analyzeFilings(
  filings: NormalizedFiling[],
  keyFacts?: { revenue?: number | null; netIncome?: number | null; sharesOutstanding?: number | null }
): FilingAnalysis {
  const insights: string[] = [];
  const riskFactors: string[] = [];
  const opportunities: string[] = [];
  const financialNotes: string[] = [];

  // Analyze recent activity
  const recent10K = filings.find(f => f.type === '10-K');
  const recent10Q = filings.find(f => f.type === '10-Q');
  const recent8Ks = filings.filter(f => f.type === '8-K');
  const recent8KCount = recent8Ks.length;

  // Filing frequency analysis
  if (recent8KCount > 5) {
    insights.push(`High 8-K filing activity (${recent8KCount} recent filings) - indicates significant corporate events or material changes`);
    riskFactors.push('Frequent material events may indicate operational volatility');
  } else if (recent8KCount > 0) {
    insights.push(`Moderate 8-K filing activity (${recent8KCount} recent filings)`);
  }

  // Timeliness of filings
  if (recent10K) {
    const filingDate = new Date(recent10K.date);
    const daysSince = Math.floor((Date.now() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 120) {
      insights.push(`Recent 10-K filed ${daysSince} days ago - current financial data available`);
    } else if (daysSince < 180) {
      insights.push(`10-K filed ${daysSince} days ago - financial data may be somewhat dated`);
    } else {
      riskFactors.push(`10-K is ${daysSince} days old - financial data may be outdated`);
    }
  }

  if (recent10Q) {
    const filingDate = new Date(recent10Q.date);
    const daysSince = Math.floor((Date.now() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 45) {
      insights.push(`Recent 10-Q filed ${daysSince} days ago - quarterly data is current`);
      opportunities.push('Recent quarterly filing suggests active reporting and transparency');
    } else if (daysSince < 90) {
      insights.push(`10-Q filed ${daysSince} days ago - quarterly data available`);
    } else {
      riskFactors.push(`10-Q is ${daysSince} days old - may indicate delayed reporting`);
    }
  }

  // Filing type analysis
  const filingTypes = filings.map(f => f.type);
  const hasProxy = filings.some(f => f.type === 'DEF 14A');
  if (hasProxy) {
    insights.push('Proxy statement (DEF 14A) available - governance and executive compensation data present');
  }

  // Financial trends analysis (if key facts available)
  let revenueTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
  let profitabilityTrend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown';

  if (keyFacts) {
    if (keyFacts.revenue && keyFacts.revenue > 0) {
      financialNotes.push(`Revenue: $${(keyFacts.revenue / 1e9).toFixed(2)}B`);
      revenueTrend = 'stable'; // Would need historical comparison for trend
    }

    if (keyFacts.netIncome !== null && keyFacts.netIncome !== undefined) {
      if (keyFacts.netIncome > 0) {
        financialNotes.push(`Net Income: $${(keyFacts.netIncome / 1e9).toFixed(2)}B (profitable)`);
        profitabilityTrend = 'improving';
        opportunities.push('Company is profitable based on latest financial data');
      } else {
        financialNotes.push(`Net Income: $${(keyFacts.netIncome / 1e9).toFixed(2)}B (loss)`);
        profitabilityTrend = 'declining';
        riskFactors.push('Company reporting net loss - profitability concerns');
      }
    }

    if (keyFacts.sharesOutstanding) {
      financialNotes.push(`Shares Outstanding: ${(keyFacts.sharesOutstanding / 1e9).toFixed(2)}B`);
    }
  }

  // Filing pattern analysis
  const filingDates = filings
    .map(f => new Date(f.date).getTime())
    .sort((a, b) => b - a);
  
  if (filingDates.length > 1) {
    const mostRecent = filingDates[0];
    const secondMostRecent = filingDates[1];
    const daysBetween = Math.floor((mostRecent - secondMostRecent) / (1000 * 60 * 60 * 24));
    
    if (daysBetween < 30) {
      insights.push('Active filing pattern - company regularly updates SEC with new information');
    }
  }

  // Generate investment briefing
  let recommendation: 'Positive' | 'Neutral' | 'Cautionary' = 'Neutral';
  let confidence = 50;
  const keyPoints: string[] = [];

  // Positive signals
  if (recent10K && recent10Q) {
    keyPoints.push('Both annual (10-K) and quarterly (10-Q) reports available');
    confidence += 10;
  }

  if (recent8KCount <= 3) {
    keyPoints.push('Low material event frequency suggests operational stability');
    confidence += 5;
  }

  if (keyFacts?.netIncome && keyFacts.netIncome > 0) {
    keyPoints.push('Company is profitable');
    confidence += 15;
    recommendation = 'Positive';
  }

  if (keyFacts?.revenue && keyFacts.revenue > 1e9) {
    keyPoints.push('Significant revenue base');
    confidence += 5;
  }

  // Cautionary signals
  if (recent8KCount > 8) {
    keyPoints.push('High frequency of material events - monitor closely');
    confidence -= 10;
    recommendation = 'Cautionary';
  }

  if (keyFacts?.netIncome !== null && keyFacts?.netIncome !== undefined && keyFacts.netIncome < 0) {
    keyPoints.push('Company reporting losses');
    confidence -= 20;
    recommendation = 'Cautionary';
  }

  if (!recent10K && !recent10Q) {
    keyPoints.push('No recent financial reports available');
    confidence -= 15;
    recommendation = 'Cautionary';
  }

  // Generate summary
  let summary = '';
  if (recommendation === 'Positive') {
    summary = 'SEC filings indicate a well-regulated company with regular reporting. Financial data suggests positive fundamentals.';
  } else if (recommendation === 'Cautionary') {
    summary = 'SEC filings show some areas of concern. Review recent material events and financial performance carefully.';
  } else {
    summary = 'SEC filings show standard reporting patterns. Review financial statements and recent events for investment decision.';
  }

  confidence = Math.max(30, Math.min(90, confidence));

  return {
    recentActivity: {
      filingCount: filings.length,
      last10K: recent10K?.date,
      last10Q: recent10Q?.date,
      recent8KCount,
    },
    keyInsights: insights,
    riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risk factors identified from filing patterns'],
    opportunities: opportunities.length > 0 ? opportunities : ['Standard filing compliance indicates regulatory adherence'],
    financialTrends: {
      revenueTrend,
      profitabilityTrend,
      notes: financialNotes,
    },
    investmentBriefing: {
      summary,
      recommendation,
      confidence,
      keyPoints,
    },
  };
}
