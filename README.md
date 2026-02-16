# Stock Analysis Web App

A comprehensive Next.js 14 stock analysis application for educational purposes. This tool performs deep analysis using multiple data sources including SEC filings, earnings history, financial statements, technical indicators, and market sentiment to provide detailed investment insights.

**⚠️ Disclaimer: This is an educational tool only. Not financial advice.**

## Features

### Core Analysis
- **Real-time Stock Data**: Fetches daily prices, fundamentals, and news sentiment from Alpha Vantage
- **Technical Indicators**: Calculates SMA(20), SMA(50), RSI(14), and MACD(12,26,9)
- **Key Metrics**: Displays returns, volatility, and price trends
- **Fundamentals Analysis**: Shows market cap, P/E ratio, EPS, revenue, and profit margin

### Enhanced Features
- **SEC Filings**: Pulls recent SEC filings (10-K, 10-Q, 8-K) directly from SEC EDGAR database
- **Earnings History**: Historical earnings data with beats/misses analysis
- **Financial Statements**: Income statements for trend analysis
- **Detailed Recommendations**: Buy/Watch/Avoid with:
  - Pros and Cons list
  - Bullish and Bearish indicators
  - Risk level assessment (Low/Medium/High)
  - Price targets with optimistic/base/pessimistic scenarios
  - Confidence scores (0-100%)
- **News Sentiment**: Displays recent news and sentiment analysis
- **Scenario Outlook**: Generates 1-month and 3-month price scenarios based on statistical analysis
- **Error Handling**: Graceful degradation for rate limits and missing data
- **Caching**: Server-side caching to respect API rate limits

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Recharts** (for price charts)
- **Zod** (for runtime validation)
- **Vitest** (for unit testing)
- **LRU Cache** (for in-memory caching)

## Prerequisites

- Node.js 18+ and npm
- **No API key required!** Uses Yahoo Finance (completely free, no API key needed)
- **Finnhub API key** (optional) - For enhanced company profiles and news. Free tier available at [finnhub.io](https://finnhub.io/)
- Financial Modeling Prep API key (optional, but recommended for earnings data) - Free tier available at [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs/)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file in the root directory (optional):**
   The app works without any API keys! Yahoo Finance is used by default (completely free, no key needed).
   
   For enhanced features, you can optionally add:
   ```
   FINNHUB_API_KEY=your_finnhub_api_key_here
   FMP_API_KEY=your_fmp_api_key_here
   ```
   
   **API Keys (all optional):**
   - **No API key required!** Yahoo Finance provides all core functionality (historical prices, company data) - completely free!
   - **FINNHUB_API_KEY** (Optional): Get your free key at [finnhub.io](https://finnhub.io/)
     - Free tier: 60 calls/minute, no daily limit
     - Enhances company profiles and news data
     - If not provided, Yahoo Finance data is used instead
   - **FMP_API_KEY** (Optional but recommended): Get your free key at [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs/)
     - Free tier: 250 requests/day
     - Provides earnings history and financial statements
     - If not provided, the app works but without earnings data
   
   **Note:** SEC EDGAR API is free and doesn't require an API key.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Running Tests

```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

## Project Structure

```
stockanalysis/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # Main analysis endpoint
│   │   ├── quote/route.ts        # Time series data (Finnhub)
│   │   ├── overview/route.ts     # Fundamentals data (Finnhub)
│   │   ├── news/route.ts         # News sentiment data (Finnhub)
│   │   ├── sec-filings/route.ts  # SEC filings (SEC EDGAR, free)
│   │   ├── earnings/route.ts     # Earnings history (Financial Modeling Prep)
│   │   └── financials/route.ts  # Financial statements (Financial Modeling Prep)
│   ├── stock/
│   │   └── [symbol]/page.tsx    # Stock detail page
│   ├── layout.tsx
│   ├── page.tsx                 # Home page
│   └── globals.css
├── components/
│   ├── PriceChart.tsx           # Recharts price chart
│   ├── LoadingSkeleton.tsx      # Loading state
│   └── MetricCard.tsx           # Metric display card
├── lib/
│   ├── types.ts                 # TypeScript types and Zod schemas
│   ├── cache.ts                 # LRU cache utilities
│   ├── indicators.ts            # Technical indicator calculations
│   ├── analyze.ts               # Basic analysis engine
│   └── enhanced-analyze.ts      # Enhanced analysis with pros/cons, risk factors
├── __tests__/
│   ├── indicators.test.ts       # Indicator unit tests
│   └── analyze.test.ts          # Analysis engine tests
└── package.json
```

## API Routes

All API routes are server-side only to keep API keys secure:

- `/api/quote?symbol=AAPL` - Fetches daily time series data (Finnhub)
- `/api/overview?symbol=AAPL` - Fetches company fundamentals (Finnhub)
- `/api/news?symbol=AAPL` - Fetches news sentiment (Finnhub, optional)
- `/api/sec-filings?symbol=AAPL&cik=...` - Fetches SEC filings (SEC EDGAR, free, no key)
- `/api/earnings?symbol=AAPL` - Fetches earnings history (Financial Modeling Prep, optional)
- `/api/financials?symbol=AAPL&statement=income-statement` - Fetches financial statements (Financial Modeling Prep, optional)
- `/api/analyze?symbol=AAPL` - Comprehensive analysis endpoint (combines all data sources)

## Rate Limiting

**Finnhub free tier**: 60 calls/minute, **no daily limit!** Much better than Alpha Vantage.

The app includes:
- Server-side caching (15 minutes for quotes, 2 hours for fundamentals)
- In-memory LRU cache
- Graceful error messages when rate limits are hit
- Debouncing on search input (client-side)

## Recommendation Logic

The enhanced recommendation engine uses a comprehensive heuristic scoring system:

1. **Base Score**: Starts at 50
2. **Technical Analysis**: Adds/subtracts points based on:
   - Price vs moving averages (SMA20, SMA50)
   - Moving average crossovers (Golden/Death Cross)
   - RSI levels (overbought/oversold conditions)
   - MACD signals and histogram
   - Volatility analysis
   - Drawdown from highs
3. **Fundamental Analysis**: Considers:
   - P/E ratio (valuation)
   - Profit margin (profitability)
   - Revenue growth trends
   - Market capitalization
4. **Earnings Analysis**: 
   - Earnings beats/misses history
   - EPS growth trends
   - Revenue vs estimates
5. **Financial Statement Analysis**:
   - Revenue growth trends
   - Profit margin trends
   - Income statement comparisons
6. **Sentiment Analysis**: Incorporates news sentiment if available
7. **Final Mapping**:
   - 70-100: Buy
   - 50-69: Watch
   - 0-49: Avoid

**Enhanced Output Includes:**
- **Pros**: List of positive factors
- **Cons**: List of negative factors
- **Bullish Indicators**: Technical and fundamental bullish signals
- **Bearish Indicators**: Technical and fundamental bearish signals
- **Risk Level**: Low/Medium/High with specific risk factors
- **Price Target**: Optimistic, base, and pessimistic scenarios for 3 months

Confidence is adjusted based on data completeness and signal agreement.

## Scenario Outlook

The scenario outlook uses statistical analysis:

- Calculates mean and standard deviation of daily returns from last 60 trading days
- Projects 1-month (21 days) and 3-month (63 days) scenarios
- **Optimistic**: mean + 1 std dev
- **Base**: mean return
- **Pessimistic**: mean - 1 std dev

**Important**: These are heuristic estimates based on historical volatility, not guaranteed predictions.

## Security

- API key is never exposed to the client
- All API calls are made server-side
- Input validation and sanitization on all user inputs
- Symbol validation (uppercase, letters and dots only)

## Building for Production

```bash
npm run build
npm start
```

## License

This project is for educational purposes only.

## Data Sources

- Stock prices, fundamentals, and news: [Finnhub](https://finnhub.io/) - **60 calls/minute, no daily limit!**
- SEC filings: [SEC EDGAR](https://www.sec.gov/edgar) - Free, no API key required
- Earnings and financials: [Financial Modeling Prep](https://site.financialmodelingprep.com/) - Optional

- **Finnhub**: Stock prices, fundamentals, news sentiment - **60 calls/minute, no daily limit!**
- **SEC EDGAR**: SEC filings (10-K, 10-Q, 8-K) - Free, no API key required
- **Financial Modeling Prep**: Earnings history and financial statements (optional, free tier available)

## API Key Setup

### Required
- **Finnhub**: Required for basic functionality
  - Sign up: https://finnhub.io/
  - Free tier: **60 calls/minute, no daily limit!**
  - Much better than Alpha Vantage's restrictive limits

### Optional (Recommended)
- **Financial Modeling Prep**: For earnings and financial statements
  - Sign up: https://site.financialmodelingprep.com/developer/docs/
  - Free tier: 250 requests/day
  - Without this key, the app works but won't show earnings data

### Free (No Key Required)
- **SEC EDGAR**: Automatically used for SEC filings
  - No API key needed
  - Public data from SEC.gov
