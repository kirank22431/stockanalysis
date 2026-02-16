# Stock + Crypto Analysis Web App

A comprehensive stock and cryptocurrency analysis web application built with Next.js 14, TypeScript, and TailwindCSS. Generates detailed analysis reports with Bullish/Bearish recommendations and Buy/Hold/Sell labels.

**⚠️ Disclaimer: Educational only. Not financial advice.**

## Features

### Core Functionality
- **Stock Analysis**: Comprehensive reports for any stock ticker
- **Crypto Analysis**: Detailed reports for cryptocurrencies
- **Market Overview**: Sector performance and macro indicators
- **SEC Filings**: Latest 10-K, 10-Q, 8-K filings with direct links
- **Report Generation**: Detailed JSON reports with scoring and recommendations

### Report Sections
- Company Profile (stocks)
- Valuation Metrics (PE, PS, PB, EV/EBITDA)
- Financial Health (ratios, cash flow)
- Profitability (margins, ROE, ROA)
- Growth Metrics (revenue, earnings growth)
- Performance (52W high/low, volatility)
- Technical Indicators (SMA 50/200, RSI, MACD)
- Earnings History
- SEC Filings
- Risk Assessment

### Crypto Features
- Market cap and volume
- Circulating supply
- 7d/30d performance
- Volatility analysis
- ATH/ATL tracking

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Recharts** (for price charts)
- **Zod** (for runtime validation)
- **LRU Cache** (in-memory caching)

## Data Providers

- **Alpha Vantage**: Stock prices, sector performance
- **Financial Modeling Prep (FMP)**: Company profiles, financial statements, key metrics, earnings
- **SEC EDGAR**: SEC filings and company facts (free, no API key)
- **CoinGecko**: Cryptocurrency data (free tier)

## Prerequisites

- Node.js 18+ and npm
- API Keys (see setup below)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```
   ALPHAVANTAGE_API_KEY=your_alpha_vantage_key
   FMP_API_KEY=your_fmp_key
   ```

   **API Keys:**
   - **ALPHAVANTAGE_API_KEY** (Required for stocks): Get free key at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
     - Free tier: 5 calls/minute, 500 calls/day
   - **FMP_API_KEY** (Required for stocks): Get free key at [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs/)
     - Free tier: 250 requests/day
   - **CoinGecko**: No API key required (free tier available)
   - **SEC EDGAR**: No API key required (completely free)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
stockanalysis/
├── app/
│   ├── api/
│   │   ├── report/route.ts          # Main report generation
│   │   ├── market/overview/route.ts  # Market overview
│   │   └── filings/route.ts          # SEC filings
│   ├── report/page.tsx               # Report display page
│   ├── market/page.tsx               # Market overview page
│   ├── filings/page.tsx              # Filings page
│   ├── page.tsx                      # Home page
│   └── layout.tsx
├── lib/
│   ├── providers/
│   │   ├── alphavantage.ts           # Alpha Vantage provider
│   │   ├── fmp.ts                    # Financial Modeling Prep provider
│   │   ├── sec.ts                    # SEC EDGAR provider
│   │   └── coingecko.ts              # CoinGecko provider
│   ├── analysis/
│   │   └── reportBuilder.ts          # Report generation & scoring
│   ├── indicators.ts                 # Technical indicators
│   ├── analyze.ts                    # Analysis utilities
│   └── cache.ts                      # LRU cache
└── components/
    └── ReportChart.tsx               # Price chart component
```

## API Routes

- `GET /api/report?symbol=AAPL&type=stock` - Generate stock report
- `GET /api/report?id=bitcoin&type=crypto` - Generate crypto report
- `GET /api/market/overview` - Market overview with sector performance
- `GET /api/filings?symbol=AAPL` - SEC filings for a stock

## Scoring Model

The report uses a comprehensive scoring system (0-100):

- **Valuation Score** (15%): PE ratio, Price/Sales, Price/Book
- **Growth Score** (20%): Revenue growth, earnings growth
- **Profitability Score** (20%): Margins, ROE, ROA
- **Health Score** (15%): Current ratio, debt ratios, cash flow
- **Momentum Score** (20%): Price vs moving averages, RSI, MACD
- **Risk Penalty** (10%): Volatility, drawdown, declining metrics

**Final Mapping:**
- 60-100: Bullish → Buy
- 40-59: Neutral → Hold
- 0-39: Bearish → Sell

Confidence is calculated based on score strength and data completeness.

## Report Features

- **Download JSON**: Export full report as JSON
- **Copy Summary**: Copy summary to clipboard
- **Price Charts**: Visual price history (last 6 months)
- **Data Freshness**: Timestamps for each section
- **Source Attribution**: Lists all data providers used

## Caching

- Server-side LRU cache (15 minutes - 2 hours depending on data type)
- Reduces API calls and improves performance
- Cache keys include symbol + endpoint

## Error Handling

- Graceful degradation when providers are unavailable
- Clear error messages for rate limits
- Retry logic (max 2 retries) with exponential backoff
- Timeout handling (10s default)

## Testing

```bash
npm test
```

## Building for Production

```bash
npm run build
npm start
```

## License

This project is for educational purposes only.

## Data Sources

- **Alpha Vantage**: Stock prices, sector data
- **Financial Modeling Prep**: Company fundamentals, financial statements
- **SEC EDGAR**: SEC filings (free, public data)
- **CoinGecko**: Cryptocurrency market data
