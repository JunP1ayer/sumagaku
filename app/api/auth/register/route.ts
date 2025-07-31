/**
 * Authentication API - Registration Endpoint
 * 大学メール認証システム統合
 */

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createUserSchema } from '@/lib/validations'
import { successResponse, handleApiError, conflictError } from '@/lib/api-response'
import { withApiMiddleware, withAuditLog, withRateLimit } from '@/lib/middleware'

const registerHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const userData = createUserSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          ...(userData.studentId ? [{ studentId: userData.studentId }] : [])
        ]
      }
    })
    
    if (existingUser) {
      if (existingUser.email === userData.email) {
        return conflictError('このメールアドレスは既に登録されています')
      }
      if (existingUser.studentId === userData.studentId) {
        return conflictError('この学籍番号は既に登録されています')
      }
    }
    
    // Extract department from email if not provided
    let department = userData.department
    if (!department && userData.email.includes('@')) {
      const emailPrefix = userData.email.split('@')[0]
      // Simple department detection based on email patterns
      if (emailPrefix.includes('eng') || emailPrefix.includes('engineering')) {
        department = '工学部'
      } else if (emailPrefix.includes('med') || emailPrefix.includes('medicine')) {
        department = '医学部'
      } else if (emailPrefix.includes('law')) {
        department = '法学部'
      } else if (emailPrefix.includes('econ') || emailPrefix.includes('economics')) {
        department = '経済学部'
      }
    }
    
    // Generate password hash if password provided (for testing)
    let passwordHash: string | undefined
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 12)
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        studentId: userData.studentId,
        department,
        year: userData.year,
        passwordHash,
        // For university emails, mark as verified
        emailVerified: new Date(),
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        studentId: true,
        department: true,
        year: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
    
    // Initialize default system config for new user (if first user, make admin)
    const userCount = await prisma.user.count()
    if (userCount === 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' }
      })
    }
    
    return successResponse({
      user: {
        ...user,
        role: userCount === 1 ? 'SUPER_ADMIN' : user.role
      },
      message: 'アカウントが正常に作成されました。ログインしてください。'
    }, 201)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// Apply middlewares
export const POST = withApiMiddleware(
  withRateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 3 })(
    withAuditLog('REGISTER')(registerHandler)
  )
)