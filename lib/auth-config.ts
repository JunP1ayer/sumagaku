/**
 * NextAuth.js Configuration
 * エンタープライズグレード認証システム設定
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from './validations'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    // Email Provider for University SSO
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      },
      from: process.env.SMTP_FROM || 'noreply@sumagaku.com',
      maxAge: 24 * 60 * 60, // 24 hours
      
      // Custom email validation for university domains
      normalizeIdentifier(identifier: string): string {
        const validDomains = [
          'nagoya-u.ac.jp',
          'g.nagoya-u.ac.jp', 
          's.thers.ac.jp'
        ]
        
        const email = identifier.toLowerCase().trim()
        const isValidDomain = validDomains.some(domain => email.endsWith(`@${domain}`))
        
        if (!isValidDomain) {
          throw new Error('大学のメールアドレスを使用してください')
        }
        
        return email
      },
      
      // Custom email template
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url)
        const nodemailer = await import('nodemailer')
        const transport = nodemailer.createTransport(provider.server as any)
        
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `スマ学 - ログイン認証`,
          text: text({ url, host }),
          html: html({ url, host, email: identifier }),
        })
        
        const failed = result.rejected.filter(Boolean)
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`)
        }
      },
    }),

    // Credentials Provider for password-based login (fallback)
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your-name@nagoya-u.ac.jp'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              role: true,
              status: true,
              emailVerified: true
            }
          })

          if (!user) {
            return null
          }

          if (user.status !== 'ACTIVE') {
            throw new Error('アカウントが無効化されています')
          }

          if (user.passwordHash && password) {
            const isValidPassword = await bcrypt.compare(password, user.passwordHash)
            if (!isValidPassword) {
              return null
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            status: user.status,
            loginCount: 0,
            emailVerified: user.emailVerified
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secret: process.env.NEXTAUTH_SECRET,
  },

  pages: {
    signIn: '/login',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  callbacks: {
    async signIn({ user, account, profile, email }) {
      // Custom sign-in logic
      if (account?.provider === 'email') {
        // Verify university email domain
        const validDomains = [
          'nagoya-u.ac.jp',
          'g.nagoya-u.ac.jp',
          's.thers.ac.jp'
        ]
        
        const isValidDomain = validDomains.some(domain => 
          user.email?.endsWith(`@${domain}`)
        )
        
        if (!isValidDomain) {
          return false
        }

        // Auto-create user if not exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              emailVerified: new Date(),
              status: 'ACTIVE'
            }
          })
        }
      }

      return true
    },

    async jwt({ token, user, account, profile }) {
      // Include additional user data in JWT
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            studentId: true,
            department: true,
            loginCount: true
          }
        })

        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.status = dbUser.status
          token.studentId = dbUser.studentId || undefined
          token.department = dbUser.department || undefined
          token.loginCount = dbUser.loginCount

          // Update login stats
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { 
              lastLoginAt: new Date(),
              loginCount: { increment: 1 }
            }
          })
        }
      }

      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.studentId = token.studentId as string | undefined
        session.user.department = token.department as string | undefined
        session.user.loginCount = token.loginCount as number
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event
      if (user.email) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SIGNIN',
            resource: 'auth',
            details: {
              provider: account?.provider,
              isNewUser,
              userAgent: 'NextAuth'
            },
            success: true
          }
        }).catch(console.error)
      }
    },

    async signOut({ token }) {
      // Log sign-out event
      if (token?.userId) {
        await prisma.auditLog.create({
          data: {
            userId: token.userId as string,
            action: 'SIGNOUT',
            resource: 'auth',
            details: {
              userAgent: 'NextAuth'
            },
            success: true
          }
        }).catch(console.error)
      }
    },

    async createUser({ user }) {
      // Welcome new user
      console.warn(`New user created: ${user.email}`)
    }
  },

  debug: process.env.NODE_ENV === 'development',
}

// Email templates
function html({ url, host, email }: { url: string; host: string; email: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>スマ学 - ログイン認証</title>
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
      <h2>ログイン認証</h2>
      <p>こんにちは、</p>
      <p><strong>${email}</strong> でのログインリクエストを受け付けました。</p>
      <p>下のボタンをクリックしてログインを完了してください：</p>
      
      <div style="text-align: center;">
        <a href="${url}" class="button">ログインする</a>
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

function text({ url, host }: { url: string; host: string }) {
  return `スマ学 - ログイン認証\n\n以下のリンクをクリックしてログインしてください:\n${url}\n\nこのリンクは24時間有効です。\n\n© 2024 スマ学 - 名古屋大学`
}