/**
 * Authentication API - Login Endpoint
 * エンタープライズグレード認証システム
 */

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations'
import { successResponse, handleApiError, unauthorizedError } from '@/lib/api-response'
import { withApiMiddleware, withAuditLog, withRateLimit } from '@/lib/middleware'

const loginHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
        loginCount: true,
        emailVerified: true,
        twoFactorEnabled: true
      }
    })
    
    if (!user) {
      return unauthorizedError('メールアドレスまたはパスワードが間違っています')
    }
    
    // Check account status
    if (user.status !== 'ACTIVE') {
      return unauthorizedError('アカウントが無効化されています')
    }
    
    // For university SSO, password might not be set
    if (password && user.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        return unauthorizedError('メールアドレスまたはパスワードが間違っています')
      }
    } else if (!user.emailVerified) {
      // University SSO flow - verify email domain
      const validDomains = [
        'nagoya-u.ac.jp',
        'g.nagoya-u.ac.jp',
        's.thers.ac.jp'
      ]
      
      const isValidDomain = validDomains.some(domain => email.endsWith(`@${domain}`))
      if (!isValidDomain) {
        return unauthorizedError('大学のメールアドレスを使用してください')
      }
    }
    
    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d', // 7日間有効
        issuer: 'sumagaku-api',
        audience: 'sumagaku-client'
      }
    )
    
    // Update user login stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        emailVerified: user.emailVerified || new Date() // Auto-verify on successful login
      }
    })
    
    // Check for active daily pass
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const activeDailyPass = await prisma.dailyPass.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        validDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    // Response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginCount: user.loginCount + 1,
        twoFactorEnabled: user.twoFactorEnabled
      },
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      hasDailyPass: !!activeDailyPass,
      dailyPass: activeDailyPass ? {
        id: activeDailyPass.id,
        validDate: activeDailyPass.validDate,
        usageCount: activeDailyPass.usageCount
      } : null
    }
    
    return successResponse(responseData)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// Apply middlewares
export const POST = withApiMiddleware(
  withRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 })(
    withAuditLog('LOGIN')(loginHandler)
  )
)