import { create } from 'zustand'
import type { AppStore, User, DailyPass, Session, Locker } from '../types'

// 日付ユーティリティ関数
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

const isToday = (dateString: string): boolean => {
  const today = formatDate(new Date())
  return dateString === today
}

const useAppStore = create<AppStore>((set, get) => ({
  // ユーザー状態
  user: null,
  isAuthenticated: false,
  
  // 一日券システム
  dailyPass: {
    purchaseDate: null,
    isActive: false,
    transactionId: null,
  },
  
  // 現在のセッション
  currentSession: {
    lockerId: null,
    startTime: null,
    duration: null, // 分単位
    isActive: false,
    timeRemaining: 0,
  },
  
  // ロッカー状態
  lockers: [
    { id: 1, isAvailable: true, location: '1F-A' },
    { id: 2, isAvailable: true, location: '1F-B' },
    { id: 3, isAvailable: false, location: '1F-C' },
    { id: 4, isAvailable: true, location: '2F-A' },
    { id: 5, isAvailable: true, location: '2F-B' },
  ],

  // Actions
  setUser: (user: User) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  // 一日券購入
  purchaseDailyPass: (transactionId: string) => {
    const today = formatDate(new Date())
    set({
      dailyPass: {
        purchaseDate: today,
        isActive: true,
        transactionId,
      }
    })
  },

  // 一日券の有効性チェック
  isDailyPassValid: () => {
    const { dailyPass } = get()
    if (!dailyPass.isActive || !dailyPass.purchaseDate) return false
    
    return isToday(dailyPass.purchaseDate)
  },

  // セッション開始
  startSession: (lockerId: number, duration: number) => {
    const startTime = new Date().toISOString()
    set((state) => ({
      currentSession: {
        lockerId,
        startTime,
        duration,
        isActive: true,
        timeRemaining: duration * 60, // 秒に変換
      },
      lockers: state.lockers.map(locker => 
        locker.id === lockerId 
          ? { ...locker, isAvailable: false }
          : locker
      )
    }))
  },

  // タイマー更新
  updateTimer: () => {
    const { currentSession } = get()
    if (!currentSession.isActive || currentSession.timeRemaining <= 0) return

    set((state) => ({
      currentSession: {
        ...state.currentSession,
        timeRemaining: Math.max(0, state.currentSession.timeRemaining - 1)
      }
    }))
  },

  // セッション終了
  endSession: () => {
    const { currentSession } = get()
    const lockerId = currentSession.lockerId
    
    set((state) => ({
      currentSession: {
        lockerId: null,
        startTime: null,
        duration: null,
        isActive: false,
        timeRemaining: 0,
      },
      lockers: state.lockers.map(locker => 
        locker.id === lockerId 
          ? { ...locker, isAvailable: true }
          : locker
      )
    }))
  },

  // ロッカー解放（緊急時）
  releaseLocker: (lockerId: number) => {
    set((state) => ({
      lockers: state.lockers.map(locker => 
        locker.id === lockerId 
          ? { ...locker, isAvailable: true }
          : locker
      )
    }))
  },

  // リセット（ログアウト時）
  reset: () => set({
    user: null,
    isAuthenticated: false,
    dailyPass: {
      purchaseDate: null,
      isActive: false,
      transactionId: null,
    },
    currentSession: {
      lockerId: null,
      startTime: null,
      duration: null,
      isActive: false,
      timeRemaining: 0,
    },
  }),
}))

export default useAppStore