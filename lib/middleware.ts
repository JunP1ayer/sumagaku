/**
 * Enterprise API Middleware
 * セキュリティ、認証、レート制限、監査ログ
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { generateRequestId, unauthorizedError, forbiddenError, errorResponse, ERROR_CODES } from './api-response'

// ================== Types ==================

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name?: string
    role: string
    status: string
  }
  requestId?: string
}

export interface RateLimitOptions {
  windowMs: number // 時間窓（ミリ秒）
  maxRequests: number // 最大リクエスト数
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// ================== Request ID Middleware ==================

export const withRequestId = (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
  return async (request: NextRequest, context?: any) => {
    const requestId = generateRequestId()
    ;(request as AuthenticatedRequest).requestId = requestId
    
    // Add to response headers
    const response = await handler(request, context)
    if (response instanceof NextResponse) {
      response.headers.set('X-Request-ID', requestId)
    }
    
    return response
  }
}

// ================== CORS Middleware ==================

export const withCors = (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
  return async (request: NextRequest, context?: any) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      })
    }
    
    const response = await handler(request, context)
    
    // Add CORS headers to response
    if (response instanceof NextResponse) {
      response.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
}

// ================== Authentication Middleware ==================

export const withAuth = (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
  return async (request: AuthenticatedRequest, context?: any) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorizedError('認証トークンが必要です', request.requestId)
      }
      
      const token = authHeader.substring(7)
      
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured')
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLoginAt: true
        }
      })
      
      if (!user) {
        return unauthorizedError('ユーザーが見つかりません', request.requestId)
      }
      
      if (user.status !== 'ACTIVE') {
        return forbiddenError('アカウントが無効です', request.requestId)
      }
      
      // Attach user to request
      request.user = user
      
      // Update last login time (async, don't wait)
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      }).catch(console.error)
      
      return handler(request, context)
      
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return unauthorizedError('無効な認証トークンです', request.requestId)
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return unauthorizedError('認証トークンの有効期限が切れました', request.requestId)
      }
      
      console.error('Authentication error:', error)
      return unauthorizedError('認証エラーが発生しました', request.requestId)
    }
  }
}

// ================== Authorization Middleware ==================

export const withRole = (allowedRoles: string[]) => {
  return (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
    return async (request: AuthenticatedRequest, context?: any) => {
      if (!request.user) {
        return unauthorizedError('認証が必要です', request.requestId)
      }
      
      if (!allowedRoles.includes(request.user.role)) {
        return forbiddenError('この操作を実行する権限がありません', request.requestId)
      }
      
      return handler(request, context)
    }
  }
}

// ================== Rate Limiting ==================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const withRateLimit = (options: RateLimitOptions) => {
  return (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
    return async (request: AuthenticatedRequest, context?: any) => {
      const ip = request.ip || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown'
      const key = `${ip}:${request.nextUrl.pathname}`
      const now = Date.now()
      
      const record = rateLimitStore.get(key)
      
      if (!record || now > record.resetTime) {
        // Reset or create new record
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + options.windowMs
        })
      } else {
        // Increment count
        record.count++
        
        if (record.count > options.maxRequests) {
          return errorResponse({
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'リクエスト制限に達しました。しばらく待ってから再試行してください。',
            statusCode: 429,
            details: {
              limit: options.maxRequests,
              windowMs: options.windowMs,
              retryAfter: Math.ceil((record.resetTime - now) / 1000)
            }
          }, request.requestId)
        }
      }
      
      // Clean up old records periodically
      if (Math.random() < 0.01) { // 1% chance
        const cutoff = now - options.windowMs
        const entries = Array.from(rateLimitStore.entries())
        for (const [key, record] of entries) {
          if (record.resetTime < cutoff) {
            rateLimitStore.delete(key)
          }
        }
      }
      
      return handler(request, context)
    }
  }
}

// ================== Audit Logging Middleware ==================

export const withAuditLog = (action: string) => {
  return (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
    return async (request: AuthenticatedRequest, context?: any) => {
      const startTime = Date.now()
      const requestBody = request.method !== 'GET' ? await request.clone().text() : null
      
      try {
        const response = await handler(request, context)
        const duration = Date.now() - startTime
        
        // Log successful request (async, don't wait)
        logAudit({
          userId: request.user?.id,
          action,
          resource: request.nextUrl.pathname,
          resourceId: context?.params?.id,
          details: {
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            ip: request.ip || request.headers.get('x-real-ip'),
            duration,
            requestBody: requestBody ? JSON.parse(requestBody) : null
          },
          success: true,
          requestId: request.requestId
        }).catch(console.error)
        
        return response
        
      } catch (error) {
        const duration = Date.now() - startTime
        
        // Log failed request (async, don't wait)
        logAudit({
          userId: request.user?.id,
          action,
          resource: request.nextUrl.pathname,
          resourceId: context?.params?.id,
          details: {
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            ip: request.ip || request.headers.get('x-real-ip'),
            duration,
            requestBody: requestBody ? JSON.parse(requestBody) : null
          },
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          requestId: request.requestId
        }).catch(console.error)
        
        throw error
      }
    }
  }
}

// ================== Audit Log Helper ==================

interface AuditLogData {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details: any
  success: boolean
  errorMessage?: string
  requestId?: string
}

const logAudit = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        success: data.success,
        errorMessage: data.errorMessage,
        ipAddress: data.details.ip,
        userAgent: data.details.userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

// ================== Compose Middlewares ==================

export const compose = (...middlewares: ((handler: (req: NextRequest, ctx?: any) => Promise<any>) => (req: NextRequest, ctx?: any) => Promise<any>)[]) => {
  return (handler: (req: NextRequest, ctx?: any) => Promise<any>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// ================== Common Middleware Combinations ==================

export const withApiMiddleware = compose(
  withRequestId,
  withCors
)

export const withAuthenticatedApi = compose(
  withRequestId,
  withCors,
  withAuth,
  withRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 }) // 15分で100リクエスト
)

export const withAdminApi = compose(
  withRequestId,
  withCors,
  withAuth,
  withRole(['ADMIN', 'SUPER_ADMIN']),
  withRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 200 }) // 管理者は多め
)