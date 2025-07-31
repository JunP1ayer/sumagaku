// Test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/sumagaku_test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.PAYPAY_API_KEY = 'test-paypay-api-key'
process.env.PAYPAY_API_SECRET = 'test-paypay-api-secret'
process.env.PAYPAY_MERCHANT_ID = 'test-merchant-id'

// Suppress console.warn for tests
const originalWarn = console.warn
console.warn = (...args) => {
  // Suppress specific warnings during tests
  if (args[0]?.includes?.('deprecated')) return
  if (args[0]?.includes?.('Warning:')) return
  originalWarn.apply(console, args)
}