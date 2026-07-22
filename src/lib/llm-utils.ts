/**
 * LLM Utilities — Shared helpers for processing LLM responses
 *
 * Extracted from ai-governor.ts to provide a single, reusable source for
 * JSON extraction from potentially noisy LLM output.
 */

/**
 * Extract the first balanced JSON object from a (possibly noisy) LLM response.
 *
 * Strategy:
 *  1. Strip markdown code fences (```json ... ```) if present
 *  2. Fast path — try parsing the cleaned text as-is
 *  3. Brace-scanning — walk the text character-by-character to find the first
 *     balanced `{…}` object, correctly handling nested braces and escaped
 *     characters inside strings
 *
 * Returns the extracted JSON string, or `null` if no valid JSON object was found.
 */
export function extractJsonObject(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // Strip markdown code fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed

  // Fast path: try parsing as-is
  try {
    JSON.parse(candidate)
    return candidate
  } catch {
    // fall through to brace-scanning
  }

  const start = candidate.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
    } else if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        const slice = candidate.slice(start, i + 1)
        try {
          JSON.parse(slice)
          return slice
        } catch {
          return null
        }
      }
    }
  }

  return null
}

/**
 * Parse an LLM response that should contain a JSON object.
 *
 * Convenience wrapper around `extractJsonObject()` that also parses the
 * extracted string and returns the resulting object. Throws if no valid
 * JSON can be extracted, with a descriptive error message.
 *
 * Optionally accepts a `fallback` value to return instead of throwing
 * (useful for pipeline steps that should not crash on malformed LLM output).
 */
export function parseLLMJson<T = Record<string, unknown>>(
  raw: string,
  fallback?: T,
): T {
  const jsonStr = extractJsonObject(raw)
  if (!jsonStr) {
    if (fallback !== undefined) return fallback
    throw new Error(
      `No valid JSON object found in LLM response (first 200 chars: ${raw.slice(0, 200)})`,
    )
  }
  return JSON.parse(jsonStr) as T
}
