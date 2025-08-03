/**
 * Zod Validation Schemas
 * Enterprise-grade input validation and sanitization
 */

import { z } from 'zod'

// ================== User Validations ==================

export const userEmailSchema = z
  .string()
  .email('有効なメールアドレスを入力してください')
  .refine(
    (email) => {
      const validDomains = [
        'nagoya-u.ac.jp',
        'g.nagoya-u.ac.jp',
        's.thers.ac.jp'
      ]
      return validDomains.some(domain => email.endsWith(`@${domain}`))
    },
    {
      message: '大学のメールドメインを使用してください (@nagoya-u.ac.jp, @g.nagoya-u.ac.jp, @s.thers.ac.jp)'
    }
  )

export const createUserSchema = z.object({
  email: userEmailSchema,
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(100, '名前は100文字以下で入力してください')
    .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/, '有効な文字のみ使用してください'),
  studentId: z
    .string()
    .optional()
    .refine((id) => !id || /^[a-zA-Z0-9-]{5,20}$/.test(id), {
      message: '学籍番号は5-20文字の英数字とハイフンのみ使用可能です'
    }),
  department: z.string().max(100).optional(),
  year: z.number().int().min(1).max(10).optional()
})

export const updateUserSchema = createUserSchema.partial()

export const loginSchema = z.object({
  email: userEmailSchema,
  password: z.string().min(8, 'パスワードは8文字以上で入力してください').optional()
})

// ================== Session Validations ==================

export const createSessionSchema = z.object({
  lockerId: z.string().cuid(),
  plannedDuration: z
    .number()
    .int()
    .min(15, '最低15分以上に設定してください')
    .max(600, '最大10時間まで設定できます'), // 10時間 = 600分
  unlockCode: z
    .string()
    .regex(/^\d{4,6}$/, '解錠コードは4-6桁の数字で入力してください')
})

export const extendSessionSchema = z.object({
  sessionId: z.string().cuid(),
  extendedBy: z
    .number()
    .int()
    .min(15, '最低15分以上延長してください')
    .max(120, '一度に延長できるのは2時間までです'),
  reason: z.string().max(200).optional()
})

// ================== Payment Validations ==================

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .int()
    .min(100, '最低金額は100円です')
    .max(10000, '最大金額は10,000円です')
})

export const paypayCallbackSchema = z.object({
  merchantPaymentId: z.string(),
  paymentId: z.string(),
  status: z.enum(['COMPLETED', 'FAILED', 'CANCELLED']),
  amount: z.number().int().positive(),
  currency: z.string().default('JPY')
})

// ================== システム管理 Validations ==================

export const createLockerSchema = z.object({
  lockerNumber: z.number().int().min(1).max(9999),
  location: z.string().min(1).max(100)
})

export const updateLockerSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_ORDER', 'RESERVED']).optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  temperature: z.number().min(-50).max(100).optional(),
  humidity: z.number().min(0).max(100).optional(),
  maintenanceNotes: z.string().max(500).optional()
})

export const maintenanceLogSchema = z.object({
  lockerId: z.string().cuid(),
  type: z.enum(['ROUTINE_CHECK', 'BATTERY_REPLACEMENT', 'SENSOR_CALIBRATION', 'LOCK_REPAIR', 'EMERGENCY_REPAIR']),
  description: z.string().min(1).max(1000),
  performedBy: z.string().min(1).max(100),
  scheduledAt: z.date().optional()
})

// ================== API Response Schemas ==================

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.string(),
  path: z.string()
})

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ================== Helper Functions ==================

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ')
}

export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.parse(data)
  
  // Sanitize string fields
  if (typeof result === 'object' && result !== null) {
    const sanitized = { ...result }
    Object.keys(sanitized).forEach(key => {
      const value = (sanitized as any)[key]
      if (typeof value === 'string') {
        (sanitized as any)[key] = sanitizeString(value)
      }
    })
    return sanitized
  }
  
  return result
}

// ================== Type Exports ==================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type ExtendSessionInput = z.infer<typeof extendSessionSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type PayPalCallbackInput = z.infer<typeof paypayCallbackSchema>
export type CreateLockerInput = z.infer<typeof createLockerSchema>
export type UpdateLockerInput = z.infer<typeof updateLockerSchema>
export type MaintenanceLogInput = z.infer<typeof maintenanceLogSchema>
export type PaginationInput = z.infer<typeof paginationSchema>