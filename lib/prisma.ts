/**
 * Prisma Database Client
 * Enterprise-grade connection management with optimizations
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // Vercelビルド時の環境変数設定
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy'
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })
}

// Connection pooling optimization for serverless
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Query performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  try {
    (prisma as any).$on('query', (e: any) => {
      console.warn('Query: ' + e.query)
      console.warn('Duration: ' + e.duration + 'ms')
    })
  } catch (error) {
    // Ignore if event monitoring not supported
  }
}

// Error handling
if (process.env.NODE_ENV === 'development') {
  try {
    (prisma as any).$on('error', (e: any) => {
      console.error('Prisma Error:', e)
    })
  } catch (error) {
    // Ignore if event monitoring not supported
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export * from '@prisma/client'