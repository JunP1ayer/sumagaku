// ユーザー関連の型定義
export interface User {
  email: string
  name: string
  studentId: string
  loginTime: string
}

// 一日券関連の型定義
export interface DailyPass {
  purchaseDate: string | null
  isActive: boolean
  transactionId: string | null
}

// セッション関連の型定義
export interface Session {
  lockerId: number | null
  startTime: string | null
  duration: number | null // 分単位
  isActive: boolean
  timeRemaining: number // 秒単位
}

// 準備時間関連の型定義
export interface PreparationTime {
  isActive: boolean
  timeRemaining: number // 秒単位
  lockerId: number | null
  duration: number | null // 分単位
}

// ロッカー関連の型定義
export interface Locker {
  id: number
  isAvailable: boolean
  location: string
}

// アプリストア全体の型定義
export interface AppStore {
  // State
  user: User | null
  isAuthenticated: boolean
  dailyPass: DailyPass
  currentSession: Session
  preparationTime: PreparationTime
  lockers: Locker[]

  // Actions
  setUser: (user: User) => void
  purchaseDailyPass: (transactionId: string) => void
  isDailyPassValid: () => boolean
  startPreparation: (lockerId: number, duration: number) => void
  updatePreparationTimer: () => void
  startSessionFromPreparation: () => void
  startSession: (lockerId: number, duration: number) => void
  updateTimer: () => void
  endSession: () => void
  releaseLocker: (lockerId: number) => void
  reset: () => void
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