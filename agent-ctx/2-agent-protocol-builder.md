# Work Log — Task ID 2: Fix Observatory Generation LLM JSON Parsing

**Agent**: Protocol Builder Agent  
**Date**: 2025-06-28  
**Task**: Replace fragile regex-based JSON parsing in the observatory generate route with the robust `extractJsonObject()` function from `ai-governor.ts`, extracted to a shared utility.

---

## What I Did

### 1. Created `/home/z/my-project/src/lib/llm-utils.ts`
- Extracted the `extractJsonObject()` function from `ai-governor.ts` (lines 284–334) into a new shared utility module
- Added comprehensive docstring explaining the three-stage strategy: markdown fence stripping → fast-path JSON.parse → brace-scanning with nested brace/string/escape handling
- Function is exported and reusable by any module that needs to parse LLM responses

### 2. Modified `/home/z/my-project/src/app/api/observatory/generate/route.ts`
- **Replaced** the fragile JSON parsing (lines 114–120):
  ```typescript
  // OLD (fragile):
  const raw = result.content || ''
  let cleaned = raw.trim()
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) cleaned = jsonMatch[1].trim()
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')
  const parsed = JSON.parse(cleaned)
  ```
  ```typescript
  // NEW (robust):
  import { extractJsonObject } from '@/lib/llm-utils'
  const raw = result.content || ''
  const jsonStr = extractJsonObject(raw)
  if (!jsonStr) {
    console.error('[observatory/generate] LLM returned invalid JSON. Raw response (first 500 chars):', raw.slice(0, 500))
    throw new Error('LLM returned invalid JSON — could not extract a valid JSON object from the response')
  }
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>
  } catch (parseErr) {
    console.error('[observatory/generate] JSON.parse failed on extracted string. Raw response (first 500 chars):', raw.slice(0, 500))
    throw new Error(`JSON parsing failed after extraction: ${parseErr instanceof Error ? parseErr.message : 'Unknown parse error'}`)
  }
  ```
- Added **two levels of error handling**:
  - If `extractJsonObject` returns null (no JSON object found), logs the raw response prefix and throws a clear error
  - If `JSON.parse` fails on the extracted string, logs the raw response prefix and throws with the parse error message
- Did NOT change the `routeLLM` call or the prompt

### 3. Modified `/home/z/my-project/src/lib/ai-governor.ts`
- **Removed** the inline `extractJsonObject` function definition (was 50 lines, lines 284–334)
- **Added** `import { extractJsonObject } from './llm-utils'` alongside existing imports
- Left a comment `// extractJsonObject is now imported from ./llm-utils` at the former location for traceability
- All existing usage (`parseGovernorResponse` at line 370) continues to work unchanged via the import

---

## Verification

- Ran `npx eslint src/lib/llm-utils.ts src/lib/ai-governor.ts src/app/api/observatory/generate/route.ts` — **0 errors, 0 warnings**
- Pre-existing lint errors in `generate-docx.js` and `EngagementShell.tsx` are unrelated to this change
- Dev server log was empty (no runtime issues)

---

## Key Improvement

The old approach used a simple regex to strip markdown fences and then blindly called `JSON.parse`. This failed on common LLM output patterns:
- Extra text before/after the JSON object
- Nested JSON objects where the regex picked the wrong boundaries
- Trailing prose after the closing brace

The new `extractJsonObject()` uses a **brace-scanning algorithm** that correctly:
- Handles nested `{…}` blocks
- Ignores braces inside quoted strings (with escape support)
- Finds the first balanced JSON object even when surrounded by prose
- Validates the extracted slice with `JSON.parse` before returning it

This makes the observatory generation route resilient to the messy LLM responses that frequently occur in production.
