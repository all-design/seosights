/**
 * Turso Cloud Database Client — Production Only
 * 
 * This file is NOT part of the Next.js app. It's used separately
 * for scripts or production builds where Turbopack isn't involved.
 * 
 * For Vercel deployment, set these env vars:
 * - TURSO_DATABASE_URL=libsql://seosights-db-sdata.aws-eu-west-1.turso.io
 * - TURSO_AUTH_TOKEN=<your-token>
 */
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createTursoClient(): PrismaClient {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  })
  const adapter = new PrismaLibSql(libsql)
  return new PrismaClient({ adapter, log: ['query'] })
}

export const tursoDb = createTursoClient()
