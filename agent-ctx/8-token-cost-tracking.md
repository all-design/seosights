# Task 8: Token & Cost Tracking Implementation

## Summary
Implemented comprehensive token and cost tracking across all three LLM-using API endpoints in the seosights project.

## Files Created
1. **`/src/lib/token-tracker.ts`** — TokenTracker utility class with:
   - `track()` — Record a single LLM call's token usage (agentId, agentName, model, inputTokens, outputTokens)
   - `estimateTokens()` — Rough estimation (1 token ≈ 4 chars)
   - `calculateCost()` — Per-model cost calculation using configurable MODEL_COSTS rates
   - `getTotalCost()` / `getSummary()` — Session-level cost aggregation with per-agent breakdown
   - `saveToDatabase()` — Upserts TokenUsage records grouped by date+agentId+model (accumulates daily)
   - `trackFailure()` — Records failure count for an agent on a given day
   - Supports 5 model cost tiers: default, gpt-4o, gpt-4o-mini, claude-3.5-sonnet, deepseek-v3

## Files Modified
2. **`/src/app/api/analyze/route.ts`** — Full integration:
   - Creates `TokenTracker` instance at start of analysis
   - Creates `Analysis` record in database at start (status: "running")
   - Data gathering phase: tracks page_reader and web_search calls as "data-gathering" pseudo-agents
   - `runAgent()` function now accepts `tokenTracker` and `analysisId` parameters
   - After each LLM call: estimates input/output tokens and calls `tokenTracker.track()`
   - On LLM failure: calls `tokenTracker.trackFailure()`
   - Creates `AgentLog` entries for each agent run (success, failure, or parse failure) with tokens, cost, timing
   - Updates `Analysis` record to "completed" or "failed" status at end
   - Saves all token usage to database at end (fire-and-forget, non-blocking)
   - Attaches `_tokenSummary` to the analysis result for frontend access
   - Console logs token summary for debugging

3. **`/src/app/api/quick-audit/route.ts`** — Quick audit tracking:
   - Creates `TokenTracker` for the session
   - Tracks page_reader calls (site page, robots.txt, llms.txt) as "quick-audit-page-reader"
   - Tracks the LLM analysis call as "quick-audit-llm"
   - Tracks failures via `trackFailure()`
   - Saves token usage at end (fire-and-forget)
   - Returns `_tokenSummary` in response

4. **`/src/app/api/generate-llms-txt/route.ts`** — llms.txt generator tracking:
   - Creates `TokenTracker` for the session
   - Tracks page_reader call as "llms-txt-page-reader"
   - Tracks both LLM calls (concise + full) as "llms-txt-generator"
   - Tracks failures via `trackFailure()`
   - Saves token usage at end (fire-and-forget)
   - Returns `_tokenSummary` in response

## Key Design Decisions
- Token estimation is rough (1 token ≈ 4 chars) since z-ai-web-dev-sdk doesn't return exact counts
- Cost rates are approximate and configurable in `MODEL_COSTS`
- Database saves happen at the END of analysis (not during) to avoid slowing streaming
- All database errors are handled gracefully — token tracking never breaks the analysis
- TokenUsage records are upserted by date+agentId+model (accumulated daily)
- AgentLog entries are created synchronously during agent runs for accurate timing
- `_tokenSummary` is included in API responses for potential frontend display

## Verification
- `bun run db:push` — Schema already in sync
- `bun run lint` — Zero errors
- Dev server compiles successfully
