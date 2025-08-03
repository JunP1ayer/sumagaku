/**
 * Session State Synchronization API
 * フロントエンド・バックエンド セッション状態同期API
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

// ================== Sync Session State ==================

const syncSessionStateHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
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
            location: true,
            qrCode: true
          }
        },
        extensions: {
          select: {
            id: true,
            extendedBy: true,
            reason: true,
            timestamp: true
          },
          orderBy: {
            timestamp: 'desc'
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
        message: 'アクティブなセッションはありません'
      })
    }
    
    // サーバーサイドから正確な残り時間を取得
    const timeRemainingMinutes = await sessionTimerManager.getSessionTimeRemaining(activeSession.id)
    const timeRemainingSeconds = timeRemainingMinutes * 60
    
    // 総延長時間を計算
    const totalExtensionTime = activeSession.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
    
    // 元の終了予定時刻
    const originalEndTime = new Date(activeSession.startTime.getTime() + activeSession.plannedDuration * 60 * 1000)
    
    // 延長を含む実際の終了予定時刻
    const actualEndTime = new Date(originalEndTime.getTime() + totalExtensionTime * 60 * 1000)
    
    // フロントエンド用の同期データ
    const syncData = {
      hasActiveSession: true,
      session: {
        id: activeSession.id,
        sessionId: activeSession.id, // フロントエンド互換性
        lockerId: activeSession.locker.lockerNumber, // フロントエンドは number を期待
        lockerInfo: {
          id: activeSession.lockerId,
          lockerNumber: activeSession.locker.lockerNumber,
          location: activeSession.locker.location,
          qrCode: activeSession.locker.qrCode
        },
        status: activeSession.status,
        startTime: activeSession.startTime.toISOString(),
        endTime: actualEndTime.toISOString(),
        originalEndTime: originalEndTime.toISOString(),
        plannedDuration: activeSession.plannedDuration, // 分単位
        duration: activeSession.plannedDuration, // フロントエンド互換性
        actualDuration: activeSession.actualDuration,
        unlockCode: activeSession.unlockCode,
        
        // タイマー情報
        timeRemaining: timeRemainingSeconds, // 秒単位（フロントエンド用）
        timeRemainingMinutes: timeRemainingMinutes, // 分単位
        isActive: ['ACTIVE', 'EXTENDED'].includes(activeSession.status),
        
        // 延長情報
        extensions: activeSession.extensions,
        totalExtensionTime,
        extendedTimes: activeSession.extendedTimes,
        phoneAccess: activeSession.phoneAccess,
        
        // メタデータ
        createdAt: activeSession.createdAt.toISOString(),
        updatedAt: activeSession.updatedAt.toISOString()
      },
      serverTime: new Date().toISOString(),
      syncTimestamp: Date.now()
    }
    
    return successResponse(syncData)
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Route Handlers ==================

export const GET = withAuthenticatedApi(
  withAuditLog('SYNC_SESSION_STATE')(syncSessionStateHandler)
)