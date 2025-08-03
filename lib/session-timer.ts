/**
 * Server-side Session Timer Management System
 * サーバーサイドセッションタイマー管理システム
 */

import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@prisma/client'

// サーバーサイドでアクティブセッションの時間管理
export class SessionTimerManager {
  private static instance: SessionTimerManager
  private timers: Map<string, NodeJS.Timeout> = new Map()
  
  private constructor() {}
  
  static getInstance(): SessionTimerManager {
    if (!SessionTimerManager.instance) {
      SessionTimerManager.instance = new SessionTimerManager()
    }
    return SessionTimerManager.instance
  }
  
  /**
   * セッション開始時にタイマーを設定
   */
  async startSessionTimer(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { extensions: true }
      })
      
      if (!session || !['ACTIVE', 'EXTENDED'].includes(session.status)) {
        return
      }
      
      // 既存のタイマーがあればクリア
      this.clearSessionTimer(sessionId)
      
      // 総延長時間を計算
      const totalExtensionTime = session.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
      
      // 終了予定時刻を計算
      const originalEndTime = new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000)
      const actualEndTime = new Date(originalEndTime.getTime() + totalExtensionTime * 60 * 1000)
      
      // 現在時刻から終了予定時刻までの残り時間
      const remainingTime = actualEndTime.getTime() - Date.now()
      
      if (remainingTime <= 0) {
        // 既に時間切れ
        await this.completeSession(sessionId)
        return
      }
      
      // タイマー設定（自動完了）
      const timer = setTimeout(async () => {
        await this.completeSession(sessionId)
        this.timers.delete(sessionId)
      }, remainingTime)
      
      this.timers.set(sessionId, timer)
      
      console.log(`Session timer started for ${sessionId}, will complete in ${Math.round(remainingTime / 1000)} seconds`)
      
    } catch (error) {
      console.error('Failed to start session timer:', error)
    }
  }
  
  /**
   * セッション延長時にタイマーをリセット
   */
  async extendSessionTimer(sessionId: string): Promise<void> {
    await this.startSessionTimer(sessionId) // タイマーを再設定
  }
  
  /**
   * セッションタイマーをクリア
   */
  clearSessionTimer(sessionId: string): void {
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(sessionId)
      console.log(`Session timer cleared for ${sessionId}`)
    }
  }
  
  /**
   * 自動セッション完了処理
   */
  private async completeSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { locker: true }
      })
      
      if (!session || session.status === 'COMPLETED') {
        return
      }
      
      const endTime = new Date()
      const actualDuration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000)
      
      // セッション完了とロッカー解放をトランザクションで実行
      await prisma.$transaction(async (tx) => {
        // セッション完了
        await tx.session.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            endTime,
            actualDuration
          }
        })
        
        // ロッカー解放
        await tx.locker.update({
          where: { id: session.lockerId },
          data: {
            status: 'AVAILABLE',
            totalHours: { increment: actualDuration / 60 }
          }
        })
        
        // 使用統計の更新
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        await tx.usageStats.upsert({
          where: { date: today },
          update: {
            totalSessions: { increment: 1 },
            avgSessionTime: {
              // 簡単な移動平均の近似値
              increment: actualDuration / 60
            }
          },
          create: {
            date: today,
            totalSessions: 1,
            totalUsers: 1,
            avgSessionTime: actualDuration / 60,
            lockerUtilization: 0,
            totalRevenue: 0
          }
        })
      })
      
      console.log(`Session ${sessionId} auto-completed after ${actualDuration} minutes`)
      
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }
  
  /**
   * サーバー起動時に既存のアクティブセッションのタイマーを復元
   */
  async restoreActiveSessionTimers(): Promise<void> {
    try {
      const activeSessions = await prisma.session.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'EXTENDED']
          }
        },
        include: { extensions: true }
      })
      
      console.log(`Restoring timers for ${activeSessions.length} active sessions`)
      
      for (const session of activeSessions) {
        await this.startSessionTimer(session.id)
      }
      
    } catch (error) {
      console.error('Failed to restore active session timers:', error)
    }
  }
  
  /**
   * 全てのタイマーをクリア（サーバー終了時）
   */
  clearAllTimers(): void {
    for (const [sessionId, timer] of this.timers) {
      clearTimeout(timer)
      console.log(`Cleared timer for session ${sessionId}`)
    }
    this.timers.clear()
  }
  
  /**
   * アクティブなタイマー数を取得
   */
  getActiveTimerCount(): number {
    return this.timers.size
  }
  
  /**
   * 特定セッションの残り時間を取得（分単位）
   */
  async getSessionTimeRemaining(sessionId: string): Promise<number> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { extensions: true }
      })
      
      if (!session || !['ACTIVE', 'EXTENDED'].includes(session.status)) {
        return 0
      }
      
      // 総延長時間を計算
      const totalExtensionTime = session.extensions.reduce((sum, ext) => sum + ext.extendedBy, 0)
      
      // 終了予定時刻を計算
      const originalEndTime = new Date(session.startTime.getTime() + session.plannedDuration * 60 * 1000)
      const actualEndTime = new Date(originalEndTime.getTime() + totalExtensionTime * 60 * 1000)
      
      // 残り時間（分単位）
      const remainingMs = actualEndTime.getTime() - Date.now()
      return Math.max(0, Math.floor(remainingMs / 60000))
      
    } catch (error) {
      console.error('Failed to get session time remaining:', error)
      return 0
    }
  }
}

// シングルトンインスタンスをエクスポート
export const sessionTimerManager = SessionTimerManager.getInstance()

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  sessionTimerManager.clearAllTimers()
  process.exit(0)
})

process.on('SIGTERM', () => {
  sessionTimerManager.clearAllTimers()
  process.exit(0)
})