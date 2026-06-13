# Task: 8-Agent SEO Analysis System

## Summary
Refactored the SEO analysis pipeline from 2 LLM calls to 8 specialized AI agents working in two parallel batches.

## Files Modified

### 1. `/src/lib/agents.ts` (NEW)
- Defined 8 agent interfaces with: id, name, role, icon, color, batch, systemPrompt, buildUserPrompt
- **Batch 1 Agents** (Technical analysis):
  - Crawler Agent (🔍) — Technical SEO audit: crawlability, indexation, Core Web Vitals, robots.txt
  - Schema Architect (🏗️) — Schema.org markup, structured data, AEO readiness
  - Content Analyst (📝) — Content quality, AI pattern detection, humanization, originality
  - E-E-A-T Auditor (🛡️) — Trust signals, Who/How/Why test, authority scoring
- **Batch 2 Agents** (Strategy & optimization):
  - GEO Specialist (🤖) — AI crawler access, citability, brand mentions, entity recognition
  - Link Architect (🔗) — Backlink outreach, competitor gap analysis, AI citation strategy
  - Local Scout (📍) — Google Business Profile, NAP consistency, review signals
  - SXO Strategist (🎯) — Intent matching, persona scoring, roadmap, KPIs, weekly plans

### 2. `/src/app/api/analyze/route.ts` (MAJOR REFACTOR)
- Phase 1: Data gathering (unchanged — page_reader, web_search)
- Phase 2: 8 agents in two parallel batches with staggered 1800ms delays
- Phase 3: Deep merge of all agent results with comprehensive fallbacks
- Added `deepMerge()` helper for combining nested agent outputs
- Added `runAgent()` helper for running individual agents with retry/timeout
- SSE progress now shows agent names: "Running Crawler Agent...", etc.
- All existing helpers preserved: retryWithBackoff, withTimeout, repairAndParseJSON
- Response structure (SEOAnalysis type) fully backward-compatible

### 3. `/src/components/landing/AnalyzingView.tsx` (UPDATED)
- Updated `phases` array to show 8 agents with Batch 1/Batch 2 labels
- Updated `SIMULATED_STEPS` to reflect agent progress with proper timing
- New agent-centric labels: "Running Crawler Agent...", "Running Schema Architect...", etc.

### 4. `/src/lib/store.ts` (UPDATED)
- Added `activeAgent: string | null` field to state
- Added `setActiveAgent: (agent: string | null) => void` action
- Updated `reset()` and `startAnalysis()` to handle activeAgent

## Architecture Decisions
- **Two-batch parallelism**: Agents run in parallel within batches, but batches are sequential to avoid rate limits
- **1800ms stagger delays**: Each agent within a batch starts 1.8s after the previous one
- **2000ms gap between batches**: Extra cooling period between batch 1 and batch 2
- **Deep merge with array concatenation**: Arrays from different agents (e.g., deepStrategy fields) are concatenated, not overwritten
- **Comprehensive fallbacks**: If any agent fails, its section gets default data so the dashboard still works

## Lint Results
- ✅ ESLint passed with zero errors

## Dev Server
- ✅ Running on port 3000, responding HTTP 200
