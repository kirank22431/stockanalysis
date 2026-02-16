/**
 * Popular stocks by sector for analysis
 * This is a curated list of well-known stocks in each sector
 */
export const SECTOR_STOCKS: Record<string, string[]> = {
  'Technology': [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'CSCO', 'IBM', 'QCOM'
  ],
  'Financial Services': [
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW',
    'AXP', 'COF', 'USB', 'PNC', 'TFC', 'BK', 'STT', 'MTB'
  ],
  'Healthcare': [
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY',
    'AMGN', 'GILD', 'CVS', 'CI', 'HUM', 'ELV', 'BSX', 'SYK'
  ],
  'Consumer Cyclical': [
    'AMZN', 'TSLA', 'HD', 'NKE', 'SBUX', 'MCD', 'LOW', 'TJX',
    'BKNG', 'CMG', 'TGT', 'BBY', 'F', 'GM', 'DHI', 'LEN'
  ],
  'Communication Services': [
    'GOOGL', 'META', 'NFLX', 'DIS', 'VZ', 'T', 'CMCSA', 'CHTR',
    'EA', 'TTWO', 'ATVI', 'LYV', 'FOXA', 'NWSA', 'PARA', 'WBD'
  ],
  'Industrials': [
    'BA', 'CAT', 'GE', 'HON', 'RTX', 'LMT', 'NOC', 'GD',
    'DE', 'EMR', 'ETN', 'PH', 'ITW', 'CMI', 'FTV', 'AME'
  ],
  'Consumer Defensive': [
    'WMT', 'COST', 'PG', 'KO', 'PEP', 'CL', 'KMB', 'MDLZ',
    'GIS', 'SYY', 'ADM', 'TSN', 'CPB', 'CAG', 'HRL', 'SJM'
  ],
  'Energy': [
    'XOM', 'CVX', 'SLB', 'COP', 'EOG', 'MPC', 'PSX', 'VLO',
    'HAL', 'BKR', 'FANG', 'OVV', 'CTRA', 'MRO', 'DVN', 'APA'
  ],
  'Utilities': [
    'NEE', 'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL',
    'ES', 'PEG', 'ETR', 'FE', 'WEC', 'CMS', 'ATO', 'LNT'
  ],
  'Real Estate': [
    'AMT', 'PLD', 'EQIX', 'PSA', 'WELL', 'SPG', 'O', 'DLR',
    'VICI', 'EXPI', 'INVH', 'AVB', 'EQR', 'MAA', 'UDR', 'CPT'
  ],
  'Basic Materials': [
    'LIN', 'APD', 'ECL', 'SHW', 'PPG', 'DD', 'FCX', 'NEM',
    'VALE', 'RIO', 'BHP', 'NUE', 'STLD', 'X', 'CLF', 'CMC'
  ],
};

/**
 * Get stocks for a given sector
 */
export function getStocksForSector(sector: string): string[] {
  // Normalize sector name (handle variations)
  const normalizedSector = sector.trim();
  return SECTOR_STOCKS[normalizedSector] || [];
}

/**
 * Get all sectors with stocks
 */
export function getAllSectors(): string[] {
  return Object.keys(SECTOR_STOCKS);
}
