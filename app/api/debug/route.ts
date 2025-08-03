import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認（パスワードは隠す）
    const dbUrl = process.env.DATABASE_URL || 'Not set'
    const dbUrlMasked = dbUrl.replace(/:[^:@]*@/, ':****@')
    
    // データベース接続テスト
    let dbStatus = 'Unknown'
    let dbError = null
    
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'Connected'
    } catch (error) {
      dbStatus = 'Failed'
      dbError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    return successResponse({
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'Not set',
        DATABASE_URL: dbUrlMasked,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      },
      database: {
        status: dbStatus,
        error: dbError,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return errorResponse({
      code: 'DEBUG_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500
    })
  }
}