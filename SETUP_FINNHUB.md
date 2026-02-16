# Finnhub API Key Setup

## Quick Setup

1. **Get your free Finnhub API key:**
   - Go to https://finnhub.io/
   - Click "Get Free API Key" or "Sign Up"
   - Create a free account
   - Copy your API key from the dashboard

2. **Add to `.env.local` file:**
   
   Open your `.env.local` file and add:
   ```
   FINNHUB_API_KEY=your_api_key_here
   ```
   
   Your complete `.env.local` should look like:
   ```
   FINNHUB_API_KEY=your_finnhub_api_key_here
   FMP_API_KEY=PEBZoTSvIqwyNsgNkN7Vmaotc6sFtNkc
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

## Why Finnhub?

- ✅ **60 calls/minute** (vs Alpha Vantage's 5/min)
- ✅ **No daily limit** (vs Alpha Vantage's 25/day)
- ✅ More reliable and faster
- ✅ Free tier is very generous

## Need Help?

If you're having trouble:
1. Make sure `.env.local` is in the root directory (same folder as `package.json`)
2. Make sure there are no spaces around the `=` sign
3. Make sure you restart the server after adding the key
4. Check that your API key is valid at https://finnhub.io/
