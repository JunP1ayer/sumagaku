/**
 * Email Verification API
 * メール認証システム
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  handleApiError,
  notFoundError,
  validationError
} from '@/lib/api-response'
import { withApiMiddleware, withAuditLog } from '@/lib/middleware'
import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  email: z.string().email('有効なメールアドレスを入力してください')
})

const verifyEmailHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { token, email } = verifyEmailSchema.parse(body)
    
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })
    
    if (!verificationToken) {
      return notFoundError('無効な認証トークンです')
    }
    
    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token
          }
        }
      })
      
      return validationError('認証トークンの有効期限が切れています。再度認証メールを送信してください。')
    }
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        emailVerified: new Date(),
        status: 'ACTIVE'
      },
      create: {
        email,
        name: email.split('@')[0], // Default name from email prefix
        emailVerified: new Date(),
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    })
    
    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })
    
    return successResponse({
      message: 'メール認証が完了しました',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    })
    
  } catch (error) {
    return handleApiError(error, 'VERIFY_EMAIL_ERROR')
  }
}

// Send verification email handler
const sendVerificationEmailHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { email } = z.object({
      email: z.string().email('有効なメールアドレスを入力してください')
    }).parse(body)
    
    // Validate university email domain
    const validDomains = [
      'nagoya-u.ac.jp',
      'g.nagoya-u.ac.jp',
      's.thers.ac.jp'
    ]
    
    const isValidDomain = validDomains.some(domain => email.endsWith(`@${domain}`))
    if (!isValidDomain) {
      return validationError('大学のメールアドレスを使用してください')
    }
    
    // Generate verification token
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)
    
    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24 hours from now
    
    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })
    
    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    })
    
    // Send verification email (mock for now - real SMTP in production)
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
    
    console.log(`Verification email would be sent to ${email}:`)
    console.log(`Verification URL: ${verificationUrl}`)
    
    // In production, send actual email using nodemailer or similar
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
          subject: 'スマ学 - メール認証',
          html: generateVerificationEmailHTML(email, verificationUrl),
          text: generateVerificationEmailText(email, verificationUrl)
        })
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Don't fail the request - token is still created for manual verification
      }
    }
    
    return successResponse({
      message: '認証メールを送信しました。メールをご確認ください。',
      email,
      expiresAt: expires.toISOString()
    })
    
  } catch (error) {
    return handleApiError(error, 'SEND_VERIFICATION_EMAIL_ERROR')
  }
}

// Email templates
function generateVerificationEmailHTML(email: string, verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>スマ学 - メール認証</title>
  <style>
    body { font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 32px; font-weight: bold; color: #0F7A60; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 14px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
    .button { display: inline-block; background: #0F7A60; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
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
      <h2>メール認証</h2>
      <p>こんにちは、</p>
      <p><strong>${email}</strong> でのアカウント作成リクエストを受け付けました。</p>
      <p>下のボタンをクリックしてメール認証を完了してください：</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">メール認証を完了する</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        このリンクは24時間有効です。<br>
        もしこのメールに心当たりがない場合は、このメールを無視してください。
      </p>
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

function generateVerificationEmailText(email: string, verificationUrl: string): string {
  return `スマ学 - メール認証

${email} でのアカウント作成リクエストを受け付けました。

以下のリンクをクリックしてメール認証を完了してください:
${verificationUrl}

このリンクは24時間有効です。

© 2024 スマ学 - 名古屋大学
このメールは自動送信されています。返信しないでください。`
}

// Route handlers
export const POST = withApiMiddleware(
  withAuditLog('VERIFY_EMAIL')(verifyEmailHandler)
)

export const PUT = withApiMiddleware(
  withAuditLog('SEND_VERIFICATION_EMAIL')(sendVerificationEmailHandler)
)