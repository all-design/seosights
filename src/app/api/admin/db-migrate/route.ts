/**
 * /api/admin/db-migrate — Self-healing DB migration endpoint
 *
 * Ensures all AI Software Factory™ and Growth Engine™ tables exist in the
 * production Turso (libsql) database, and adds missing columns to tables
 * that were created with an older schema.
 *
 * Phase 1 — CREATE TABLE IF NOT EXISTS:
 *   Runs idempotent DDL that mirrors `prisma/schema.prisma` for every
 *   table. Tables that already exist are left untouched (IF NOT EXISTS).
 *
 * Phase 2 — ALTER TABLE ADD COLUMN (self-healing):
 *   For each table in the COLUMN_SCHEMA map, reads PRAGMA table_info to
 *   discover which columns already exist, then runs ALTER TABLE ADD COLUMN
 *   only for columns that are missing. Each ALTER is wrapped in its own
 *   try/catch so a single failure does not abort the rest.
 *
 * Tables managed here:
 *   Factory tables:
 *     1. DailyMission
 *     2. FactoryTask          (FK -> DailyMission.id ON DELETE SET NULL)
 *     3. GovernorInterception
 *     4. EngineeringMemory
 *     5. QARun
 *     6. FactoryChangelog
 *     7. CodebaseSnapshot
 *   Growth Engine tables:
 *     8. GrowthOpportunity
 *     9. GrowthAsset
 *    10. GrowthGovernorDecision
 *    11. GrowthDailySnapshot
 *    12. GrowthMemory
 *    13. GrowthSchedule
 *    14. GrowthLearning
 *    15. GrowthReport
 *    16. GrowthPruningAction
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
 *   - Each table creation + each index + each ALTER is wrapped in its own
 *     try/catch so a single failure does not abort the rest of the migration.
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

type AlterColumnResult = {
  added: boolean
  alreadyExists: boolean
  error?: string
}

type AlterTableResult = {
  tableName: string
  columnsChecked: number
  columnsAdded: number
  columnsAlreadyExist: number
  columnsFailed: number
  columns: Record<string, AlterColumnResult>
}

type MigrationResponse = {
  ok: boolean
  migratedAt: string
  tables: Record<string, TableResult>
  alterTables: AlterTableResult[]
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
  // ── Factory tables ───────────────────────────────────────────────────
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

  // ── Growth Engine tables ─────────────────────────────────────────────
  {
    name: 'GrowthOpportunity',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthOpportunity" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'content',
  "status" TEXT NOT NULL DEFAULT 'discovered',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "estimatedImpact" REAL NOT NULL DEFAULT 0,
  "confidence" REAL NOT NULL DEFAULT 0,
  "source" TEXT,
  "sourceDetails" TEXT,
  "data" TEXT,
  "seoScore" INTEGER NOT NULL DEFAULT 0,
  "aiVisibilityScore" INTEGER NOT NULL DEFAULT 0,
  "businessScore" INTEGER NOT NULL DEFAULT 0,
  "noveltyScore" INTEGER NOT NULL DEFAULT 0,
  "competitionScore" INTEGER NOT NULL DEFAULT 0,
  "implementationCost" INTEGER NOT NULL DEFAULT 0,
  "expectedROI" INTEGER NOT NULL DEFAULT 0,
  "growthScore" INTEGER NOT NULL DEFAULT 0,
  "targetKeywords" TEXT,
  "targetEntities" TEXT,
  "relatedExisting" TEXT,
  "opportunityId" TEXT,
  "projectId" TEXT,
  "assignedTo" TEXT,
  "dueDate" DATETIME,
  "scheduledAt" DATETIME,
  "discoveredAt" DATETIME,
  "scoredAt" DATETIME,
  "queuedAt" DATETIME,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_status_idx" ON "GrowthOpportunity"("status");`,
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_type_idx" ON "GrowthOpportunity"("type");`,
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_priority_idx" ON "GrowthOpportunity"("priority");`,
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_source_idx" ON "GrowthOpportunity"("source");`,
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_growthScore_idx" ON "GrowthOpportunity"("growthScore");`,
      `CREATE INDEX IF NOT EXISTS "GrowthOpportunity_discoveredAt_idx" ON "GrowthOpportunity"("discoveredAt");`,
    ],
  },
  {
    name: 'GrowthAsset',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthAsset" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT,
  "type" TEXT NOT NULL DEFAULT 'article',
  "content" TEXT,
  "metaDescription" TEXT,
  "schemaMarkup" TEXT,
  "internalLinks" TEXT,
  "reviewStatus" TEXT NOT NULL DEFAULT 'draft',
  "reviewScores" TEXT,
  "reviewNotes" TEXT,
  "executionStatus" TEXT NOT NULL DEFAULT 'pending',
  "publishedUrl" TEXT,
  "qualityScore" REAL NOT NULL DEFAULT 0,
  "confidence" REAL NOT NULL DEFAULT 0,
  "platformValue" REAL NOT NULL DEFAULT 0,
  "traffic24h" INTEGER NOT NULL DEFAULT 0,
  "impressions24h" INTEGER NOT NULL DEFAULT 0,
  "clicks24h" INTEGER NOT NULL DEFAULT 0,
  "citations7d" INTEGER NOT NULL DEFAULT 0,
  "conversions7d" INTEGER NOT NULL DEFAULT 0,
  "aiVisibilityDelta" REAL NOT NULL DEFAULT 0,
  "isUnderperforming" INTEGER NOT NULL DEFAULT 0,
  "opportunityId" TEXT,
  "metadata" TEXT,
  "publishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthAsset_reviewStatus_idx" ON "GrowthAsset"("reviewStatus");`,
      `CREATE INDEX IF NOT EXISTS "GrowthAsset_executionStatus_idx" ON "GrowthAsset"("executionStatus");`,
      `CREATE INDEX IF NOT EXISTS "GrowthAsset_type_idx" ON "GrowthAsset"("type");`,
      `CREATE INDEX IF NOT EXISTS "GrowthAsset_opportunityId_idx" ON "GrowthAsset"("opportunityId");`,
      `CREATE INDEX IF NOT EXISTS "GrowthAsset_publishedAt_idx" ON "GrowthAsset"("publishedAt");`,
    ],
  },
  {
    name: 'GrowthGovernorDecision',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthGovernorDecision" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "assetId" TEXT,
  "opportunityId" TEXT,
  "decisionType" TEXT NOT NULL,
  "context" TEXT,
  "decision" TEXT NOT NULL,
  "reason" TEXT,
  "details" TEXT,
  "reasoning" TEXT,
  "checksPerformed" TEXT,
  "checkResults" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "impact" TEXT,
  "isAutomated" INTEGER NOT NULL DEFAULT 1,
  "overrideable" INTEGER NOT NULL DEFAULT 1,
  "overriddenBy" TEXT,
  "overriddenAt" DATETIME,
  "approvedBy" TEXT,
  "approvedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthGovernorDecision_decision_idx" ON "GrowthGovernorDecision"("decision");`,
      `CREATE INDEX IF NOT EXISTS "GrowthGovernorDecision_assetId_idx" ON "GrowthGovernorDecision"("assetId");`,
      `CREATE INDEX IF NOT EXISTS "GrowthGovernorDecision_opportunityId_idx" ON "GrowthGovernorDecision"("opportunityId");`,
      `CREATE INDEX IF NOT EXISTS "GrowthGovernorDecision_createdAt_idx" ON "GrowthGovernorDecision"("createdAt");`,
    ],
  },
  {
    name: 'GrowthDailySnapshot',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthDailySnapshot" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "date" DATETIME NOT NULL UNIQUE,
  "dailyBudget" REAL NOT NULL DEFAULT 20,
  "assetsPublished" INTEGER NOT NULL DEFAULT 0,
  "assetsRejected" INTEGER NOT NULL DEFAULT 0,
  "assetsMerged" INTEGER NOT NULL DEFAULT 0,
  "assetsArchived" INTEGER NOT NULL DEFAULT 0,
  "avgQualityScore" REAL NOT NULL DEFAULT 0,
  "avgConfidence" REAL NOT NULL DEFAULT 0,
  "aiVisibilityGain" REAL NOT NULL DEFAULT 0,
  "citationGain" INTEGER NOT NULL DEFAULT 0,
  "entityGrowth" INTEGER NOT NULL DEFAULT 0,
  "organicGrowth" REAL NOT NULL DEFAULT 0,
  "knowledgeCoverage" REAL NOT NULL DEFAULT 0,
  "platformValueAdded" REAL NOT NULL DEFAULT 0,
  "byTypeBreakdown" TEXT NOT NULL DEFAULT '{}',
  "predictionAccuracy" REAL NOT NULL DEFAULT 0,
  "successfulRate" REAL NOT NULL DEFAULT 0,
  "isSimulated" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthDailySnapshot_date_idx" ON "GrowthDailySnapshot"("date");`,
    ],
  },
  {
    name: 'GrowthMemory',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthMemory" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "domain" TEXT NOT NULL DEFAULT 'seosights.com',
  "actionType" TEXT NOT NULL,
  "actionDetail" TEXT NOT NULL,
  "targetEntity" TEXT,
  "visibilityDelta" INTEGER NOT NULL DEFAULT 0,
  "citationDelta" INTEGER NOT NULL DEFAULT 0,
  "organicDelta" INTEGER NOT NULL DEFAULT 0,
  "leadDelta" INTEGER NOT NULL DEFAULT 0,
  "revenueDelta" REAL NOT NULL DEFAULT 0,
  "measuredAt" DATETIME,
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "articleId" TEXT,
  "briefId" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_domain_idx" ON "GrowthMemory"("domain");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_actionType_idx" ON "GrowthMemory"("actionType");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_targetEntity_idx" ON "GrowthMemory"("targetEntity");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_measuredAt_idx" ON "GrowthMemory"("measuredAt");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_createdAt_idx" ON "GrowthMemory"("createdAt");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_domain_actionType_idx" ON "GrowthMemory"("domain","actionType");`,
      `CREATE INDEX IF NOT EXISTS "GrowthMemory_domain_createdAt_idx" ON "GrowthMemory"("domain","createdAt");`,
    ],
  },
  {
    name: 'GrowthSchedule',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthSchedule" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "engineName" TEXT NOT NULL UNIQUE,
  "intervalMinutes" INTEGER NOT NULL DEFAULT 30,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastRunAt" DATETIME,
  "lastRunStatus" TEXT,
  "lastRunDuration" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" DATETIME,
  "configJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthSchedule_engineName_idx" ON "GrowthSchedule"("engineName");`,
      `CREATE INDEX IF NOT EXISTS "GrowthSchedule_isEnabled_idx" ON "GrowthSchedule"("isEnabled");`,
      `CREATE INDEX IF NOT EXISTS "GrowthSchedule_nextRunAt_idx" ON "GrowthSchedule"("nextRunAt");`,
    ],
  },
  {
    name: 'GrowthLearning',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthLearning" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "assetId" TEXT,
  "predictedTraffic" INTEGER NOT NULL DEFAULT 0,
  "predictedCitations" INTEGER NOT NULL DEFAULT 0,
  "predictedVisibility" REAL NOT NULL DEFAULT 0,
  "predictedValue" REAL NOT NULL DEFAULT 0,
  "predictionConfidence" REAL NOT NULL DEFAULT 0,
  "actualTraffic" INTEGER NOT NULL DEFAULT 0,
  "actualCitations" INTEGER NOT NULL DEFAULT 0,
  "actualVisibility" REAL NOT NULL DEFAULT 0,
  "actualValue" REAL NOT NULL DEFAULT 0,
  "predictionError" REAL NOT NULL DEFAULT 0,
  "errorDirection" TEXT,
  "lessonLearned" TEXT,
  "modelUpdate" TEXT,
  "appliedToNextPrediction" INTEGER NOT NULL DEFAULT 0,
  "measuredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthLearning_assetId_idx" ON "GrowthLearning"("assetId");`,
      `CREATE INDEX IF NOT EXISTS "GrowthLearning_errorDirection_idx" ON "GrowthLearning"("errorDirection");`,
      `CREATE INDEX IF NOT EXISTS "GrowthLearning_measuredAt_idx" ON "GrowthLearning"("measuredAt");`,
      `CREATE INDEX IF NOT EXISTS "GrowthLearning_createdAt_idx" ON "GrowthLearning"("createdAt");`,
    ],
  },
  {
    name: 'GrowthReport',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthReport" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "date" DATETIME NOT NULL UNIQUE,
  "headline" TEXT,
  "summary" TEXT,
  "assetsAdded" INTEGER NOT NULL DEFAULT 0,
  "expectedImpact" TEXT,
  "topOpportunities" TEXT,
  "governorSummary" TEXT,
  "learningInsights" TEXT,
  "recommendations" TEXT,
  "reportContent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthReport_date_idx" ON "GrowthReport"("date");`,
    ],
  },
  {
    name: 'GrowthPruningAction',
    createSql: `CREATE TABLE IF NOT EXISTS "GrowthPruningAction" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "assetId" TEXT,
  "traffic30d" INTEGER NOT NULL DEFAULT 0,
  "citations30d" INTEGER NOT NULL DEFAULT 0,
  "aiVisibilityDelta" REAL NOT NULL DEFAULT 0,
  "qualityScore" INTEGER NOT NULL DEFAULT 0,
  "platformValue" REAL NOT NULL DEFAULT 0,
  "action" TEXT,
  "reason" TEXT,
  "targetAssetId" TEXT,
  "status" TEXT,
  "executedAt" DATETIME,
  "executedBy" TEXT,
  "result" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
);`,
    indexes: [
      `CREATE INDEX IF NOT EXISTS "GrowthPruningAction_assetId_idx" ON "GrowthPruningAction"("assetId");`,
      `CREATE INDEX IF NOT EXISTS "GrowthPruningAction_status_idx" ON "GrowthPruningAction"("status");`,
      `CREATE INDEX IF NOT EXISTS "GrowthPruningAction_action_idx" ON "GrowthPruningAction"("action");`,
      `CREATE INDEX IF NOT EXISTS "GrowthPruningAction_createdAt_idx" ON "GrowthPruningAction"("createdAt");`,
    ],
  },
]

// ─── Column Schema Map (Phase 2 — ALTER TABLE) ────────────────────────
// Maps each table name to its expected columns with their SQLite type
// and DEFAULT clause. This is used by the self-healing Phase 2 migration
// to detect missing columns via PRAGMA table_info and add them.
//
// Only tables that are likely to have been created with an older/incomplete
// schema (e.g. on Turso production) need entries here. Factory tables that
// are always created from scratch via Phase 1 don't need ALTER entries,
// but they're included for completeness so the endpoint is fully self-healing.
//
// Format: { tableName: { columnName: { type, default } } }
// Boolean columns use INTEGER type (SQLite convention).
// DateTime columns use DATETIME type (stored as TEXT in SQLite).

type ColumnSpec = {
  type: string           // SQLite column type (TEXT, INTEGER, REAL, DATETIME, etc.)
  notNull: boolean       // Whether the column is NOT NULL
  default?: string       // DEFAULT clause value (SQLite syntax, e.g. '0', "'medium'", "(datetime('now'))")
}

const COLUMN_SCHEMA: Record<string, Record<string, ColumnSpec>> = {
  // ── GrowthOpportunity — the table that was missing many columns ──────
  GrowthOpportunity: {
    id:                { type: 'TEXT',      notNull: true,  default: undefined },
    title:             { type: 'TEXT',      notNull: true,  default: undefined },
    description:       { type: 'TEXT',      notNull: false, default: undefined },
    type:              { type: 'TEXT',      notNull: true,  default: "'content'" },
    status:            { type: 'TEXT',      notNull: true,  default: "'discovered'" },
    priority:          { type: 'TEXT',      notNull: true,  default: "'medium'" },
    estimatedImpact:   { type: 'REAL',      notNull: true,  default: '0' },
    confidence:        { type: 'REAL',      notNull: true,  default: '0' },
    source:            { type: 'TEXT',      notNull: false, default: undefined },
    sourceDetails:     { type: 'TEXT',      notNull: false, default: undefined },
    data:              { type: 'TEXT',      notNull: false, default: undefined },
    seoScore:          { type: 'INTEGER',   notNull: true,  default: '0' },
    aiVisibilityScore: { type: 'INTEGER',   notNull: true,  default: '0' },
    businessScore:     { type: 'INTEGER',   notNull: true,  default: '0' },
    noveltyScore:      { type: 'INTEGER',   notNull: true,  default: '0' },
    competitionScore:  { type: 'INTEGER',   notNull: true,  default: '0' },
    implementationCost:{ type: 'INTEGER',   notNull: true,  default: '0' },
    expectedROI:       { type: 'INTEGER',   notNull: true,  default: '0' },
    growthScore:       { type: 'INTEGER',   notNull: true,  default: '0' },
    targetKeywords:    { type: 'TEXT',      notNull: false, default: undefined },
    targetEntities:    { type: 'TEXT',      notNull: false, default: undefined },
    relatedExisting:   { type: 'TEXT',      notNull: false, default: undefined },
    opportunityId:     { type: 'TEXT',      notNull: false, default: undefined },
    projectId:         { type: 'TEXT',      notNull: false, default: undefined },
    assignedTo:        { type: 'TEXT',      notNull: false, default: undefined },
    dueDate:           { type: 'DATETIME',  notNull: false, default: undefined },
    scheduledAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    discoveredAt:      { type: 'DATETIME',  notNull: false, default: undefined },
    scoredAt:          { type: 'DATETIME',  notNull: false, default: undefined },
    queuedAt:          { type: 'DATETIME',  notNull: false, default: undefined },
    startedAt:         { type: 'DATETIME',  notNull: false, default: undefined },
    completedAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    createdAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthAsset — missing slug, metaDescription, schemaMarkup, etc. ─
  GrowthAsset: {
    id:                { type: 'TEXT',      notNull: true,  default: undefined },
    title:             { type: 'TEXT',      notNull: true,  default: undefined },
    slug:              { type: 'TEXT',      notNull: false, default: undefined },
    type:              { type: 'TEXT',      notNull: true,  default: "'article'" },
    content:           { type: 'TEXT',      notNull: false, default: undefined },
    metaDescription:   { type: 'TEXT',      notNull: false, default: undefined },
    schemaMarkup:      { type: 'TEXT',      notNull: false, default: undefined },
    internalLinks:     { type: 'TEXT',      notNull: false, default: undefined },
    reviewStatus:      { type: 'TEXT',      notNull: true,  default: "'draft'" },
    reviewScores:      { type: 'TEXT',      notNull: false, default: undefined },
    reviewNotes:       { type: 'TEXT',      notNull: false, default: undefined },
    executionStatus:   { type: 'TEXT',      notNull: true,  default: "'pending'" },
    publishedUrl:      { type: 'TEXT',      notNull: false, default: undefined },
    qualityScore:      { type: 'REAL',      notNull: true,  default: '0' },
    confidence:        { type: 'REAL',      notNull: true,  default: '0' },
    platformValue:     { type: 'REAL',      notNull: true,  default: '0' },
    traffic24h:        { type: 'INTEGER',   notNull: true,  default: '0' },
    impressions24h:    { type: 'INTEGER',   notNull: true,  default: '0' },
    clicks24h:         { type: 'INTEGER',   notNull: true,  default: '0' },
    citations7d:       { type: 'INTEGER',   notNull: true,  default: '0' },
    conversions7d:     { type: 'INTEGER',   notNull: true,  default: '0' },
    aiVisibilityDelta: { type: 'REAL',      notNull: true,  default: '0' },
    isUnderperforming: { type: 'INTEGER',   notNull: true,  default: '0' },
    opportunityId:     { type: 'TEXT',      notNull: false, default: undefined },
    metadata:          { type: 'TEXT',      notNull: false, default: undefined },
    publishedAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    createdAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthGovernorDecision — missing assetId, opportunityId, etc. ────
  GrowthGovernorDecision: {
    id:               { type: 'TEXT',      notNull: true,  default: undefined },
    assetId:          { type: 'TEXT',      notNull: false, default: undefined },
    opportunityId:    { type: 'TEXT',      notNull: false, default: undefined },
    decisionType:     { type: 'TEXT',      notNull: true,  default: undefined },
    context:          { type: 'TEXT',      notNull: false, default: undefined },
    decision:         { type: 'TEXT',      notNull: true,  default: undefined },
    reason:           { type: 'TEXT',      notNull: false, default: undefined },
    details:          { type: 'TEXT',      notNull: false, default: undefined },
    reasoning:        { type: 'TEXT',      notNull: false, default: undefined },
    checksPerformed:  { type: 'TEXT',      notNull: false, default: undefined },
    checkResults:     { type: 'TEXT',      notNull: false, default: undefined },
    confidence:       { type: 'REAL',      notNull: true,  default: '0' },
    impact:           { type: 'TEXT',      notNull: false, default: undefined },
    isAutomated:      { type: 'INTEGER',   notNull: true,  default: '1' },
    overrideable:     { type: 'INTEGER',   notNull: true,  default: '1' },
    overriddenBy:     { type: 'TEXT',      notNull: false, default: undefined },
    overriddenAt:     { type: 'DATETIME',  notNull: false, default: undefined },
    approvedBy:       { type: 'TEXT',      notNull: false, default: undefined },
    approvedAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    createdAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthDailySnapshot ──────────────────────────────────────────────
  GrowthDailySnapshot: {
    id:                { type: 'TEXT',      notNull: true,  default: undefined },
    date:              { type: 'DATETIME',  notNull: true,  default: undefined },
    dailyBudget:       { type: 'REAL',      notNull: true,  default: '20' },
    assetsPublished:   { type: 'INTEGER',   notNull: true,  default: '0' },
    assetsRejected:    { type: 'INTEGER',   notNull: true,  default: '0' },
    assetsMerged:      { type: 'INTEGER',   notNull: true,  default: '0' },
    assetsArchived:    { type: 'INTEGER',   notNull: true,  default: '0' },
    avgQualityScore:   { type: 'REAL',      notNull: true,  default: '0' },
    avgConfidence:     { type: 'REAL',      notNull: true,  default: '0' },
    aiVisibilityGain:  { type: 'REAL',      notNull: true,  default: '0' },
    citationGain:      { type: 'INTEGER',   notNull: true,  default: '0' },
    entityGrowth:      { type: 'INTEGER',   notNull: true,  default: '0' },
    organicGrowth:     { type: 'REAL',      notNull: true,  default: '0' },
    knowledgeCoverage: { type: 'REAL',      notNull: true,  default: '0' },
    platformValueAdded:{ type: 'REAL',      notNull: true,  default: '0' },
    byTypeBreakdown:   { type: 'TEXT',      notNull: true,  default: "'{}'" },
    predictionAccuracy:{ type: 'REAL',      notNull: true,  default: '0' },
    successfulRate:    { type: 'REAL',      notNull: true,  default: '0' },
    isSimulated:       { type: 'INTEGER',   notNull: true,  default: '0' },
    createdAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:         { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthSchedule ───────────────────────────────────────────────────
  GrowthSchedule: {
    id:              { type: 'TEXT',      notNull: true,  default: undefined },
    engineName:      { type: 'TEXT',      notNull: true,  default: undefined },
    intervalMinutes: { type: 'INTEGER',   notNull: true,  default: '30' },
    isEnabled:       { type: 'INTEGER',   notNull: true,  default: '1' },
    lastRunAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    lastRunStatus:   { type: 'TEXT',      notNull: false, default: undefined },
    lastRunDuration: { type: 'INTEGER',   notNull: true,  default: '0' },
    nextRunAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    configJson:      { type: 'TEXT',      notNull: false, default: undefined },
    createdAt:       { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:       { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthLearning ───────────────────────────────────────────────────
  GrowthLearning: {
    id:                      { type: 'TEXT',      notNull: true,  default: undefined },
    assetId:                 { type: 'TEXT',      notNull: false, default: undefined },
    predictedTraffic:        { type: 'INTEGER',   notNull: true,  default: '0' },
    predictedCitations:      { type: 'INTEGER',   notNull: true,  default: '0' },
    predictedVisibility:     { type: 'REAL',      notNull: true,  default: '0' },
    predictedValue:          { type: 'REAL',      notNull: true,  default: '0' },
    predictionConfidence:    { type: 'REAL',      notNull: true,  default: '0' },
    actualTraffic:           { type: 'INTEGER',   notNull: true,  default: '0' },
    actualCitations:         { type: 'INTEGER',   notNull: true,  default: '0' },
    actualVisibility:        { type: 'REAL',      notNull: true,  default: '0' },
    actualValue:             { type: 'REAL',      notNull: true,  default: '0' },
    predictionError:         { type: 'REAL',      notNull: true,  default: '0' },
    errorDirection:          { type: 'TEXT',      notNull: false, default: undefined },
    lessonLearned:           { type: 'TEXT',      notNull: false, default: undefined },
    modelUpdate:             { type: 'TEXT',      notNull: false, default: undefined },
    appliedToNextPrediction: { type: 'INTEGER',   notNull: true,  default: '0' },
    measuredAt:              { type: 'DATETIME',  notNull: false, default: undefined },
    createdAt:               { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:               { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthReport ─────────────────────────────────────────────────────
  GrowthReport: {
    id:               { type: 'TEXT',      notNull: true,  default: undefined },
    date:             { type: 'DATETIME',  notNull: true,  default: undefined },
    headline:         { type: 'TEXT',      notNull: false, default: undefined },
    summary:          { type: 'TEXT',      notNull: false, default: undefined },
    assetsAdded:      { type: 'INTEGER',   notNull: true,  default: '0' },
    expectedImpact:   { type: 'TEXT',      notNull: false, default: undefined },
    topOpportunities: { type: 'TEXT',      notNull: false, default: undefined },
    governorSummary:  { type: 'TEXT',      notNull: false, default: undefined },
    learningInsights: { type: 'TEXT',      notNull: false, default: undefined },
    recommendations:  { type: 'TEXT',      notNull: false, default: undefined },
    reportContent:    { type: 'TEXT',      notNull: false, default: undefined },
    createdAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },

  // ── GrowthPruningAction ──────────────────────────────────────────────
  GrowthPruningAction: {
    id:               { type: 'TEXT',      notNull: true,  default: undefined },
    assetId:          { type: 'TEXT',      notNull: false, default: undefined },
    traffic30d:       { type: 'INTEGER',   notNull: true,  default: '0' },
    citations30d:     { type: 'INTEGER',   notNull: true,  default: '0' },
    aiVisibilityDelta:{ type: 'REAL',      notNull: true,  default: '0' },
    qualityScore:     { type: 'INTEGER',   notNull: true,  default: '0' },
    platformValue:    { type: 'REAL',      notNull: true,  default: '0' },
    action:           { type: 'TEXT',      notNull: false, default: undefined },
    reason:           { type: 'TEXT',      notNull: false, default: undefined },
    targetAssetId:    { type: 'TEXT',      notNull: false, default: undefined },
    status:           { type: 'TEXT',      notNull: false, default: undefined },
    executedAt:       { type: 'DATETIME',  notNull: false, default: undefined },
    executedBy:       { type: 'TEXT',      notNull: false, default: undefined },
    result:           { type: 'TEXT',      notNull: false, default: undefined },
    createdAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
    updatedAt:        { type: 'DATETIME',  notNull: true,  default: "(datetime('now'))" },
  },
}

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
 * Reads PRAGMA table_info for the given table and returns a Set of column
 * names that already exist. This is used by Phase 2 to detect missing columns
 * before running ALTER TABLE ADD COLUMN.
 *
 * tableName comes from hardcoded COLUMN_SCHEMA keys (not user input) — safe
 * to interpolate into the SQL string.
 */
async function getExistingColumns(tableName: string): Promise<Set<string>> {
  try {
    // PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
    const rows = await db.$queryRawUnsafe<
      Array<{ name: string; type: string; notnull: number; dflt_value: string | null; pk: number }>
    >(`PRAGMA table_info("${tableName}");`)
    const names = new Set<string>()
    for (const row of rows) {
      names.add(row.name)
    }
    return names
  } catch {
    // Table doesn't exist or PRAGMA failed — return empty set so Phase 2
    // will try to add all columns (which will also fail gracefully per-column).
    return new Set<string>()
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

/**
 * Builds an ALTER TABLE ADD COLUMN SQL statement from a column name and spec.
 * SQLite ALTER TABLE ADD COLUMN requires the column to be nullable OR have a
 * DEFAULT value (since existing rows need a value). We always include a DEFAULT
 * for NOT NULL columns; nullable columns don't need one.
 */
function buildAlterSql(tableName: string, columnName: string, spec: ColumnSpec): string {
  const parts: string[] = [`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${spec.type}`]

  if (spec.notNull && spec.default !== undefined) {
    // SQLite ALTER TABLE ADD COLUMN cannot use non-constant defaults like
    // (datetime('now')). Replace with a static ISO timestamp string.
    const safeDefault = spec.default === "(datetime('now'))"
      ? "'2026-01-01T00:00:00Z'"
      : spec.default
    parts.push(`NOT NULL DEFAULT ${safeDefault}`)
  } else if (spec.notNull && spec.default === undefined) {
    // NOT NULL without DEFAULT — SQLite requires a default for ALTER ADD COLUMN
    // on non-empty tables. Use a sensible fallback:
    //   TEXT → '' (empty string), INTEGER → 0, REAL → 0, DATETIME → static timestamp
    const fallback = spec.type === 'TEXT' ? "''"
      : spec.type === 'INTEGER' ? '0'
      : spec.type === 'REAL' ? '0'
      : spec.type === 'DATETIME' ? "'2026-01-01T00:00:00Z'"
      : "''"
    parts.push(`NOT NULL DEFAULT ${fallback}`)
  } else if (!spec.notNull && spec.default !== undefined) {
    // Same fix: replace (datetime('now')) with static timestamp
    const safeDefault = spec.default === "(datetime('now'))"
      ? "'2026-01-01T00:00:00Z'"
      : spec.default
    parts.push(`DEFAULT ${safeDefault}`)
  }
  // nullable without default → no DEFAULT clause (NULL is implied)

  return parts.join(' ')
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
  const alterTables: AlterTableResult[] = []
  let totalCreated = 0
  let totalExists = 0
  let totalFailed = 0

  // ── Phase 1: CREATE TABLE IF NOT EXISTS ───────────────────────────────
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

  // ── Phase 2: ALTER TABLE ADD COLUMN (self-healing) ────────────────────
  // For each table in COLUMN_SCHEMA, read PRAGMA table_info to discover
  // existing columns, then add any missing columns via ALTER TABLE.
  for (const [tableName, expectedColumns] of Object.entries(COLUMN_SCHEMA)) {
    const alterResult: AlterTableResult = {
      tableName,
      columnsChecked: Object.keys(expectedColumns).length,
      columnsAdded: 0,
      columnsAlreadyExist: 0,
      columnsFailed: 0,
      columns: {},
    }

    // Skip tables that don't exist yet — Phase 1 already created them with
    // full schema, so no ALTER is needed. If Phase 1 failed to create the
    // table, ALTER will also fail (handled gracefully per-column).
    const tableExists = await tableExistsInMaster(tableName)
    if (!tableExists) {
      // Phase 1 should have created this table; if it didn't, all ALTER
      // attempts will fail anyway. Skip to avoid unnecessary errors.
      alterTables.push(alterResult)
      continue
    }

    const existingColumns = await getExistingColumns(tableName)

    for (const [columnName, spec] of Object.entries(expectedColumns)) {
      if (existingColumns.has(columnName)) {
        alterResult.columns[columnName] = {
          added: false,
          alreadyExists: true,
        }
        alterResult.columnsAlreadyExist += 1
        continue
      }

      // Column doesn't exist — add it via ALTER TABLE
      const alterSql = buildAlterSql(tableName, columnName, spec)
      try {
        await db.$executeRawUnsafe(alterSql)
        alterResult.columns[columnName] = {
          added: true,
          alreadyExists: false,
        }
        alterResult.columnsAdded += 1
      } catch (err) {
        alterResult.columns[columnName] = {
          added: false,
          alreadyExists: false,
          error: errorMessage(err),
        }
        alterResult.columnsFailed += 1
        // Don't increment totalFailed — ALTER failures are non-fatal
        // (the table still works, just missing that column).
      }
    }

    alterTables.push(alterResult)
  }

  return {
    ok: totalFailed === 0,
    migratedAt: new Date().toISOString(),
    tables,
    alterTables,
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
