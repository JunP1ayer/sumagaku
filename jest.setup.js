require('@testing-library/jest-dom')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dailyPass: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    locker: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock authentication middleware for testing
jest.mock('@/lib/middleware', () => {
  const originalModule = jest.requireActual('@/lib/middleware')
  
  // Mock withAuth to bypass authentication in tests
  const mockWithAuth = (handler) => {
    return async (request, context) => {
      // Add mock user to request if not already present
      if (!request.user) {
        request.user = {
          id: 'test-user-123',
          email: 'test@student.nagoya-u.ac.jp',
          name: 'Test User',
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      }
      
      // Add mock requestId
      if (!request.requestId) {
        request.requestId = 'test-request-' + Math.random().toString(36).substr(2, 9)
      }
      
      return handler(request, context)
    }
  }
  
  // Mock withAuthenticatedApi to bypass all middleware checks
  const mockWithAuthenticatedApi = (handler) => {
    return async (request, context) => {
      // Add mock user to request
      if (!request.user) {
        request.user = {
          id: 'test-user-123',
          email: 'test@student.nagoya-u.ac.jp',
          name: 'Test User',
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      }
      
      // Add mock requestId
      if (!request.requestId) {
        request.requestId = 'test-request-' + Math.random().toString(36).substr(2, 9)
      }
      
      // Call handler directly without middleware chain
      return handler(request, context)
    }
  }
  
  // Mock withAuditLog to bypass audit logging
  const mockWithAuditLog = (action) => {
    return (handler) => {
      return async (request, context) => {
        // Skip audit logging, just call handler
        return handler(request, context)
      }
    }
  }
  
  return {
    ...originalModule,
    withAuth: mockWithAuth,
    withAuthenticatedApi: mockWithAuthenticatedApi,
    withAuditLog: mockWithAuditLog,
  }
})

// Mock email client
jest.mock('@/lib/email-client', () => ({
  EmailClient: jest.fn().mockImplementation(() => ({
    sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendSessionReminder: jest.fn().mockResolvedValue(true),
  })),
  getEmailClient: jest.fn(() => ({
    sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendSessionReminder: jest.fn().mockResolvedValue(true),
  })),
}))

// Mock PayPay client
jest.mock('@/lib/paypay-client', () => ({
  getPayPayClient: jest.fn(() => ({
    createPayment: jest.fn().mockResolvedValue({
      paymentId: 'pp_mockedpaymentid',
      links: {
        payment: 'https://mock-paypay-payment-url.com/payment'
      }
    }),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
  })),
  PayPayError: class PayPayError extends Error {
    constructor(message, statusCode = 500) {
      super(message)
      this.statusCode = statusCode
    }
  }
}))

// Global test timeout
jest.setTimeout(30000)