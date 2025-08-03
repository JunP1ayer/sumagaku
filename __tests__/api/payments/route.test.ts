/**
 * Payment API Unit Tests
 * 本番レベルのテストカバレッジ
 */

import { NextRequest } from 'next/server'
import { POST, PUT } from '@/app/api/payments/route'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dailyPass: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockPrisma = require('@/lib/prisma').prisma

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: () => 'mockedid123' })),
  createHmac: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mocked-signature'),
    })),
  })),
  timingSafeEqual: jest.fn(() => true),
}))

// Mock email function
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}))

describe('/api/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payments - Create Payment', () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'test@student.nagoya-u.ac.jp',
      name: 'Test User',
    }

    const createMockRequest = (body: any, user = mockUser) => {
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Add user to request (simulating middleware)
      ;(request as any).user = user
      ;(request as any).requestId = 'test-request-123'
      
      return request
    }

    it('正常な決済作成リクエスト', async () => {
      // Setup mocks
      mockPrisma.dailyPass.findFirst.mockResolvedValue(null) // No existing pass
      mockPrisma.payment.findFirst.mockResolvedValue(null) // No pending payment
      
      // Mock payment creation
      const mockPayment = {
        id: 'cm3x8b9k0000123payment456',
        userId: 'test-user-123',
        amount: 500,
        status: 'PENDING',
        paypayOrderId: 'sumagaku_test-user-123_123456_mockedid123',
        createdAt: new Date(),
      }
      
      mockPrisma.payment.create.mockResolvedValue(mockPayment)
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayment,
        paypayTxId: 'pp_mockedpaymentid',
      })

      const request = createMockRequest({ amount: 500 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.payment).toMatchObject({
        amount: 500,
        status: 'PENDING',
      })
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-123',
          paypayOrderId: expect.stringContaining('sumagaku_test-user-123_'),
          amount: 500,
          status: 'PENDING',
        },
      })
    })

    it('既存の一日券がある場合はエラー', async () => {
      // Setup mock - existing daily pass
      mockPrisma.dailyPass.findFirst.mockResolvedValue({
        id: 'existing-pass',
        status: 'ACTIVE',
      })

      const request = createMockRequest({ amount: 500 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('今日の一日券は既に購入済みです')
      expect(mockPrisma.payment.create).not.toHaveBeenCalled()
    })

    it('未完了の決済がある場合はエラー', async () => {
      // Setup mocks
      mockPrisma.dailyPass.findFirst.mockResolvedValue(null)
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'pending-payment',
        status: 'PENDING',
        createdAt: new Date(),
      })

      const request = createMockRequest({ amount: 500 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('未完了の決済があります。15分後に再試行してください。')
    })

    it('無効な金額でバリデーションエラー', async () => {
      const request = createMockRequest({ amount: -100 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('認証されていないユーザーはエラー', async () => {
      const request = createMockRequest({ amount: 500 }, null)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('PayPay API失敗時の処理', async () => {
      // Setup mocks
      mockPrisma.dailyPass.findFirst.mockResolvedValue(null)
      mockPrisma.payment.findFirst.mockResolvedValue(null)
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment123',
        userId: mockUser.id,
        amount: 500,
        status: 'PENDING',
      })

      // Mock PayPay client to throw error
      const { getPayPayClient } = require('@/lib/paypay-client')
      getPayPayClient.mockReturnValue({
        createPayment: jest.fn().mockRejectedValue(new Error('PayPay API Error')),
      })

      // Set production mode to use PayPay client
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = createMockRequest({ amount: 500 })
      const response = await POST(request)
      const data = await response.json()

      // Restore environment
      process.env.NODE_ENV = originalEnv

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment123' },
        data: { status: 'FAILED' },
      })
    })
  })

  describe('PUT /api/payments - PayPay Webhook', () => {
    const createWebhookRequest = (body: any, signature = 'valid-signature') => {
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'x-paypay-signature': signature,
        },
      })
      
      ;(request as any).requestId = 'webhook-request-123'
      return request
    }

    it('決済完了のWebhook処理', async () => {
      // Mock signature verification to pass for this test
      const { getPayPayClient } = require('@/lib/paypay-client')
      getPayPayClient.mockReturnValue({
        verifyWebhookSignature: jest.fn().mockReturnValue(true),
      })

      const webhookBody = {
        merchantPaymentId: 'sumagaku_user123_123456',
        paymentId: 'pp_paymentid123',
        status: 'COMPLETED',
        amount: 500,
      }

      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        amount: 500,
        user: {
          email: 'test@student.nagoya-u.ac.jp',
          name: 'Test User',
        },
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          payment: {
            update: jest.fn().mockResolvedValue({ id: 'payment123' }),
          },
          dailyPass: {
            create: jest.fn().mockResolvedValue({ id: 'pass123' }),
          },
        })
      })

      const request = createWebhookRequest(webhookBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Webhook processed successfully')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('決済失敗のWebhook処理', async () => {
      // Mock signature verification to pass for this test
      const { getPayPayClient } = require('@/lib/paypay-client')
      getPayPayClient.mockReturnValue({
        verifyWebhookSignature: jest.fn().mockReturnValue(true),
      })

      const webhookBody = {
        merchantPaymentId: 'sumagaku_user123_123456',
        paymentId: 'pp_paymentid123',
        status: 'FAILED',
        amount: 500,
      }

      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        amount: 500,
        user: {
          email: 'test@student.nagoya-u.ac.jp',
          name: 'Test User',
        },
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          payment: {
            update: jest.fn().mockResolvedValue({ id: 'payment123' }),
          },
        })
      })

      const request = createWebhookRequest(webhookBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('存在しない決済IDでエラー', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null)

      // Mock signature verification to pass for this test
      const { getPayPayClient } = require('@/lib/paypay-client')
      getPayPayClient.mockReturnValue({
        verifyWebhookSignature: jest.fn().mockReturnValue(true),
      })

      const webhookBody = {
        merchantPaymentId: 'nonexistent_payment',
        paymentId: 'pp_test123',
        status: 'COMPLETED',
        amount: 500,
      }

      const request = createWebhookRequest(webhookBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Payment not found')
    })

    it('無効なWebhook署名でエラー', async () => {
      // Mock signature verification to fail
      const { getPayPayClient } = require('@/lib/paypay-client')
      getPayPayClient.mockReturnValue({
        verifyWebhookSignature: jest.fn().mockReturnValue(false),
      })

      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.PAYPAY_API_SECRET = 'test-secret'

      const request = createWebhookRequest(
        { merchantPaymentId: 'test', paymentId: 'pp_test', status: 'COMPLETED', amount: 500 },
        'invalid-signature'
      )
      const response = await PUT(request)
      const data = await response.json()

      process.env.NODE_ENV = originalEnv

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Invalid webhook signature')
    })
  })

  describe('Helper Functions', () => {
    it('PayPay Order ID生成の一意性', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test' }
      
      const createMockRequestForHelper = (body: any, user = mockUser) => {
        const request = new NextRequest('http://localhost:3000/api/payments', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        // Add user to request (simulating middleware)
        ;(request as any).user = user
        ;(request as any).requestId = 'test-request-123'
        
        return request
      }
      
      // Create multiple requests to test uniqueness
      const ids = []
      for (let i = 0; i < 5; i++) {
        mockPrisma.dailyPass.findFirst.mockResolvedValue(null)
        mockPrisma.payment.findFirst.mockResolvedValue(null)
        mockPrisma.payment.create.mockResolvedValue({
          id: `payment${i}`,
          paypayOrderId: `order${i}`,
        })
        mockPrisma.payment.update.mockResolvedValue({})
        
        const request = createMockRequestForHelper({ amount: 500 }, mockUser)
        const response = await POST(request)
        const data = await response.json()
        
        if (response.status === 201) {
          ids.push(data.data.payment.merchantPaymentId)
        }
      }

      // All IDs should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})