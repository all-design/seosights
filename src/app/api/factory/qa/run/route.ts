/**
 * Factory QA Run API — POST /api/factory/qa/run
 *
 * Runs ESLint on the project (`src/`), parses the structured LintResult[]
 * returned by ESLint's Node.js API, counts errors/warnings/fixable, saves a
 * QARun record to the DB, and returns the structured result.
 *
 * Implementation note:
 *   Uses ESLint's in-process Node.js API (`new ESLint()` + `lintFiles()`)
 *   via dynamic import instead of spawning `npx eslint` as a child process.
 *   This is required because Vercel's serverless runtime:
 *     1. Disallows runtime network access (so `npx` cannot download ESLint)
 *     2. Discourages spawning child processes from request handlers
 *
 * Response shape:
 *   {
 *     errorCount, warningCount, fixableCount,
 *     status: 'passed' | 'failed' | 'warning',
 *     durationMs,
 *     errors: [{ file, message, ruleId, severity, line, column, fixable }, ...],
 *     qaRunId
 *   }
 *
 * Status semantics:
 *   - 'passed'  : 0 errors AND 0 warnings
 *   - 'warning' : 0 errors, ≥1 warnings
 *   - 'failed'  : ≥1 errors
 *
 * On ESLint execution failure (e.g., missing config, timeout), returns HTTP 500.
 */

import { NextResponse } from 'next/server'
import path from 'path'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

// ─── Types ────────────────────────────────────────────────────────────────────

interface ESLintMessage {
  ruleId: string | null
  severity: number // 1 = warning, 2 = error
  message: string
  line?: number
  column?: number
  endLine?: number
  endColumn?: number
  fix?: { range: [number, number]; text: string } | null
}

interface ESLintResult {
  filePath: string
  messages: ESLintMessage[]
  errorCount: number
  warningCount: number
  fixableErrorCount: number
  fixableWarningCount: number
  source?: string
}

interface ParsedError {
  file: string
  message: string
  ruleId: string | null
  severity: 'error' | 'warning'
  line: number | null
  column: number | null
  fixable: boolean
}

interface QAResponse {
  errorCount: number
  warningCount: number
  fixableCount: number
  status: 'passed' | 'failed' | 'warning'
  durationMs: number
  errors: ParsedError[]
  qaRunId?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_RETURNED_ERRORS = 200

const ESLINT_TIMEOUT_MS = 60_000 // hard cap — never hang the request

/**
 * Run ESLint in-process using the Node.js API (v9 flat config).
 *
 * - Uses dynamic `import('eslint')` so ESLint is not loaded on cold-start for
 *   unrelated routes.
 * - Creates a fresh `ESLint` instance per request (no shared state).
 * - Auto-detects `eslint.config.mjs` from `process.cwd()` (project root).
 * - Wraps `lintFiles()` in a manual `Promise.race` timeout because ESLint v9's
 *   `lintFiles()` does not accept an `AbortSignal`.
 *
 * Throws on hard failure (timeout, missing config, dynamic import error).
 * Returns parsed summary on success (lint errors are NOT a throw — they are
 * reported in the returned counts/errors arrays).
 */
async function runESLintAPI(): Promise<{
  errorCount: number
  warningCount: number
  fixableCount: number
  errors: ParsedError[]
}> {
  // Dynamic import — keeps ESLint out of the bundle/cold-start path for
  // unrelated routes.
  const { ESLint } = await import('eslint')

  const eslint = new ESLint({
    fix: false,
    errorOnUnmatchedPattern: false,
    // cwd defaults to process.cwd() — ESLint will find eslint.config.mjs there.
  })

  // Manual timeout race — ESLint v9's lintFiles() does not honor AbortSignal.
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('ESLint timed out after 60s')),
      ESLINT_TIMEOUT_MS,
    )
  })

  let results: ESLintResult[]
  try {
    const raw = await Promise.race([
      eslint.lintFiles(['src/']),
      timeoutPromise,
    ])
    results = raw as unknown as ESLintResult[]
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }

  if (!Array.isArray(results)) {
    return { errorCount: 0, warningCount: 0, fixableCount: 0, errors: [] }
  }

  const projectRoot = process.cwd()
  let totalErrors = 0
  let totalWarnings = 0
  let totalFixable = 0
  const errors: ParsedError[] = []

  for (const fileResult of results) {
    if (!fileResult || typeof fileResult !== 'object') continue

    totalErrors += fileResult.errorCount || 0
    totalWarnings += fileResult.warningCount || 0
    totalFixable +=
      (fileResult.fixableErrorCount || 0) + (fileResult.fixableWarningCount || 0)

    // Normalize file path to be relative to the project root so the frontend
    // sees `src/lib/foo.ts`, not an absolute server path.
    const rawPath = fileResult.filePath || '(unknown file)'
    const filePath =
      path.isAbsolute(rawPath)
        ? path.relative(projectRoot, rawPath) || rawPath
        : rawPath

    for (const msg of fileResult.messages || []) {
      if (errors.length >= MAX_RETURNED_ERRORS) break
      errors.push({
        file: filePath,
        message: msg.message || '(no message)',
        ruleId: msg.ruleId ?? null,
        severity: msg.severity === 2 ? 'error' : 'warning',
        line: typeof msg.line === 'number' ? msg.line : null,
        column: typeof msg.column === 'number' ? msg.column : null,
        fixable: !!msg.fix,
      })
    }
  }

  return {
    errorCount: totalErrors,
    warningCount: totalWarnings,
    fixableCount: totalFixable,
    errors,
  }
}

/** Persist a QARun record (best-effort — DB may be unavailable). */
async function saveQARun(params: {
  errorCount: number
  warningCount: number
  fixableCount: number
  errors: ParsedError[]
  durationMs: number
  status: 'passed' | 'failed' | 'warning'
}): Promise<string | undefined> {
  try {
    const qaRun = await db.qARun.create({
      data: {
        runType: 'eslint',
        status: params.status,
        errorCount: params.errorCount,
        warningCount: params.warningCount,
        fixableCount: params.fixableCount,
        errors: JSON.stringify(params.errors.slice(0, 50)), // cap stored size
        warnings: JSON.stringify(
          params.errors.filter((e) => e.severity === 'warning').slice(0, 50),
        ),
        durationMs: params.durationMs,
      },
    })
    return qaRun.id
  } catch (err) {
    console.error('[api/factory/qa/run] Failed to persist QARun:', err)
    return undefined
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────────

export async function POST() {
  const start = Date.now()

  try {
    const { errorCount, warningCount, fixableCount, errors } = await runESLintAPI()

    const durationMs = Date.now() - start

    const status: QAResponse['status'] =
      errorCount > 0 ? 'failed' : warningCount > 0 ? 'warning' : 'passed'

    const qaRunId = await saveQARun({
      errorCount,
      warningCount,
      fixableCount,
      errors,
      durationMs,
      status,
    })

    const response: QAResponse = {
      errorCount,
      warningCount,
      fixableCount,
      status,
      durationMs,
      errors,
    }
    if (qaRunId) response.qaRunId = qaRunId

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[api/factory/qa/run] Failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 0,
        warningCount: 0,
        fixableCount: 0,
        status: 'failed',
        durationMs: Date.now() - start,
        errors: [],
      },
      { status: 500 },
    )
  }
}
