/**
 * Session Management API - Individual Session Operations
 * セッション詳細・終了・延長システム
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extendSessionSchema } from '@/lib/validations'
import { 
  successResponse, 
  handleApiError, 
  notFoundError,
  forbiddenError,
  validationError,
  noContentResponse
} from '@/lib/api-response'
import { withAuthenticatedApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'

// ================== Get Session Details ==================

const getSessionHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const session = await prisma.session.findUnique({
      where: { id: params.id },
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
            qrCode: true,
            status: true
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
      }
    })
    
    if (!session) {
      return notFoundError('セッション')
    }
    
    // Check if user owns this session or is admin
    if (session.userId !== request.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return forbiddenError('このセッションにアクセスする権限がありません')
    }
    
    // Calculate derived fields
    const endTime = session.endTime || new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000)
    const totalExtensionTime = session.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
    const actualEndTime = new Date(endTime.getTime() + totalExtensionTime * 60 * 1000)
    
    const sessionWithMetadata = {
      ...session,
      endTime: actualEndTime,
      originalEndTime: endTime,
      actualDuration: session.actualDuration || (
        session.status === 'COMPLETED' && session.endTime 
          ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 60000)
          : null
      ),
      isActive: ['ACTIVE', 'EXTENDED'].includes(session.status),
      totalExtensionTime,
      timeRemaining: ['ACTIVE', 'EXTENDED'].includes(session.status) 
        ? Math.max(0, Math.floor((actualEndTime.getTime() - Date.now()) / 60000))
        : 0
    }
    
    return successResponse(sessionWithMetadata)
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== End Session ==================

const endSessionHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        locker: true
      }
    })
    
    if (!session) {
      return notFoundError('セッション')
    }
    
    // Check if user owns this session
    if (session.userId !== request.user.id) {
      return forbiddenError('このセッションを終了する権限がありません')
    }
    
    // Check if session is active
    if (!['ACTIVE', 'EXTENDED'].includes(session.status)) {
      return validationError('このセッションは既に終了しています')
    }
    
    const endTime = new Date()
    const actualDuration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000)
    
    // End session and update locker status in transaction
    await prisma.$transaction(async (tx) => {
      // Update session
      await tx.session.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          endTime,
          actualDuration
        }
      })
      
      // Update locker status and stats
      await tx.locker.update({
        where: { id: session.lockerId },
        data: {
          status: 'AVAILABLE',
          totalHours: { increment: actualDuration / 60 }
        }
      })
    })
    
    return successResponse({
      message: 'セッションが正常に終了しました',
      sessionId: params.id,
      actualDuration,
      endTime
    })
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Extend Session ==================

const extendSessionHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const body = await request.json()
    const extensionData = extendSessionSchema.parse(body)
    
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        extensions: true
      }
    })
    
    if (!session) {
      return notFoundError('セッション')
    }
    
    // Check if user owns this session
    if (session.userId !== request.user.id) {
      return forbiddenError('このセッションを延長する権限がありません')
    }
    
    // Check if session is active
    if (!['ACTIVE', 'EXTENDED'].includes(session.status)) {
      return validationError('終了したセッションは延長できません')
    }
    
    // Check daily extension limit (max 3 extensions per session)
    if (session.extensions.length >= 3) {
      return validationError('セッションの延長回数が上限に達しました（最大3回）')
    }
    
    // Check maximum total extension time (4 hours = 240 minutes)
    const totalExtensionTime = session.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
    if (totalExtensionTime + extensionData.extendedBy > 240) {
      return validationError('延長時間の合計が上限（4時間）を超えます')
    }
    
    // Create extension and update session in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create extension record
      const extension = await tx.sessionExtension.create({
        data: {
          sessionId: params.id,
          extendedBy: extensionData.extendedBy,
          reason: extensionData.reason
        }
      })
      
      // Update session status and extension count
      const updatedSession = await tx.session.update({
        where: { id: params.id },
        data: {
          status: 'EXTENDED',
          extendedTimes: { increment: 1 }
        }
      })
      
      return { extension, session: updatedSession }
    })
    
    // Calculate new end time
    const originalEndTime = new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000)
    const newTotalExtension = totalExtensionTime + extensionData.extendedBy
    const newEndTime = new Date(originalEndTime.getTime() + newTotalExtension * 60 * 1000)
    
    return successResponse({
      message: 'セッションが正常に延長されました',
      extension: result.extension,
      newEndTime,
      totalExtensionTime: newTotalExtension,
      remainingExtensions: 3 - (session.extensions.length + 1)
    })
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Delete Session (Admin Only) ==================

const deleteSessionHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    // Check if user is admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return forbiddenError('管理者権限が必要です')
    }
    
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: { locker: true }
    })
    
    if (!session) {
      return notFoundError('セッション')
    }
    
    // Delete session and update locker status if needed
    await prisma.$transaction(async (tx) => {
      // Delete session (cascade will handle extensions)
      await tx.session.delete({
        where: { id: params.id }
      })
      
      // If locker was occupied by this session, make it available
      if (['ACTIVE', 'EXTENDED'].includes(session.status)) {
        await tx.locker.update({
          where: { id: session.lockerId },
          data: { status: 'AVAILABLE' }
        })
      }
    })
    
    return noContentResponse()
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Route Handlers ==================

export const GET = withAuthenticatedApi(
  withAuditLog('GET_SESSION')(getSessionHandler)
)

export const DELETE = withAuthenticatedApi(
  withAuditLog('END_SESSION')(endSessionHandler)
)

export const PATCH = withAuthenticatedApi(
  withAuditLog('EXTEND_SESSION')(extendSessionHandler)
)

// Admin-only delete
export const PUT = withAuthenticatedApi(
  withAuditLog('DELETE_SESSION')(deleteSessionHandler)
)