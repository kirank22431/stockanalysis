import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { getSectorPerformance } from '@/lib/providers/yahoo';
import { getIndustryMetrics, getAllIndustryMetrics } from '@/lib/providers/damodaran';

export async function GET(request: NextRequest) {
  // Check cache
  const cacheKey = 'market-overview';
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const sectorResult = await getSectorPerformance();

    if (sectorResult.error) {
      return NextResponse.json(
        {
          error: sectorResult.error.error,
        },
        { status: 500 }
      );
    }

    // Enhance sectors with Damodaran industry metrics
    const sectorsWithMetrics = (sectorResult.data || []).map((sector: { sector: string; performance: number }) => {
      const industryMetrics = getIndustryMetrics(sector.sector);
      return {
        ...sector,
        industryMetrics: industryMetrics || null,
      };
    });

    // Get all industry metrics for comparison table
    const allIndustryMetrics = getAllIndustryMetrics();

    const overview = {
      generatedAt: new Date().toISOString(),
      sectors: sectorsWithMetrics,
      industryBenchmarks: allIndustryMetrics,
      dataSource: {
        name: 'Aswath Damodaran - NYU Stern',
        url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html',
        note: 'Industry metrics based on Damodaran\'s valuation methodology and representative industry averages',
      },
      macro: {
        note: 'Macro indicators would require additional data sources (e.g., FRED API for economic data)',
      },
    };

    // Cache for 15 minutes
    setCache(cacheKey, overview);

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
