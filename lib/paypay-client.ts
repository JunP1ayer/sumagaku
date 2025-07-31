/**
 * PayPay Production API Client
 * 本番レベルPayPay統合
 */

import crypto from 'crypto'

export interface PayPayConfig {
  apiKey: string
  apiSecret: string
  merchantId: string
  environment: 'sandbox' | 'production'
}

export interface CreatePaymentRequest {
  merchantPaymentId: string
  amount: {
    amount: number
    currency: 'JPY'
  }
  orderDescription: string
  redirectUrl: string
  redirectType: 'WEB_LINK'
  userInfo?: {
    userId: string
    email: string
    name: string
  }
}

export interface PaymentResponse {
  paymentId: string
  merchantPaymentId: string
  amount: {
    amount: number
    currency: string
  }
  orderDescription: string
  redirectUrl: string
  deeplink: string
  links: {
    payment: string
    cancel: string
  }
  expiryDate: string
  status: string
}

export interface PaymentStatusResponse {
  paymentId: string
  merchantPaymentId: string
  amount: {
    amount: number
    currency: string
  }
  status: 'CREATED' | 'AUTHORIZED' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'EXPIRED'
  acceptedAt?: string
  completedAt?: string
  refunds?: Array<{
    refundId: string
    amount: { amount: number; currency: string }
    status: string
    acceptedAt: string
  }>
}

export class PayPayClient {
  private config: PayPayConfig
  private baseUrl: string

  constructor(config: PayPayConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.paypay.ne.jp'
      : 'https://stg-api.paypay.ne.jp'
  }

  /**
   * Generate HMAC signature for API authentication
   */
  private generateSignature(
    method: string,
    resourceUrl: string,
    body: string,
    timestamp: string,
    nonce: string
  ): string {
    const contentMd5 = crypto.createHash('md5').update(body).digest('base64')
    const signatureRawList = [
      method,
      resourceUrl,
      contentMd5,
      'application/json;charset=UTF-8',
      timestamp,
    ]

    const signatureRawData = signatureRawList.join('\n')
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(signatureRawData)
      .digest('base64')

    return `hmac username="${this.config.apiKey}",algorithm="HmacSHA256",headers="date request-line content-md5 content-type",signature="${signature}"`
  }

  /**
   * Generate authorization headers
   */
  private generateHeaders(method: string, resourceUrl: string, body: string) {
    const timestamp = new Date().toISOString()
    const nonce = crypto.randomBytes(32).toString('base64')
    
    return {
      'Content-Type': 'application/json;charset=UTF-8',
      'X-ASSUME-MERCHANT': this.config.merchantId,
      'Authorization': this.generateSignature(method, resourceUrl, body, timestamp, nonce),
      'X-PAYPAY-TIMESTAMP': timestamp,
      'X-PAYPAY-NONCE': nonce,
    }
  }

  /**
   * Create payment order
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    const resourceUrl = '/v2/payments'
    const body = JSON.stringify(request)
    
    try {
      const response = await fetch(`${this.baseUrl}${resourceUrl}`, {
        method: 'POST',
        headers: this.generateHeaders('POST', resourceUrl, body),
        body,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PayPayError(
          `PayPay API Error: ${response.status}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data as PaymentResponse
    } catch (error) {
      if (error instanceof PayPayError) {
        throw error
      }
      throw new PayPayError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      )
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(merchantPaymentId: string): Promise<PaymentStatusResponse> {
    const resourceUrl = `/v2/payments/${encodeURIComponent(merchantPaymentId)}`
    
    try {
      const response = await fetch(`${this.baseUrl}${resourceUrl}`, {
        method: 'GET',
        headers: this.generateHeaders('GET', resourceUrl, ''),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PayPayError(
          `PayPay API Error: ${response.status}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data as PaymentStatusResponse
    } catch (error) {
      if (error instanceof PayPayError) {
        throw error
      }
      throw new PayPayError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      )
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(merchantPaymentId: string): Promise<PaymentStatusResponse> {
    const resourceUrl = `/v2/payments/${encodeURIComponent(merchantPaymentId)}/cancel`
    
    try {
      const response = await fetch(`${this.baseUrl}${resourceUrl}`, {
        method: 'DELETE',
        headers: this.generateHeaders('DELETE', resourceUrl, ''),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PayPayError(
          `PayPay API Error: ${response.status}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data as PaymentStatusResponse
    } catch (error) {
      if (error instanceof PayPayError) {
        throw error
      }
      throw new PayPayError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      )
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.apiSecret)
        .update(payload)
        .digest('hex')

      // PayPay sends signature in format: sha256=<signature>
      const receivedSignature = signature.startsWith('sha256=') 
        ? signature.substring(7) 
        : signature

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }
}

export class PayPayError extends Error {
  public statusCode: number
  public details: any

  constructor(message: string, statusCode: number, details?: any) {
    super(message)
    this.name = 'PayPayError'
    this.statusCode = statusCode
    this.details = details
  }
}

// Singleton instance
let payPayClient: PayPayClient | null = null

export function getPayPayClient(): PayPayClient {
  if (!payPayClient) {
    const config: PayPayConfig = {
      apiKey: process.env.PAYPAY_API_KEY!,
      apiSecret: process.env.PAYPAY_API_SECRET!,
      merchantId: process.env.PAYPAY_MERCHANT_ID!,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    }

    // Validate configuration
    if (!config.apiKey || !config.apiSecret || !config.merchantId) {
      throw new Error('PayPay configuration is incomplete. Check environment variables.')
    }

    payPayClient = new PayPayClient(config)
  }

  return payPayClient
}