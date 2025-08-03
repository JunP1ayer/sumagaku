// ユーザー関連の型定義 (Prisma Schema準拠)
export interface User {
  id: string
  email: string
  name: string
  studentId: string | null
  university: string
  department: string | null
  year: number | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  loginCount: number
}

export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY', 
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DEACTIVATED = 'DEACTIVATED'
}

// 一日券関連の型定義 (Prisma Schema準拠)
export interface DailyPass {
  id: string
  userId: string
  paymentId: string
  amount: number
  currency: string
  validDate: string
  purchasedAt: string
  status: PassStatus
  usageCount: number
  maxUsage: number
  createdAt: string
  updatedAt: string
}

// フロントエンド用の一日券状態
export interface DailyPassState {
  purchaseDate: string | null
  isActive: boolean
  transactionId: string | null
}

export enum PassStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  SUSPENDED = 'SUSPENDED'
}

// セッション関連の型定義 (Prisma Schema準拠)
export interface Session {
  id: string
  userId: string
  lockerNumber: number
  lockerId: string
  status: SessionStatus
  startTime: string
  endTime: string | null
  plannedDuration: number // 分単位
  actualDuration: number | null // 分単位
  unlockCode: string
  phoneAccess: number
  extendedTimes: number
  createdAt: string
  updatedAt: string
}

// フロントエンド用のセッション状態
export interface SessionState {
  sessionId: string | null
  lockerId: number | null
  startTime: string | null
  duration: number | null // 分単位
  isActive: boolean
  timeRemaining: number // 秒単位
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  INTERRUPTED = 'INTERRUPTED', 
  EXTENDED = 'EXTENDED',
  EMERGENCY_ACCESSED = 'EMERGENCY_ACCESSED'
}

// 準備時間関連の型定義
export interface PreparationTime {
  isActive: boolean
  timeRemaining: number // 秒単位
  lockerId: number | null
  duration: number | null // 分単位
}

// ロッカー関連の型定義 (Prisma Schema準拠)
export interface Locker {
  id: string
  lockerNumber: number
  location: string
  qrCode: string
  status: LockerStatus
  batteryLevel: number | null
  temperature: number | null
  humidity: number | null
  lastMaintenance: string | null
  maintenanceNotes: string | null
  totalUsages: number
  totalHours: number
  createdAt: string
  updatedAt: string
}

// フロントエンド用のロッカー状態
export interface LockerState {
  id: number
  isAvailable: boolean
  location: string
}

export enum LockerStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  RESERVED = 'RESERVED'
}

// アプリストア全体の型定義
export interface AppStore {
  // State
  user: User | null
  isAuthenticated: boolean
  dailyPass: DailyPassState
  currentSession: SessionState
  preparationTime: PreparationTime
  lockers: LockerState[]

  // Actions
  setUser: (user: User) => void
  purchaseDailyPass: (transactionId: string) => void
  isDailyPassValid: () => boolean
  startPreparation: (lockerId: number, duration: number) => void
  updatePreparationTimer: () => void
  startSessionFromPreparation: (sessionId: string) => void
  startSession: (sessionId: string, lockerId: number, duration: number) => void
  updateTimer: () => void
  endSession: () => void
  releaseLocker: (lockerId: number) => void
  reset: () => void
}

// 決済関連の型定義 (Prisma Schema準拠)
export interface Payment {
  id: string
  userId: string
  paypayOrderId: string
  paypayTxId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
  refundedAt: string | null
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

// PayPay決済関連（将来の拡張用）
export interface PaymentTransaction {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

// API レスポンス関連
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ロッカー制御関連（IoT統合用）
export interface LockerCommand {
  lockerId: number
  action: 'lock' | 'unlock'
  timestamp: string
  userId: string
}

export interface LockerStatus {
  id: number
  isLocked: boolean
  isOccupied: boolean
  batteryLevel?: number
  lastUpdate: string
}