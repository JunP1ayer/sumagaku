/**
 * Authentication Utilities
 * サーバーサイド認証ヘルパー関数
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-config'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

// ================== Types ==================

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  studentId?: string
  department?: string
  loginCount: number
}

export interface AuthSession {
  user: AuthUser
  expires: string
}

// ================== Server-Side Authentication ==================

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const session = await getServerSession(authOptions)
    return session as AuthSession | null
  } catch (error) {
    console.error('Failed to get auth session:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getAuthSession()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session.user
}

export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }
  
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['ADMIN', 'SUPER_ADMIN'])
}

// ================== User Management ==================

export async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        studentId: true,
        department: true,
        year: true,
        loginCount: true,
        lastLoginAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string
  department?: string
  year?: number
}) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        studentId: true,
        department: true,
        year: true
      }
    })
    
    return user
  } catch (error) {
    console.error('Failed to update user profile:', error)
    throw error
  }
}

// ================== Daily Pass Management ==================

export async function checkDailyPassValid(userId: string): Promise<boolean> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const activeDailyPass = await prisma.dailyPass.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        validDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    return !!activeDailyPass
  } catch (error) {
    console.error('Failed to check daily pass:', error)
    return false
  }
}

export async function getUserDailyPass(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dailyPass = await prisma.dailyPass.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        validDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            completedAt: true
          }
        }
      }
    })
    
    return dailyPass
  } catch (error) {
    console.error('Failed to get user daily pass:', error)
    return null
  }
}

// ================== Session Management ==================

export async function getUserActiveSession(userId: string) {
  try {
    const activeSession = await prisma.session.findFirst({
      where: {
        userId,
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
      }
    })
    
    if (activeSession) {
      // Calculate derived fields
      const endTime = new Date(activeSession.startTime.getTime() + activeSession.plannedDuration * 60 * 1000)
      const totalExtensionTime = activeSession.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
      const actualEndTime = new Date(endTime.getTime() + totalExtensionTime * 60 * 1000)
      const timeRemaining = Math.max(0, Math.floor((actualEndTime.getTime() - Date.now()) / 60000))
      
      return {
        ...activeSession,
        endTime: actualEndTime,
        originalEndTime: endTime,
        totalExtensionTime,
        timeRemaining,
        isActive: true
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to get user active session:', error)
    return null
  }
}

// ================== Permission Checks ==================

export function hasPermission(user: AuthUser, permission: string): boolean {
  const rolePermissions = {
    'STUDENT': [
      'session:create',
      'session:read_own',
      'session:update_own',
      'payment:create',
      'payment:read_own'
    ],
    'FACULTY': [
      'session:create',
      'session:read_own',
      'session:update_own',
      'payment:create',
      'payment:read_own',
      'locker:read'
    ],
    'ADMIN': [
      'session:*',
      'payment:*',
      'locker:*',
      'user:read',
      'user:update',
      'stats:read'
    ],
    'SUPER_ADMIN': [
      '*'
    ]
  }
  
  const userPermissions = rolePermissions[user.role as keyof typeof rolePermissions] || []
  
  return userPermissions.includes('*') || 
         userPermissions.includes(permission) ||
         userPermissions.some(p => p.endsWith(':*') && permission.startsWith(p.slice(0, -1)))
}

export function canAccessResource(user: AuthUser, resource: string, resourceUserId?: string): boolean {
  // Super admin can access everything
  if (user.role === 'SUPER_ADMIN') {
    return true
  }
  
  // Admin can access most resources
  if (user.role === 'ADMIN' && !resource.includes('super_admin')) {
    return true
  }
  
  // Users can access their own resources
  if (resourceUserId && user.id === resourceUserId) {
    return true
  }
  
  return false
}

// ================== Audit Logging ==================

export async function logUserAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any,
  success: boolean = true,
  errorMessage?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        success,
        errorMessage
      }
    })
  } catch (error) {
    console.error('Failed to log user action:', error)
  }
}

// ================== Password Management ==================

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true
      }
    })
    
    if (!user) {
      throw new Error('ユーザーが見つかりません')
    }
    
    // Verify current password if exists
    if (user.passwordHash) {
      const bcrypt = (await import('bcryptjs')).default
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        throw new Error('現在のパスワードが間違っています')
      }
    }
    
    // Hash new password
    const bcrypt = (await import('bcryptjs')).default
    const passwordHash = await bcrypt.hash(newPassword, 12)
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })
    
    // Log action
    await logUserAction(userId, 'CHANGE_PASSWORD', 'user', userId)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to change password:', error)
    throw error
  }
}