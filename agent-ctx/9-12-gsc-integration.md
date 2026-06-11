# Task 9-12: Google Search Console Integration & Enhanced Free Scanner

## Summary
Created Google Search Console (GSC) integration and enhanced the Free Scanner with GSC comparison features.

## Files Created
1. **`/src/app/api/gsc/route.ts`** - GSC connection API (POST)
   - Validates site URL
   - Returns mock GSC data (top queries with AI citation status, top pages, crawl errors, indexing status, performance over time)
   - Error handling for missing/invalid URLs

2. **`/src/app/api/gsc/data/route.ts`** - GSC comparison data API (GET)
   - Query params: domain, period (7d/28d/90d)
   - Returns Google vs AI comparison data
   - Shows correlation analysis (positions #1-3 = 3X AI citation likelihood)
   - AI vs Google comparison cards with metrics
   - Performance chart data with AI mentions overlay
   - Top correlated pages analysis

3. **`/src/components/dashboard/GSCPanel.tsx`** - GSC Panel Component
   - Not-connected state: shows "Connect Google Search Console" with dialog
   - Connected state shows:
     - Connection header with period selector (7d/28d/90d)
     - AI vs Google comparison cards (impressions, mentions, citation rate, correlation)
     - Key insight banner with correlation data
     - Performance chart (impressions + clicks bar chart with sparklines)
     - Top queries table (query, impressions, clicks, CTR, position, AI citation status)
     - Indexing status overview with coverage bar
     - Crawl errors list
     - Rank × AI Citation Correlation section

## Files Modified
4. **`/src/components/landing/HeroSection.tsx`** - Added GSC comparison card
   - After scan results: "Compare with Google Search Console" card
   - Shows AI correlation insight ("Pages ranking #1-3 are 3X more likely to be cited by AI")
   - Visual badges for GSC Correlation and 3X AI Boost

5. **`/src/components/landing/AnalysisDashboard.tsx`** - Added GSC tab
   - Changed playbookTab type to include 'gsc'
   - Added GSC tab button with Globe icon
   - GSC tab renders GSCPanel component with domain from analysis data
   - Hides count badge for GSC tab (not a strategy count)

## Mock Data Strategy
All GSC data is mocked since we can't connect without OAuth. Mock data is realistic:
- Top queries include AI citation status per engine (ChatGPT, Claude, Perplexity, Gemini)
- Performance data spans configurable periods
- Correlation analysis shows position-based AI citation rates
- Crawl errors and indexing status are realistic

## Testing
- All API endpoints tested with curl
- Error handling verified (empty URL, missing domain param)
- Lint passes with no errors
- Dev server compiles successfully
