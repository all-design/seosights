/**
 * Cron API — Database Schema Migration
 *
 * GET /api/cron/db-migrate
 *
 * One-time endpoint to push Prisma schema changes to the production Turso database.
 * This is needed because Vercel's build process runs `prisma generate` but NOT `prisma db push`.
 *
 * After calling this endpoint, all new columns/tables in the Prisma schema
 * will exist in the production database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  const vercelHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelHeader && vercelHeader === secret) return true

  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  const results: { table: string; column: string; status: string }[] = []
  const errors: string[] = []

  // List of columns that need to be added to existing tables
  // These are columns added in recent schema updates that may not exist in production
  const migrations: { table: string; column: string; type: string; default?: string }[] = [
    // User table - agency branding columns
    { table: 'User', column: 'agencyAccentColor', type: 'TEXT', default: "'#f59e0b'" },
    { table: 'User', column: 'agencyName', type: 'TEXT' },
    { table: 'User', column: 'agencyLogoUrl', type: 'TEXT' },
    { table: 'User', column: 'agencyPrimaryColor', type: 'TEXT', default: "'#10b981'" },
    { table: 'User', column: 'agencySecondaryColor', type: 'TEXT', default: "'#6B7280'" },
    { table: 'User', column: 'referredByAffiliateId', type: 'TEXT' },
    { table: 'User', column: 'avatarUrl', type: 'TEXT' },
    { table: 'User', column: 'stripeCustomerId', type: 'TEXT' },
    { table: 'User', column: 'stripeSubscriptionId', type: 'TEXT' },
    { table: 'User', column: 'subscriptionStatus', type: 'TEXT', default: "'free_trial'" },
    { table: 'User', column: 'tier', type: 'TEXT', default: "'free_trial'" },
    { table: 'User', column: 'lastLoginAt', type: 'DATETIME' },
    { table: 'User', column: 'passwordHash', type: 'TEXT' },
  ]

  for (const migration of migrations) {
    try {
      const defaultClause = migration.default ? ` DEFAULT ${migration.default}` : ''
      await db.$executeRawUnsafe(
        `ALTER TABLE "${migration.table}" ADD COLUMN "${migration.column}" ${migration.type}${defaultClause}`,
      )
      results.push({ table: migration.table, column: migration.column, status: 'added' })
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        results.push({ table: migration.table, column: migration.column, status: 'already_exists' })
      } else {
        results.push({ table: migration.table, column: migration.column, status: 'error' })
        errors.push(`${migration.table}.${migration.column}: ${msg}`)
      }
    }
  }

  // Also check for new tables that might not exist
  const newTables = [
    'ContentArticle',
    'ObservatoryReport',
    'ObservatoryCrawl',
    'ObservatoryResponse',
    'GrowthOpportunity',
    'GrowthSchedule',
    'InternalContentQueue',
    'Affiliate',
    'AffiliateClick',
    'AffiliatePayout',
    'VisibilityAlert',
    'TokenUsageLog',
    'WebhookConfig',
    'VisibilitySnapshot',
    'CitationEvent',
    'FeedItem',
    'ActionItem',
    'RecommendationSnapshot',
    'ReplaySession',
  ]

  const tableResults: { table: string; status: string }[] = []

  for (const table of newTables) {
    try {
      const count = await db.$executeRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
      tableResults.push({ table, status: 'exists' })
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('no such table')) {
        tableResults.push({ table, status: 'missing_needs_create' })
        errors.push(`Table "${table}" does not exist - needs prisma db push`)
      } else {
        tableResults.push({ table, status: 'exists' })
      }
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    columnMigrations: results,
    tableChecks: tableResults,
    errors: errors.length > 0 ? errors : undefined,
    hint: errors.some(e => e.includes('needs prisma db push'))
      ? 'Some tables are missing. You need to run `prisma db push` against the production database to create them.'
      : undefined,
  })
}
