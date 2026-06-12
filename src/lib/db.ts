import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ''
  const isTurso = dbUrl.startsWith('libsql://')

  if (isTurso) {
    // Use require() for the adapter — this avoids Turbopack's static analysis
    // which fails to bundle @prisma/adapter-libsql correctly.
    // The package is listed in serverExternalPackages in next.config.ts,
    // so it will be available at runtime on the server.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSql } = require('@prisma/adapter-libsql') as { PrismaLibSql: new (config: Record<string, unknown>) => unknown }
      const adapter = new PrismaLibSql({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
      })
      console.log('[db] Using Turso cloud database')
      return new PrismaClient({ adapter: adapter as ConstructorParameters<typeof PrismaClient>[0] extends { adapter?: infer A } ? A : never, log: ['query'] })
    } catch (err) {
      console.error('[db] Failed to load Turso adapter, falling back to plain SQLite:', err instanceof Error ? err.message : 'Unknown')
    }
  }

  // Local SQLite (development)
  console.log('[db] Using local SQLite')
  return new PrismaClient({ log: ['query'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
