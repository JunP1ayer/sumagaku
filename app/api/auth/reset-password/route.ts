/**
 * Password Reset API
 * パスワードリセットシステム
 */

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  handleApiError,
  notFoundError,
  validationError
} from '@/lib/api-response'
import { withApiMiddleware, withAuditLog, withRateLimit } from '@/lib/middleware'
import { z } from 'zod'

// Request password reset
const requestResetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください')
})

const requestPasswordResetHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { email } = requestResetSchema.parse(body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        status: true
      }
    })
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return successResponse({
        message: 'パスワードリセットのメールを送信しました。メールをご確認ください。',
        email
      })
    }
    
    if (user.status !== 'ACTIVE') {
      return validationError('このアカウントは無効化されています')
    }
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15) +
                      Date.now().toString(36)
    
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // 1 hour from now
    
    // Store reset token (using verification_tokens table temporarily)
    await prisma.verificationToken.deleteMany({
      where: { 
        identifier: `password_reset_${email}`
      }
    })
    
    await prisma.verificationToken.create({
      data: {
        identifier: `password_reset_${email}`,
        token: resetToken,
        expires
      }
    })
    
    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    
    console.log(`Password reset email would be sent to ${email}:`)
    console.log(`Reset URL: ${resetUrl}`)
    
    // In production, send actual email
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@sumagaku.com',
          to: email,
          subject: 'スマ学 - パスワードリセット',
          html: generateResetEmailHTML(user.name || email, resetUrl),
          text: generateResetEmailText(user.name || email, resetUrl)
        })
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError)
      }
    }
    
    return successResponse({
      message: 'パスワードリセットのメールを送信しました。メールをご確認ください。',
      email,
      expiresAt: expires.toISOString()
    })
    
  } catch (error) {
    return handleApiError(error, 'REQUEST_PASSWORD_RESET_ERROR')
  }
}

// Reset password with token
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  newPassword: z.string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(128, 'パスワードは128文字以下で入力してください')
})

const resetPasswordHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { token, email, newPassword } = resetPasswordSchema.parse(body)
    
    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `password_reset_${email}`,
          token: token
        }
      }
    })
    
    if (!resetToken) {
      return notFoundError('無効なリセットトークンです')
    }
    
    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `password_reset_${email}`,
            token: token
          }
        }
      })
      
      return validationError('リセットトークンの有効期限が切れています。再度リセットを申請してください。')
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        status: true
      }
    })
    
    if (!user) {
      return notFoundError('ユーザーが見つかりません')
    }
    
    if (user.status !== 'ACTIVE') {
      return validationError('このアカウントは無効化されています')
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)
    
    // Update password and delete reset token in transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          updatedAt: new Date()
        }
      })
      
      // Delete used reset token
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `password_reset_${email}`,
            token: token
          }
        }
      })
    })
    
    return successResponse({
      message: 'パスワードが正常にリセットされました。新しいパスワードでログインしてください。',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
    
  } catch (error) {
    return handleApiError(error, 'RESET_PASSWORD_ERROR')
  }
}

// Email templates
function generateResetEmailHTML(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>スマ学 - パスワードリセット</title>
  <style>
    body { font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 32px; font-weight: bold; color: #0F7A60; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 14px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
    .button { display: inline-block; background: #0F7A60; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">スマ学</div>
      <div class="subtitle">名古屋大学スマートフォン断ロッカー</div>
    </div>
    
    <div class="content">
      <h2>パスワードリセット</h2>
      <p>こんにちは、${name}さん</p>
      <p>アカウントのパスワードリセットリクエストを受け付けました。</p>
      <p>下のボタンをクリックして新しいパスワードを設定してください：</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">パスワードをリセットする</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ セキュリティについて</strong><br>
        • このリンクは1時間有効です<br>
        • もしこのメールに心当たりがない場合は、このメールを無視してください<br>
        • パスワードは第三者に教えないでください
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 スマ学 - 名古屋大学<br>
      このメールは自動送信されています。返信しないでください。</p>
    </div>
  </div>
</body>
</html>
`
}

function generateResetEmailText(name: string, resetUrl: string): string {
  return `スマ学 - パスワードリセット

こんにちは、${name}さん

アカウントのパスワードリセットリクエストを受け付けました。

以下のリンクをクリックして新しいパスワードを設定してください:
${resetUrl}

このリンクは1時間有効です。

セキュリティについて:
- もしこのメールに心当たりがない場合は、このメールを無視してください
- パスワードは第三者に教えないでください

© 2024 スマ学 - 名古屋大学
このメールは自動送信されています。返信しないでください。`
}

// Route handlers
export const POST = withApiMiddleware(
  withRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 3 })( // 15分間に3回まで
    withAuditLog('REQUEST_PASSWORD_RESET')(requestPasswordResetHandler)
  )
)

export const PUT = withApiMiddleware(
  withRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 })( // 15分間に5回まで
    withAuditLog('RESET_PASSWORD')(resetPasswordHandler)
  )
)