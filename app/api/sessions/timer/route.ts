/**
 * Session Timer Status API
 * セッションタイマー状態取得API
 */

import { NextRequest } from 'next/server'
import { sessionTimerManager } from '@/lib/session-timer'
import { 
  successResponse, 
  handleApiError,
  notFoundError
} from '@/lib/api-response'
import { withAuthenticatedApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// ================== Get Session Timer Status ==================

const getSessionTimerStatusHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const { searchParams } = request.nextUrl
    const sessionId = searchParams.get('sessionId')
    
    if (sessionId) {
      // 特定セッションの残り時間を取得
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          locker: {
            select: {
              id: true,
              lockerNumber: true,
              location: true
            }
          }
        }
      })
      
      if (!session) {
        return notFoundError('セッション')
      }
      
      // セッション所有者チェック
      if (session.userId !== request.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
        return notFoundError('セッション')
      }
      
      const timeRemaining = await sessionTimerManager.getSessionTimeRemaining(sessionId)
      const isActive = ['ACTIVE', 'EXTENDED'].includes(session.status)
      
      return successResponse({
        sessionId: session.id,
        status: session.status,
        timeRemaining, // 分単位
        isActive,
        locker: session.locker,
        plannedDuration: session.plannedDuration,
        startTime: session.startTime,
        endTime: session.endTime
      })
    } else {
      // ユーザーのアクティブセッションを取得
      const activeSession = await prisma.session.findFirst({
        where: {
          userId: request.user.id,
          status: {
            in: ['ACTIVE', 'EXTENDED']
          }
        },
        include: {
          locker: {
            select: {
              id: true,
              lockerNumber: true,
              location: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      })
      
      if (!activeSession) {
        return successResponse({
          hasActiveSession: false,
          activeTimerCount: sessionTimerManager.getActiveTimerCount()
        })
      }
      
      const timeRemaining = await sessionTimerManager.getSessionTimeRemaining(activeSession.id)
      
      return successResponse({
        hasActiveSession: true,
        sessionId: activeSession.id,
        status: activeSession.status,
        timeRemaining, // 分単位
        locker: activeSession.locker,
        plannedDuration: activeSession.plannedDuration,
        startTime: activeSession.startTime,
        endTime: activeSession.endTime,
        activeTimerCount: sessionTimerManager.getActiveTimerCount()
      })
    }
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Route Handlers ==================

export const GET = withAuthenticatedApi(
  withAuditLog('GET_SESSION_TIMER_STATUS')(getSessionTimerStatusHandler)
)