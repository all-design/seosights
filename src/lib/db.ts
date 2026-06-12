import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ''
  const isTurso = dbUrl.startsWith('libsql://')

  // PrismaLibSql takes a CONFIG object (url + authToken for Turso)
  const adapterConfig: Record<string, unknown> = {
    url: dbUrl || 'file:./db/custom.db',
  }

  if (isTurso) {
    adapterConfig.authToken = process.env.TURSO_AUTH_TOKEN || undefined
    console.log('[db] Using Turso cloud database')
  } else {
    console.log('[db] Using local SQLite via libsql adapter')
  }

  const adapter = new PrismaLibSql(adapterConfig as ConstructorParameters<typeof PrismaLibSql>[0])
  return new PrismaClient({ adapter, log: ['query'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
