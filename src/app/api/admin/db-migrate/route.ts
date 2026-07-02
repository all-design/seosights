/**
 * /api/admin/db-migrate — Self-healing DB migration endpoint
 *
 * Ensures all 7 AI Software Factory™ tables exist in the production Turso
 * (libsql) database by running idempotent `CREATE TABLE IF NOT EXISTS` DDL
 * that exactly mirrors `prisma/schema.prisma` (lines 1947-2156).
 *
 * Tables managed here:
 *   1. DailyMission
 *   2. FactoryTask          (FK -> DailyMission.id ON DELETE SET NULL)
 *   3. GovernorInterception
 *   4. EngineeringMemory
 *   5. QARun
 *   6. FactoryChangelog
 *   7. CodebaseSnapshot
 *
 * Why this endpoint exists:
 *   On local SQLite the Prisma client auto-creates tables via `prisma db push`.
 *   On Turso, the production DB only had a subset of tables created (e.g.
 *   GovernorInterception existed but DailyMission did not). Prisma client
 *   queries against missing tables throw `.QueryError: table not found`.
 *   This endpoint lets a superadmin "self-heal" the prod schema without
 *   requiring `prisma migrate deploy` access on the server.
 *
 * Auth:
 *   Reads `superadmin_key` cookie, compares to `process.env.SUPERADMIN_SECRET`
 *   (with default 'seosights-superadmin-2024' if the env var is unset).
 *   ALWAYS checks the cookie against the secret — never left open in any mode
 *   (dev, sandbox, or prod). This matches the auth pattern used by
 *   /api/superadmin/auth and /api/superadmin/check.
 *
 * Notes:
 *   - SQLite stores Boolean as INTEGER (0/1) and DateTime as TEXT (ISO8601).
 *   - `@default(cuid())` cannot be reproduced in SQLite DDL — ID columns are
 *     left without DEFAULT because the Prisma client always sends the id.
 *   - All `@default(now())` columns use `DEFAULT (datetime('now'))`.
 *   - Each table creation + each index is wrapped in its own try/catch so a
 *     single failure does not abort the rest of the migration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ─── Types ───────────────────────────────────────────────────────────────

type TableResult = {
  created: boolean
  exists: boolean
  error?: string
  rowCount?: number
  indexesCreated: number
  indexesTotal: number
}

type MigrationResponse = {
  ok: boolean
  migratedAt: string
  tables: Record<string, TableResult>
  totalCreated: number
  totalExists: number
  totalFailed: number
}

// ─── DDL Definitions ───────────────────────────────────────────────────
// Order matters: DailyMission must be created BEFORE FactoryTask because
// FactoryTask has a FK constraint that references DailyMission(id). SQLite
// does not strictly enforce FK existence at CREATE TABLE time, but creating
// the parent first avoids any libsql edge cases.

type TableDef = {
  name: string
  createSql: string
  indexes: string[]
}

const TABLE_DDL: TableDef[] = [
  {
    name: 'DailyMission',
    createSql: `CREATE TABLE IF NOT EXISTS "DailyMission" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "date" DATETIME NOT NULL UNIQUE,
  "goal" TEXT NOT NULL,
  "strategy" TEXT NOT NULL,
  "maxHours" REAL NOT NULL DEFAULT 4,
  "maxComponents" INTEGER NOT NULL DEFAULT 2,
  "maxPages" INTEGER NOT NULL DEFAULT 5,
  "confidenceThreshold" REAL NOT NULL DEFAULT 0.8,
  "hoursUsed" REAL NOT NULL DEFAULT 0,
  "componentsCreated" INTEGER NOT NULL DEFAULT 0,
  "pagesCreated" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "outcome" TEXT,
  "kpiImproved" TEXT,
  "candidatesEvaluated" INTEGER NOT NULL DEFAULT 0,
  "candidatesApproved" INTEGER NOT NULL DEFAULT 0,
  "candidatesRejected" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "completedAt" DATETIME
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "DailyMission_date_idx" ON "DailyMission"("date");`,
      `CREATE INDEX IF NOT EXISTS "DailyMission_status_idx" ON "DailyMission"("status");`,
    ],
  },
  {
    name: 'FactoryTask',
    createSql: `CREATE TABLE IF NOT EXISTS "FactoryTask" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sourceEngine" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 3,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "rejectionReason" TEXT,
  "governorNotes" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "solvesRealProblem" INTEGER,
  "hasEvidence" INTEGER,
  "fitsArchitecture" INTEGER,
  "existingModuleSolves" INTEGER,
  "improvesKPI" INTEGER,
  "canMeasure" INTEGER,
  "impactScore" REAL NOT NULL DEFAULT 0,
  "estimatedHours" REAL NOT NULL DEFAULT 0,
  "componentsAffected" INTEGER NOT NULL DEFAULT 0,
  "filesChanged" INTEGER NOT NULL DEFAULT 0,
  "targetKPI" TEXT,
  "missionId" TEXT,
  "outcome" TEXT,
  "actualHours" REAL,
  "testsPassed" INTEGER,
  "testsFailed" INTEGER,
  "rollbackNeeded" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "evaluatedAt" DATETIME,
  "completedAt" DATETIME,
  FOREIGN KEY ("missionId") REFERENCES "DailyMission"("id") ON DELETE SET NULL
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "FactoryTask_status_idx" ON "FactoryTask"("status");`,
      `CREATE INDEX IF NOT EXISTS "FactoryTask_sourceEngine_idx" ON "FactoryTask"("sourceEngine");`,
      `CREATE INDEX IF NOT EXISTS "FactoryTask_priority_idx" ON "FactoryTask"("priority");`,
      `CREATE INDEX IF NOT EXISTS "FactoryTask_missionId_idx" ON "FactoryTask"("missionId");`,
    ],
  },
  {
    name: 'GovernorInterception',
    createSql: `CREATE TABLE IF NOT EXISTS "GovernorInterception" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "taskId" TEXT,
  "engineName" TEXT NOT NULL,
  "proposedAction" TEXT NOT NULL,
  "governorQuestion" TEXT NOT NULL,
  "engineResponse" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "reasoning" TEXT NOT NULL,
  "ruleApplied" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GovernorInterception_engineName_idx" ON "GovernorInterception"("engineName");`,
      `CREATE INDEX IF NOT EXISTS "GovernorInterception_outcome_idx" ON "GovernorInterception"("outcome");`,
      `CREATE INDEX IF NOT EXISTS "GovernorInterception_createdAt_idx" ON "GovernorInterception"("createdAt");`,
    ],
  },
  {
    name: 'EngineeringMemory',
    createSql: `CREATE TABLE IF NOT EXISTS "EngineeringMemory" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "taskId" TEXT,
  "missionId" TEXT,
  "feature" TEXT NOT NULL,
  "filesChanged" TEXT NOT NULL,
  "testsAdded" INTEGER NOT NULL DEFAULT 0,
  "testsPassed" INTEGER NOT NULL DEFAULT 0,
  "testsFailed" INTEGER NOT NULL DEFAULT 0,
  "outcome" TEXT NOT NULL,
  "rollbackNeeded" INTEGER NOT NULL DEFAULT 0,
  "performanceDelta" REAL,
  "confidence" REAL NOT NULL DEFAULT 0,
  "patternLearned" TEXT,
  "appliedAgain" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "EngineeringMemory_taskId_idx" ON "EngineeringMemory"("taskId");`,
      `CREATE INDEX IF NOT EXISTS "EngineeringMemory_outcome_idx" ON "EngineeringMemory"("outcome");`,
      `CREATE INDEX IF NOT EXISTS "EngineeringMemory_createdAt_idx" ON "EngineeringMemory"("createdAt");`,
    ],
  },
  {
    name: 'QARun',
    createSql: `CREATE TABLE IF NOT EXISTS "QARun" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "taskId" TEXT,
  "runType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "fixableCount" INTEGER NOT NULL DEFAULT 0,
  "errors" TEXT,
  "warnings" TEXT,
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "timestamp" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "QARun_taskId_idx" ON "QARun"("taskId");`,
      `CREATE INDEX IF NOT EXISTS "QARun_status_idx" ON "QARun"("status");`,
      `CREATE INDEX IF NOT EXISTS "QARun_timestamp_idx" ON "QARun"("timestamp");`,
    ],
  },
  {
    name: 'FactoryChangelog',
    createSql: `CREATE TABLE IF NOT EXISTS "FactoryChangelog" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "version" TEXT NOT NULL,
  "releaseDate" DATETIME NOT NULL DEFAULT (datetime('now')),
  "added" TEXT,
  "fixed" TEXT,
  "breaking" TEXT,
  "migration" TEXT,
  "taskId" TEXT,
  "deployCommit" TEXT,
  "author" TEXT NOT NULL DEFAULT 'AI Software Factory™',
  "filesChanged" INTEGER NOT NULL DEFAULT 0,
  "linesAdded" INTEGER NOT NULL DEFAULT 0,
  "linesRemoved" INTEGER NOT NULL DEFAULT 0
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "FactoryChangelog_version_idx" ON "FactoryChangelog"("version");`,
      `CREATE INDEX IF NOT EXISTS "FactoryChangelog_releaseDate_idx" ON "FactoryChangelog"("releaseDate");`,
    ],
  },
  {
    name: 'CodebaseSnapshot',
    createSql: `CREATE TABLE IF NOT EXISTS "CodebaseSnapshot" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "timestamp" DATETIME NOT NULL DEFAULT (datetime('now')),
  "totalComponents" INTEGER NOT NULL DEFAULT 0,
  "totalAPIRoutes" INTEGER NOT NULL DEFAULT 0,
  "totalPrismaModels" INTEGER NOT NULL DEFAULT 0,
  "totalPages" INTEGER NOT NULL DEFAULT 0,
  "totalHooks" INTEGER NOT NULL DEFAULT 0,
  "totalLibs" INTEGER NOT NULL DEFAULT 0,
  "lintErrors" INTEGER NOT NULL DEFAULT 0,
  "lintWarnings" INTEGER NOT NULL DEFAULT 0,
  "typescriptErrors" INTEGER NOT NULL DEFAULT 0,
  "components" TEXT,
  "apiRoutes" TEXT,
  "prismaModels" TEXT
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "CodebaseSnapshot_timestamp_idx" ON "CodebaseSnapshot"("timestamp");`,
    ],
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if a table with the given name exists in sqlite_master.
 * Uses parameterized query to avoid SQL injection on the table name lookup.
 */
async function tableExistsInMaster(tableName: string): Promise<boolean> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name=?;`,
      tableName,
    )
    const value = rows?.[0]?.c
    if (value === undefined || value === null) return false
    return Number(value) > 0
  } catch {
    return false
  }
}

/**
 * Runs `SELECT COUNT(*) FROM "table"` to verify the table is queryable.
 * Returns the row count, or null if the query fails.
 *
 * tableName comes from a hardcoded TABLE_DDL list (not user input) — safe
 * to interpolate into the SQL string.
 */
async function countRows(tableName: string): Promise<number | null> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) as c FROM "${tableName}";`,
    )
    const value = rows?.[0]?.c
    if (value === undefined || value === null) return null
    return Number(value)
  } catch {
    return null
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  // Mirror the auth pattern in /api/superadmin/auth and /api/superadmin/check:
  // read SUPERADMIN_SECRET with the same default fallback. NEVER leave the
  // endpoint open — even in dev/sandbox the cookie must match the secret.
  const envKey = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'
  const cookieKey = request.cookies.get('superadmin_key')?.value
  return Boolean(cookieKey) && cookieKey === envKey
}

// ─── Migration Runner ──────────────────────────────────────────────────

async function runMigration(): Promise<MigrationResponse> {
  const tables: Record<string, TableResult> = {}
  let totalCreated = 0
  let totalExists = 0
  let totalFailed = 0

  for (const def of TABLE_DDL) {
    const result: TableResult = {
      created: false,
      exists: false,
      indexesCreated: 0,
      indexesTotal: def.indexes.length,
    }

    // 1. Detect pre-existence so we can distinguish "newly created" vs
    //    "already existed" in the response.
    const existedBefore = await tableExistsInMaster(def.name)

    // 2. CREATE TABLE IF NOT EXISTS — wrapped in its own try/catch.
    try {
      await db.$executeRawUnsafe(def.createSql)
      if (existedBefore) {
        result.created = false
        result.exists = true
      } else {
        result.created = true
        result.exists = true
      }
    } catch (err) {
      result.created = false
      result.exists = existedBefore
      result.error = errorMessage(err)
      totalFailed += 1
      tables[def.name] = result
      continue
    }

    // 3. Create indexes — each in its own try/catch (failures are non-fatal).
    for (const indexSql of def.indexes) {
      try {
        await db.$executeRawUnsafe(indexSql)
        result.indexesCreated += 1
      } catch {
        // Index creation failure is non-fatal — table is still usable.
        // Does not increment totalFailed.
      }
    }

    // 4. Verification step — confirm table is queryable.
    const count = await countRows(def.name)
    if (count !== null) {
      result.exists = true
      result.rowCount = count
    } else {
      result.exists = false
      result.error = result.error || 'verification failed: table not queryable'
      totalFailed += 1
    }

    // 5. Update totals (only count as created/existed if verification passed).
    if (result.exists && result.created) {
      totalCreated += 1
    } else if (result.exists && !result.created) {
      totalExists += 1
    }

    tables[def.name] = result
  }

  return {
    ok: totalFailed === 0,
    migratedAt: new Date().toISOString(),
    tables,
    totalCreated,
    totalExists,
    totalFailed,
  }
}

// ─── Route Handlers ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    )
  }
  try {
    const result = await runMigration()
    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage(err),
        migratedAt: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // Support GET for easy browser testing.
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    )
  }
  try {
    const result = await runMigration()
    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage(err),
        migratedAt: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
