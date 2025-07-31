/**
 * Locker Control API - Individual Locker Operations
 * IoTロッカー制御エンドポイント
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lockerControl } from '@/lib/iot-locker'
import { 
  successResponse, 
  handleApiError, 
  notFoundError,
  forbiddenError,
  validationError
} from '@/lib/api-response'
import { withAuthenticatedApi, withAdminApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'

// ================== Unlock Locker (User) ==================

const unlockLockerHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }

    const body = await request.json()
    const { unlockCode, duration = 30 } = body

    if (!unlockCode) {
      return validationError('アンロックコードが必要です')
    }

    // Find locker
    const locker = await prisma.locker.findUnique({
      where: { id: params.id }
    })

    if (!locker) {
      return notFoundError('ロッカー')
    }

    // Find active session with this unlock code
    const session = await prisma.session.findFirst({
      where: {
        lockerId: params.id,
        unlockCode,
        status: { in: ['ACTIVE', 'EXTENDED'] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!session) {
      return validationError('無効なアンロックコードです')
    }

    // Check if user owns the session or is admin
    if (session.userId !== request.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return forbiddenError('このロッカーを操作する権限がありません')
    }

    // Check if session is still valid (not expired)
    const now = new Date()
    const sessionEndTime = new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000)
    
    // Add extension time if any
    const extensions = await prisma.sessionExtension.findMany({
      where: { sessionId: session.id }
    })
    const totalExtensionTime = extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
    const actualEndTime = new Date(sessionEndTime.getTime() + totalExtensionTime * 60 * 1000)

    if (now > actualEndTime) {
      return validationError('セッションの有効期限が切れています')
    }

    // Send unlock command to IoT system
    const response = await lockerControl.unlockLocker(params.id, unlockCode, duration)

    if (response.status !== 'SUCCESS') {
      return validationError(`ロッカーの解錠に失敗しました: ${response.error}`)
    }

    // Update session phone access count
    await prisma.session.update({
      where: { id: session.id },
      data: { phoneAccess: { increment: 1 } }
    })

    return successResponse({
      message: 'ロッカーが正常に解錠されました',
      lockerId: params.id,
      lockerNumber: locker.lockerNumber,
      unlockDuration: duration,
      sessionTimeRemaining: Math.max(0, Math.floor((actualEndTime.getTime() - now.getTime()) / 60000)),
      response: response.data
    })

  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Lock Locker (Admin/System) ==================

const lockLockerHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }

    // Find locker
    const locker = await prisma.locker.findUnique({
      where: { id: params.id }
    })

    if (!locker) {
      return notFoundError('ロッカー')
    }

    // Send lock command to IoT system
    const response = await lockerControl.lockLocker(params.id)

    if (response.status !== 'SUCCESS') {
      return validationError(`ロッカーの施錠に失敗しました: ${response.error}`)
    }

    return successResponse({
      message: 'ロッカーが正常に施錠されました',
      lockerId: params.id,
      lockerNumber: locker.lockerNumber,
      response: response.data
    })

  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Get Locker Status ==================

const getLockerStatusHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }

    // Find locker
    const locker = await prisma.locker.findUnique({
      where: { id: params.id },
      include: {
        sessions: {
          where: {
            status: { in: ['ACTIVE', 'EXTENDED'] }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          take: 1
        }
      }
    })

    if (!locker) {
      return notFoundError('ロッカー')
    }

    // Get real-time status from IoT system
    const iotResponse = await lockerControl.getLockerStatus(params.id)

    // Update sensor data if available
    if (iotResponse.status === 'SUCCESS' && iotResponse.data) {
      await prisma.locker.update({
        where: { id: params.id },
        data: {
          batteryLevel: iotResponse.data.batteryLevel,
          temperature: iotResponse.data.temperature,
          humidity: iotResponse.data.humidity,
          updatedAt: new Date()
        }
      }).catch(console.error)
    }

    const currentSession = locker.sessions[0]
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)

    // Build response with appropriate data visibility
    const statusData = {
      id: locker.id,
      lockerNumber: locker.lockerNumber,
      location: locker.location,
      status: locker.status,
      
      // IoT sensor data (admin only or own session)
      batteryLevel: (isAdmin || currentSession?.userId === request.user.id) ? locker.batteryLevel : undefined,
      temperature: (isAdmin || currentSession?.userId === request.user.id) ? locker.temperature : undefined,
      humidity: (isAdmin || currentSession?.userId === request.user.id) ? locker.humidity : undefined,
      
      // Real-time IoT status
      iotStatus: iotResponse.status,
      iotConnected: iotResponse.status === 'SUCCESS',
      iotData: (isAdmin || currentSession?.userId === request.user.id) ? iotResponse.data : undefined,
      
      // Current session info
      isOccupied: !!currentSession,
      currentSession: currentSession ? {
        id: currentSession.id,
        startTime: currentSession.startTime,
        status: currentSession.status,
        // Only show user info to admins or session owner
        user: (isAdmin || currentSession.userId === request.user.id) 
          ? currentSession.user 
          : { name: '利用中', email: '***' }
      } : null,
      
      // Maintenance info (admin only)
      lastMaintenance: isAdmin ? locker.lastMaintenance : undefined,
      maintenanceNotes: isAdmin ? locker.maintenanceNotes : undefined,
      
      updatedAt: locker.updatedAt
    }

    return successResponse(statusData)

  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Emergency Unlock (Admin Only) ==================

const emergencyUnlockHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return validationError('緊急解錠の理由を入力してください')
    }

    // Find locker
    const locker = await prisma.locker.findUnique({
      where: { id: params.id }
    })

    if (!locker) {
      return notFoundError('ロッカー')
    }

    // Perform emergency unlock
    const response = await lockerControl.emergencyUnlock(params.id, reason, request.user.id)

    if (response.status !== 'SUCCESS') {
      return validationError(`緊急解錠に失敗しました: ${response.error}`)
    }

    return successResponse({
      message: '緊急解錠が実行されました',
      lockerId: params.id,
      lockerNumber: locker.lockerNumber,
      reason,
      response: response.data,
      executedBy: {
        id: request.user.id,
        name: request.user.name || 'Admin',
        email: request.user.email
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Reset Locker (Admin Only) ==================

const resetLockerHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }

    // Find locker
    const locker = await prisma.locker.findUnique({
      where: { id: params.id }
    })

    if (!locker) {
      return notFoundError('ロッカー')
    }

    // Reset locker hardware
    const response = await lockerControl.resetLocker(params.id)

    if (response.status !== 'SUCCESS') {
      return validationError(`ロッカーのリセットに失敗しました: ${response.error}`)
    }

    // Update locker status in database
    await prisma.$transaction(async (tx) => {
      // End any active sessions
      await tx.session.updateMany({
        where: {
          lockerId: params.id,
          status: { in: ['ACTIVE', 'EXTENDED'] }
        },
        data: {
          status: 'INTERRUPTED',
          endTime: new Date()
        }
      })

      // Reset locker status
      await tx.locker.update({
        where: { id: params.id },
        data: {
          status: 'AVAILABLE',
          updatedAt: new Date()
        }
      })
    })

    return successResponse({
      message: 'ロッカーが正常にリセットされました',
      lockerId: params.id,
      lockerNumber: locker.lockerNumber,
      response: response.data,
      resetBy: {
        id: request.user.id,
        name: request.user.name || 'Admin',
        email: request.user.email
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Route Handlers ==================

// POST: Unlock locker (authenticated users)
export const POST = withAuthenticatedApi(
  withAuditLog('UNLOCK_LOCKER')(unlockLockerHandler)
)

// PUT: Lock locker (admin only)
export const PUT = withAdminApi(
  withAuditLog('LOCK_LOCKER')(lockLockerHandler)
)

// GET: Get locker status
export const GET = withAuthenticatedApi(
  withAuditLog('GET_LOCKER_STATUS')(getLockerStatusHandler)
)

// PATCH: Emergency unlock (admin only)
export const PATCH = withAdminApi(
  withAuditLog('EMERGENCY_UNLOCK')(emergencyUnlockHandler)
)

// DELETE: Reset locker (admin only)
export const DELETE = withAdminApi(
  withAuditLog('RESET_LOCKER')(resetLockerHandler)
)