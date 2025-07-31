/**
 * Payments API - PayPay Integration
 * PayPay Business API エンタープライズ連携
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPaymentSchema } from '@/lib/validations'
import { 
  successResponse, 
  createdResponse, 
  handleApiError,
  validationError,
  internalServerError
} from '@/lib/api-response'
import { withAuthenticatedApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'
import crypto from 'crypto'

// ================== Create Payment Order ==================

const createPaymentHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const body = await request.json()
    const paymentData = createPaymentSchema.parse(body)
    
    // Check if user already has active daily pass for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const existingDailyPass = await prisma.dailyPass.findFirst({
      where: {
        userId: request.user.id,
        status: 'ACTIVE',
        validDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    if (existingDailyPass) {
      return validationError('今日の一日券は既に購入済みです')
    }
    
    // Check for pending payment
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        userId: request.user.id,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // 15分以内
        }
      }
    })
    
    if (pendingPayment) {
      return validationError('未完了の決済があります。15分後に再試行してください。')
    }
    
    // Generate unique merchant payment ID
    const merchantPaymentId = `sumagaku_${request.user.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: request.user.id,
        paypayOrderId: merchantPaymentId,
        amount: paymentData.amount,
        status: 'PENDING'
      }
    })
    
    // Mock PayPay API call (replace with actual API in production)
    const paypayResponse = await createPayPalOrder({
      merchantPaymentId,
      amount: paymentData.amount,
      userInfo: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name || request.user.email
      }
    })
    
    if (!paypayResponse.success) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })
      
      return internalServerError('決済の初期化に失敗しました')
    }
    
    // Update payment with PayPay transaction ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        paypayTxId: paypayResponse.paymentId 
      }
    })
    
    return createdResponse({
      payment: {
        id: payment.id,
        merchantPaymentId,
        paymentId: paypayResponse.paymentId,
        amount: payment.amount,
        status: payment.status,
        paymentUrl: paypayResponse.paymentUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15分後
      }
    })
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== PayPay Webhook Handler ==================

const paypayWebhookHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Verify webhook signature (implement actual verification)
    const signature = request.headers.get('x-paypay-signature')
    if (!verifyPayPalWebhook(body, signature)) {
      return validationError('Invalid webhook signature')
    }
    
    const { merchantPaymentId, paymentId, status, amount } = body
    
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paypayOrderId: merchantPaymentId },
      include: { user: true }
    })
    
    if (!payment) {
      return validationError('Payment not found')
    }
    
    // Process payment based on status
    await prisma.$transaction(async (tx) => {
      if (status === 'COMPLETED') {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
        
        // Create daily pass
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        await tx.dailyPass.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            amount: payment.amount,
            validDate: today,
            status: 'ACTIVE'
          }
        })
        
        // Send confirmation email (async)
        sendPaymentConfirmationEmail(payment.user.email, {
          amount: payment.amount,
          validDate: today,
          userName: payment.user.name || payment.user.email || 'User'
        }).catch(console.error)
        
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: status as any }
        })
      }
    })
    
    return successResponse({ 
      message: 'Webhook processed successfully',
      paymentId: payment.id 
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

// ================== Helper Functions ==================

interface PayPalOrderRequest {
  merchantPaymentId: string
  amount: number
  userInfo: {
    id: string
    email: string
    name: string
  }
}

interface PayPalOrderResponse {
  success: boolean
  paymentId?: string
  paymentUrl?: string
  error?: string
}

async function createPayPalOrder(request: PayPalOrderRequest): Promise<PayPalOrderResponse> {
  try {
    // Mock implementation - replace with actual PayPay API
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        paymentId: `pp_${crypto.randomBytes(16).toString('hex')}`,
        paymentUrl: `https://stg-api.paypay.ne.jp/v2/payments/${request.merchantPaymentId}`
      }
    }
    
    // Actual PayPay API implementation would go here
    const paypayApiUrl = process.env.PAYPAY_API_ENDPOINT || 'https://api.paypay.ne.jp'
    const response = await fetch(`${paypayApiUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYPAY_API_KEY}`,
        'X-ASSUME-MERCHANT': process.env.PAYPAY_MERCHANT_ID!
      },
      body: JSON.stringify({
        merchantPaymentId: request.merchantPaymentId,
        amount: {
          amount: request.amount,
          currency: 'JPY'
        },
        orderDescription: 'スマ学 一日券',
        redirectUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
        redirectType: 'WEB_LINK'
      })
    })
    
    if (!response.ok) {
      throw new Error(`PayPay API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      paymentId: data.paymentId,
      paymentUrl: data.links?.payment
    }
    
  } catch (error) {
    console.error('PayPay API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function verifyPayPalWebhook(body: any, signature: string | null): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true // Skip verification in development
  }
  
  if (!signature || !process.env.PAYPAY_API_SECRET) {
    return false
  }
  
  // Implement actual signature verification
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYPAY_API_SECRET)
    .update(JSON.stringify(body))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

async function sendPaymentConfirmationEmail(
  email: string,
  data: {
    amount: number
    validDate: Date
    userName: string
  }
) {
  try {
    // Email sending implementation
    console.log(`Sending confirmation email to ${email}:`, data)
    
    // Actual email implementation would use nodemailer or similar
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@sumagaku.com',
        to: email,
        subject: 'スマ学 - 決済完了のお知らせ',
        html: `
          <h2>決済が完了しました</h2>
          <p>${data.userName}様</p>
          <p>スマ学一日券（¥${data.amount}）の決済が正常に完了しました。</p>
          <p>有効期限: ${data.validDate.toLocaleDateString('ja-JP')}</p>
          <p>今日一日、ロッカーをご利用いただけます。</p>
        `
      })
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }
}

// ================== Route Handlers ==================

export const POST = withAuthenticatedApi(
  withAuditLog('CREATE_PAYMENT')(createPaymentHandler)
)

// Webhook endpoint (no auth required)
export const PUT = withAuditLog('PAYPAY_WEBHOOK')(paypayWebhookHandler)