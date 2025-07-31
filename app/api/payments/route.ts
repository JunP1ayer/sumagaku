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
import { getPayPayClient, PayPayError } from '@/lib/paypay-client'
import { getEmailClient } from '@/lib/email-client'

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
    
    // PayPay API call
    const paypayResponse = await createPayment({
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
    
    // Verify webhook signature
    const signature = request.headers.get('x-paypay-signature')
    if (!verifyWebhookSignature(JSON.stringify(body), signature)) {
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
          userName: payment.user.name || payment.user.email || 'User',
          paymentId: payment.id,
          merchantPaymentId: payment.paypayOrderId
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

async function createPayment(request: PayPalOrderRequest): Promise<PayPalOrderResponse> {
  try {
    // Development mode - use mock response
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        paymentId: `pp_${crypto.randomBytes(16).toString('hex')}`,
        paymentUrl: `https://stg-api.paypay.ne.jp/v2/payments/${request.merchantPaymentId}`
      }
    }
    
    // Production mode - use actual PayPay API
    const payPayClient = getPayPayClient()
    
    const paymentRequest = {
      merchantPaymentId: request.merchantPaymentId,
      amount: {
        amount: request.amount,
        currency: 'JPY' as const
      },
      orderDescription: 'スマ学 一日券',
      redirectUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
      redirectType: 'WEB_LINK' as const,
      userInfo: {
        userId: request.userInfo.id,
        email: request.userInfo.email,
        name: request.userInfo.name
      }
    }
    
    const response = await payPayClient.createPayment(paymentRequest)
    
    return {
      success: true,
      paymentId: response.paymentId,
      paymentUrl: response.links.payment
    }
    
  } catch (error) {
    console.error('PayPay API error:', error)
    
    if (error instanceof PayPayError) {
      return {
        success: false,
        error: `PayPay Error: ${error.message} (Status: ${error.statusCode})`
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true // Skip verification in development
  }
  
  if (!signature) {
    return false
  }
  
  try {
    const payPayClient = getPayPayClient()
    return payPayClient.verifyWebhookSignature(payload, signature)
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

async function sendPaymentConfirmationEmail(
  email: string,
  data: {
    amount: number
    validDate: Date
    userName: string
    paymentId: string
    merchantPaymentId: string
  }
) {
  try {
    console.log(`Sending payment confirmation email to ${email}`)
    
    const emailClient = getEmailClient()
    const success = await emailClient.sendPaymentConfirmation(email, data)
    
    if (success) {
      console.log('Payment confirmation email sent successfully')
    } else {
      console.error('Failed to send payment confirmation email')
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