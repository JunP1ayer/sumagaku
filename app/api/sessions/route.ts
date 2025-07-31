/**
 * Sessions API - Create and List Sessions
 * ロッカーセッション管理システム
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionSchema, paginationSchema } from '@/lib/validations'
import { 
  successResponse, 
  createdResponse, 
  handleApiError, 
  paginatedResponse,
  validationError,
  notFoundError
} from '@/lib/api-response'
import { withAuthenticatedApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'

// ================== Create Session ==================

const createSessionHandler = async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const sessionData = createSessionSchema.parse(body)
    
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    // Check if user has valid daily pass
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const activeDailyPass = await prisma.dailyPass.findFirst({
      where: {
        userId: request.user.id,
        status: 'ACTIVE',
        validDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    if (!activeDailyPass) {
      return validationError('有効な一日券がありません。決済を完了してください。')
    }
    
    // Check if locker is available
    const locker = await prisma.locker.findUnique({
      where: { id: sessionData.lockerId },
      include: {
        sessions: {
          where: {
            status: {
              in: ['ACTIVE', 'EXTENDED']
            }
          }
        }
      }
    })
    
    if (!locker) {
      return notFoundError('ロッカー')
    }
    
    if (locker.status !== 'AVAILABLE' || locker.sessions.length > 0) {
      return validationError('このロッカーは現在利用できません')
    }
    
    // Check if user has active session
    const activeSession = await prisma.session.findFirst({
      where: {
        userId: request.user.id,
        status: {
          in: ['ACTIVE', 'EXTENDED']
        }
      }
    })
    
    if (activeSession) {
      return validationError('既にアクティブなセッションがあります')
    }
    
    // Generate unique unlock code
    const unlockCode = generateUnlockCode()
    
    // Create session and update locker status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.session.create({
        data: {
          userId: request.user!.id,
          lockerNumber: locker.lockerNumber,
          lockerId: sessionData.lockerId,
          plannedDuration: sessionData.plannedDuration,
          unlockCode,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          locker: {
            select: {
              id: true,
              lockerNumber: true,
              location: true,
              qrCode: true
            }
          }
        }
      })
      
      // Update locker status
      await tx.locker.update({
        where: { id: sessionData.lockerId },
        data: {
          status: 'OCCUPIED',
          totalUsages: { increment: 1 }
        }
      })
      
      // Update daily pass usage
      await tx.dailyPass.update({
        where: { id: activeDailyPass.id },
        data: { usageCount: { increment: 1 } }
      })
      
      return session
    })
    
    // Calculate end time
    const endTime = new Date(result.startTime.getTime() + sessionData.plannedDuration * 60 * 1000)
    
    return createdResponse({
      session: {
        id: result.id,
        status: result.status,
        startTime: result.startTime,
        endTime,
        plannedDuration: result.plannedDuration,
        unlockCode: result.unlockCode,
        locker: result.locker,
        user: result.user
      }
    })
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== List Sessions ==================

const listSessionsHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const { searchParams } = request.nextUrl
    const pagination = paginationSchema.parse({
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      sortBy: searchParams.get('sortBy') || 'startTime',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })
    
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build where clause
    const whereClause: any = {
      userId: request.user.id
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (startDate || endDate) {
      whereClause.startTime = {}
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate)
      }
    }
    
    // Get total count
    const total = await prisma.session.count({ where: whereClause })
    
    // Get sessions with pagination
    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        locker: {
          select: {
            id: true,
            lockerNumber: true,
            location: true
          }
        },
        extensions: {
          select: {
            id: true,
            extendedBy: true,
            reason: true,
            timestamp: true
          }
        }
      },
      orderBy: {
        [pagination.sortBy as string]: pagination.sortOrder
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    })
    
    // Calculate derived fields
    const sessionsWithMetadata = sessions.map(session => ({
      ...session,
      endTime: session.endTime || new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000),
      actualDuration: session.actualDuration || (
        session.status === 'COMPLETED' && session.endTime 
          ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 60000)
          : null
      ),
      isActive: ['ACTIVE', 'EXTENDED'].includes(session.status),
      totalExtensionTime: session.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
    }))
    
    return paginatedResponse(
      sessionsWithMetadata,
      pagination.page,
      pagination.limit,
      total
    )
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Helper Functions ==================

const generateUnlockCode = (): string => {
  // Generate 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ================== Route Handlers ==================

export const POST = withAuthenticatedApi(
  withAuditLog('CREATE_SESSION')(createSessionHandler)
)

export const GET = withAuthenticatedApi(
  withAuditLog('LIST_SESSIONS')(listSessionsHandler)
)