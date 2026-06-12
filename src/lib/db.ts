import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ''
  const isTurso = dbUrl.startsWith('libsql://')

  if (isTurso) {
    const adapterConfig: Record<string, unknown> = {
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }
    const adapter = new PrismaLibSql(adapterConfig as ConstructorParameters<typeof PrismaLibSql>[0])
    console.log('[db] Using Turso cloud database')
    return new PrismaClient({ adapter: adapter as ConstructorParameters<typeof PrismaClient>[0] extends { adapter?: infer A } ? A : never, log: ['query'] })
  }

  // Local SQLite (development)
  console.log('[db] Using local SQLite')
  return new PrismaClient({ log: ['query'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
