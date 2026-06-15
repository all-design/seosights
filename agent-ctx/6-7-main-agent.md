# Task 6 & 7 — Main Agent Work Record

## Task 6: Activate TIER_RATES in middleware + add IP-based rate limiting

### Files Edited
- **`src/middleware.ts`** — Complete rewrite of rate limiting logic

### Changes Made
1. **Activated TIER_RATES**: Replaced hardcoded `limit = 60` with `getRateLimit(tierCookie)` that reads the user's tier from a `seosights_tier` cookie:
   - `free_trial`: 10 req/min
   - `starter`: 30 req/min
   - `pro`: 100 req/min
   - `managed`: 300 req/min
   - `superadmin`: 1000 req/min
   - No tier / unknown: 10 req/min (same as free_trial)

2. **Added IP-based identification**: Extracted `getClientIP()` helper that checks `x-forwarded-for` then `x-real-ip` headers. When `seosights_session` cookie is unavailable, IP address is used as the rate limit key.

3. **Added per-IP daily audit limit**:
   - Separate `dailyAuditMap` with midnight reset (`getNextMidnight()`)
   - Free/unauthenticated: 3 audits per IP per day
   - Authenticated users with paid tier (not free_trial) bypass the daily limit
   - Only applies to `/api/analyze` endpoint
   - Returns 429 with `DAILY_LIMIT_EXCEEDED` code, `Retry-After`, and `X-DailyAudit-*` headers

---

## Task 7: Add Ollama as fallback model in AgentFallback chain

### Files Edited
- **`src/lib/agent-fallback.ts`** — Added Ollama integration and updated MODEL_CHAIN
- **`src/lib/zai.ts`** — Added Ollama as final fallback in createChatCompletion
- **`.env`** — Added OLLAMA_BASE_URL and OLLAMA_MODEL as commented-out variables

### Changes Made

#### `src/lib/agent-fallback.ts`
1. **Added `createOllamaCompletion()`**: Calls `OLLAMA_BASE_URL/api/chat` with configurable model (`OLLAMA_MODEL`, default: `llama3`). Returns OpenAI-compatible format with `provider: 'ollama'`. 30-second timeout. Graceful ECONNREFUSED handling.
2. **Added `isOllamaModel()`**: Helper to identify Ollama in the fallback chain.
3. **Updated MODEL_CHAIN**: Added `'ollama'` as last fallback in all chains:
   - `default`: `['gpt-4o-mini', 'deepseek-v3', 'ollama']`
   - `gpt-4o`: `['gpt-4o-mini', 'deepseek-v3', 'ollama']`
   - `gpt-4o-mini`: `['deepseek-v3', 'ollama']`
   - `claude-3.5-sonnet`: `['gpt-4o-mini', 'deepseek-v3', 'ollama']`
   - `deepseek-v3`: `['gpt-4o-mini', 'ollama']`
4. **Updated `executeWithFallback()`**: Default `maxAttempts` changed from 3 to 4. Added graceful skip when Ollama is unavailable (logs warning, continues to next model).

#### `src/lib/zai.ts`
1. **OpenAI failure**: Changed from `throw err` to fall-through to ZAI SDK.
2. **ZAI SDK**: Wrapped in try/catch (was unprotected before). Falls through to Ollama on failure.
3. **Ollama final fallback**: Added `createOllamaCompletion()` call as last resort. If all three fail, throws `"All LLM providers failed. ZAI SDK, OpenAI, and Ollama are all unavailable."`

#### `.env`
- Added `OLLAMA_BASE_URL` and `OLLAMA_MODEL` as commented-out configuration entries

### Verification
- `bun run lint` passes with no errors
- Pre-existing TypeScript errors in `zai.ts` (ZAI constructor, OpenAI namespace, `unknown` type) were confirmed to exist before this task
