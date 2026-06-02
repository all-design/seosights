# Task 2-b: Make SEO/AEO/GEO Analysis API 10x More Precise and Comprehensive

## Agent: main

## Status: COMPLETED

## Summary
Complete rewrite of `/api/analyze/route.ts` to make the analysis 10x more precise by adding 4 new data gathering steps, enhancing all LLM prompts with more specific quantity requirements, adding a third LLM call for deep strategy, implementing three-way merge, and updating progress steps to be more granular.

## Files Modified
1. `/src/app/api/analyze/route.ts` - Complete rewrite with enhanced data gathering, 3 LLM calls, three-way merge
2. `/src/lib/store.ts` - Added DeepStrategyData interface and deepStrategy? optional field to SEOAnalysis

## Key Changes

### Data Gathering (8 steps, was 3)
1. Primary page scan (existing, enhanced)
2. **NEW**: robots.txt page_reader call
3. Competitor search (existing, increased results)
4. AI citation search (existing, increased results)
5. Local SEO search (existing, increased results)
6. **NEW**: site:domain search for site structure
7. **NEW**: Industry/niche trends search
8. **NEW**: Schema markup best practices search

### New Utility
- `extractHtmlStructure()` - Parses raw HTML to extract headings, meta tags, title, canonical, viewport, lang attributes

### LLM Calls (3 parallel, was 2)
1. **Audit** - Enhanced with robots.txt content, HTML structure analysis, more items per section
2. **Strategy** - Enhanced with domain pages, industry trends, schema best practices, more items
3. **Deep Strategy** (NEW) - Actionable implementations with code snippets, backlink outreach, content calendar, competitor gap analysis, AI citation strategy

### Three-Way Merge
auditData → strategyData → deepStrategy merged into unified analysis result

### Progress Steps
16 granular steps (was 7) providing more professional, detailed progress feedback

### Store Types
- Added `DeepStrategyData` interface with 5 sub-types
- Added `deepStrategy?: DeepStrategyData` to `SEOAnalysis` (optional, backward-compatible)

## Compatibility
- All existing fields in SEOAnalysis unchanged
- New `deepStrategy` field is optional
- SSE streaming format unchanged
- Endpoint URL and request/response format unchanged
- JSON repair utility preserved
- Client-side components untouched
