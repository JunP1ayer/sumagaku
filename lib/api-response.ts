/**
 * Enterprise API Response Handler
 * 一流エンジニアによる標準化されたAPIレスポンス管理
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// ================== API Response Types ==================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId?: string
    pagination?: PaginationMetadata
  }
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: any
}

// ================== Error Codes ==================

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business Logic
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  LOCKER_NOT_AVAILABLE: 'LOCKER_NOT_AVAILABLE',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  DAILY_PASS_EXPIRED: 'DAILY_PASS_EXPIRED',
  
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT'
} as const

// ================== Success Response Helpers ==================

export const successResponse = <T>(
  data: T,
  statusCode: number = 200,
  metadata?: Partial<ApiResponse['metadata']>
): NextResponse<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }
  
  return NextResponse.json(response, { status: statusCode })
}

export const createdResponse = <T>(
  data: T,
  metadata?: Partial<ApiResponse['metadata']>
): NextResponse<ApiResponse<T>> => {
  return successResponse(data, 201, metadata)
}

export const noContentResponse = (): NextResponse => {
  return new NextResponse(null, { status: 204 })
}

// ================== Error Response Helpers ==================

export const errorResponse = (
  error: ApiError,
  requestId?: string
): NextResponse<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId
    }
  }
  
  // Log error for monitoring (development only for console output)
  if (process.env.NODE_ENV === 'development') {
    console.error(`API Error [${error.code}]:`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      requestId,
      timestamp: response.metadata?.timestamp
    })
  }
  // TODO: In production, send to monitoring service (Sentry, etc.)
  
  return NextResponse.json(response, { status: error.statusCode })
}

// ================== Specific Error Handlers ==================

export const validationError = (
  message: string = '入力データが無効です',
  details?: any,
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.VALIDATION_ERROR,
    message,
    statusCode: 400,
    details
  }, requestId)
}

export const unauthorizedError = (
  message: string = '認証が必要です',
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.UNAUTHORIZED,
    message,
    statusCode: 401
  }, requestId)
}

export const forbiddenError = (
  message: string = 'アクセス権限がありません',
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.FORBIDDEN,
    message,
    statusCode: 403
  }, requestId)
}

export const notFoundError = (
  resource: string = 'リソース',
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: `${resource}が見つかりません`,
    statusCode: 404
  }, requestId)
}

export const conflictError = (
  message: string = 'リソースが既に存在します',
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.RESOURCE_CONFLICT,
    message,
    statusCode: 409
  }, requestId)
}

export const internalServerError = (
  message: string = 'サーバーエラーが発生しました',
  details?: any,
  requestId?: string
): NextResponse<ApiResponse> => {
  return errorResponse({
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message,
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? details : undefined
  }, requestId)
}

// ================== Error Handler Middleware ==================

export const handleApiError = (
  error: unknown,
  requestId?: string
): NextResponse<ApiResponse> => {
  // Zod validation errors
  if (error instanceof ZodError) {
    return validationError(
      '入力データの検証に失敗しました',
      {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      },
      requestId
    )
  }
  
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return conflictError('このデータは既に存在します', requestId)
      case 'P2025':
        return notFoundError('データ', requestId)
      case 'P2003':
        return validationError('関連するデータが見つかりません', { code: error.code }, requestId)
      default:
        return errorResponse({
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'データベースエラーが発生しました',
          statusCode: 500,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, requestId)
    }
  }
  
  // Custom API errors
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return errorResponse(error as ApiError, requestId)
  }
  
  // Generic errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred'
  return internalServerError(
    '予期しないエラーが発生しました',
    process.env.NODE_ENV === 'development' ? message : undefined,
    requestId
  )
}

// ================== Pagination Helper ==================

export const createPaginationMetadata = (
  page: number,
  limit: number,
  total: number
): PaginationMetadata => {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

export const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): NextResponse<ApiResponse<T[]>> => {
  const pagination = createPaginationMetadata(page, limit, total)
  
  return successResponse(data, statusCode, { pagination })
}

// ================== Request ID Generator ==================

export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}