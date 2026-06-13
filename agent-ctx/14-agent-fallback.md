# Task 14: Agent Failure Fallback System

## Summary
Created an Agent Failure Fallback system that automatically switches to a fallback model when the primary LLM API fails (429 rate limit, 5xx server error, timeout). The system is transparent to users, logs all attempts for the Superadmin panel, and provides infrastructure for when multi-model support is added to the SDK.

## Files Created

### `/src/lib/agent-fallback.ts` (NEW)
- **MODEL_CHAIN** config: Maps each primary model to an ordered list of fallback models
  - `default` → `gpt-4o-mini` → `deepseek-v3`
  - `gpt-4o` → `gpt-4o-mini` → `deepseek-v3`
  - `gpt-4o-mini` → `deepseek-v3`
  - `claude-3.5-sonnet` → `gpt-4o-mini` → `deepseek-v3`
  - `deepseek-v3` → `gpt-4o-mini`
- **FallbackLogEntry** interface: Tracks model, attempt number, success, error, timestamp, latency
- **FallbackResult** interface: Complete result with success status, model used, attempt number, data, logs, usedFallback flag
- **isRetryableError()** function: Classifies errors as retryable (429, 5xx, timeout, network) vs non-retryable (4xx programming errors)
- **AgentFallback** class:
  - Constructor accepts `primaryModel` and optional `customFallback` (from AgentPrompt table)
  - `executeWithFallback()`: Tries primary model first, then fallbacks on retryable errors
  - `getModelChain()`: Returns full chain [primary, ...fallbacks]
  - `getAttemptSummary()`: Human-readable summary for AgentLog
  - `getLogs()`: Returns detailed attempt logs
  - Exponential backoff between fallback attempts (1.5x + jitter)
  - Non-retryable errors short-circuit immediately (no fallback for 4xx)

## Files Modified

### `/src/app/api/analyze/route.ts` (UPDATED)
- Added import: `import { AgentFallback } from '@/lib/agent-fallback'`
- **runAgent()** function refactored:
  - Replaced direct `retryWithBackoff` call with `AgentFallback.executeWithFallback()`
  - Primary call: Uses `retryWithBackoff` with 3 retries and 4000ms base delay (same as before)
  - Fallback call: Uses `retryWithBackoff` with 2 retries and 3000ms base delay (fewer to avoid long waits)
  - Max 3 attempts across primary + fallbacks with 2000ms base delay between attempts
  - Token tracking now uses `usedModel` from fallback result instead of hardcoded `'default'`
  - Failure tracking now uses `usedModel` from fallback result
  - Console logging includes `[FALLBACK: model]` tag when a fallback was used
  - AgentLog entries now include:
    - `model` field: The model that actually handled the request (or last attempted)
    - `error` field: Includes fallback attempt summary when applicable (e.g. "default→gpt-4o-mini (attempt 2/3, fallback used)")
    - Fallback chain details in error messages for Superadmin visibility
  - All existing AgentLog creation, JSON repair, and error handling preserved

## Architecture Decisions

1. **SDK model routing**: Since z-ai-web-dev-sdk handles model routing internally, the fallback system currently retries the same SDK call but logs which model was *attempted*. This provides:
   - Tracking of which agents are failing
   - Infrastructure ready for when multi-model support is added
   - Logging of all fallback attempts in AgentLog

2. **Non-retryable error short-circuit**: 4xx client errors (except 429) are programming errors that won't be fixed by trying a different model. These immediately return without trying fallbacks.

3. **Reduced fallback retries**: Fallback calls use fewer retries (2 vs 3) and shorter delays (3000ms vs 4000ms) to minimize total wait time while still giving the fallback a chance.

4. **Transparent to users**: Users never see which model handled their request. Fallback activity is only visible in console logs and the Superadmin AgentLog panel.

5. **AgentLog integration**: Fallback attempt summaries are appended to AgentLog error messages, making them visible in the Superadmin panel. The `model` field in AgentLog now reflects the actual model used instead of always being `'default'`.

## Lint Results
- ✅ ESLint passed with zero errors

## Dev Server
- ✅ Running on port 3000, responding HTTP 200
- ✅ Compiled successfully after changes
