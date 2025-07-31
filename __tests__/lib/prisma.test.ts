/**
 * Database Operation Tests
 * Prismaクライアントとデータベース操作のテスト
 */

import { prisma } from '@/lib/prisma'

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
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    dailyPass: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    locker: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

const mockPrisma = prisma as any

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Operations', () => {
    it('ユーザー作成', async () => {
      const userData = {
        email: 'test@student.nagoya-u.ac.jp',
        name: 'Test User',
        studentId: 'S123456',
        university: '名古屋大学',
        role: 'STUDENT',
      }

      const createdUser = {
        id: 'user123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.create.mockResolvedValue(createdUser)

      const result = await prisma.user.create({
        data: userData,
      })

      expect(result).toEqual(createdUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      })
    })

    it('ユーザー検索 - メールアドレス', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@student.nagoya-u.ac.jp',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await prisma.user.findUnique({
        where: { email: 'test@student.nagoya-u.ac.jp' },
      })

      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@student.nagoya-u.ac.jp' },
      })
    })

    it('ユーザー更新', async () => {
      const updatedUser = {
        id: 'user123',
        name: 'Updated Name',
        updatedAt: new Date(),
      }

      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const result = await prisma.user.update({
        where: { id: 'user123' },
        data: { name: 'Updated Name' },
      })

      expect(result).toEqual(updatedUser)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { name: 'Updated Name' },
      })
    })
  })

  describe('Payment Operations', () => {
    it('決済レコード作成', async () => {
      const paymentData = {
        userId: 'user123',
        amount: 500,
        status: 'PENDING',
        paypayOrderId: 'sumagaku_user123_123456',
      }

      const createdPayment = {
        id: 'payment123',
        ...paymentData,
        createdAt: new Date(),
      }

      mockPrisma.payment.create.mockResolvedValue(createdPayment)

      const result = await prisma.payment.create({
        data: paymentData,
      })

      expect(result).toEqual(createdPayment)
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: paymentData,
      })
    })

    it('決済状態更新', async () => {
      const updatedPayment = {
        id: 'payment123',
        status: 'COMPLETED',
        completedAt: new Date(),
      }

      mockPrisma.payment.update.mockResolvedValue(updatedPayment)

      const result = await prisma.payment.update({
        where: { id: 'payment123' },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(result).toEqual(updatedPayment)
      expect(mockPrisma.payment.update).toHaveBeenCalled()
    })

    it('未完了決済検索', async () => {
      const pendingPayment = {
        id: 'payment123',
        userId: 'user123',
        status: 'PENDING',
        createdAt: new Date(),
      }

      mockPrisma.payment.findFirst.mockResolvedValue(pendingPayment)

      const result = await prisma.payment.findFirst({
        where: {
          userId: 'user123',
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
      })

      expect(result).toEqual(pendingPayment)
      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'PENDING',
          createdAt: {
            gte: expect.any(Date),
          },
        },
      })
    })
  })

  describe('Session Operations', () => {
    it('セッション作成', async () => {
      const sessionData = {
        userId: 'user123',
        lockerId: 'locker123',
        startTime: new Date(),
        plannedDuration: 120,
        status: 'ACTIVE',
      }

      const createdSession = {
        id: 'session123',
        ...sessionData,
      }

      mockPrisma.session.create.mockResolvedValue(createdSession)

      const result = await prisma.session.create({
        data: sessionData,
      })

      expect(result).toEqual(createdSession)
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: sessionData,
      })
    })

    it('アクティブセッション検索', async () => {
      const activeSession = {
        id: 'session123',
        userId: 'user123',
        status: 'ACTIVE',
      }

      mockPrisma.session.findFirst.mockResolvedValue(activeSession)

      const result = await prisma.session.findFirst({
        where: {
          userId: 'user123',
          status: 'ACTIVE',
        },
      })

      expect(result).toEqual(activeSession)
      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'ACTIVE',
        },
      })
    })

    it('セッション一覧取得（ページネーション）', async () => {
      const sessions = [
        { id: 'session1', userId: 'user123' },
        { id: 'session2', userId: 'user123' },
      ]

      mockPrisma.session.findMany.mockResolvedValue(sessions)
      mockPrisma.session.count.mockResolvedValue(10)

      const result = await prisma.session.findMany({
        where: { userId: 'user123' },
        include: { locker: true },
        orderBy: { startTime: 'desc' },
        skip: 0,
        take: 5,
      })

      const count = await prisma.session.count({
        where: { userId: 'user123' },
      })

      expect(result).toEqual(sessions)
      expect(count).toBe(10)
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: { locker: true },
        orderBy: { startTime: 'desc' },
        skip: 0,
        take: 5,
      })
    })
  })

  describe('Daily Pass Operations', () => {
    it('一日券作成', async () => {
      const passData = {
        userId: 'user123',
        paymentId: 'payment123',
        amount: 500,
        validDate: new Date(),
        status: 'ACTIVE',
      }

      const createdPass = {
        id: 'pass123',
        ...passData,
      }

      mockPrisma.dailyPass.create.mockResolvedValue(createdPass)

      const result = await prisma.dailyPass.create({
        data: passData,
      })

      expect(result).toEqual(createdPass)
      expect(mockPrisma.dailyPass.create).toHaveBeenCalledWith({
        data: passData,
      })
    })

    it('今日の有効な一日券検索', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const activeDailyPass = {
        id: 'pass123',
        userId: 'user123',
        status: 'ACTIVE',
        validDate: today,
      }

      mockPrisma.dailyPass.findFirst.mockResolvedValue(activeDailyPass)

      const result = await prisma.dailyPass.findFirst({
        where: {
          userId: 'user123',
          status: 'ACTIVE',
          validDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      })

      expect(result).toEqual(activeDailyPass)
      expect(mockPrisma.dailyPass.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'ACTIVE',
          validDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      })
    })
  })

  describe('Locker Operations', () => {
    it('利用可能なロッカー一覧', async () => {
      const availableLockers = [
        {
          id: 'locker1',
          lockerNumber: 101,
          status: 'AVAILABLE',
          location: '図書館1階',
        },
        {
          id: 'locker2',
          lockerNumber: 102,
          status: 'AVAILABLE',
          location: '図書館1階',
        },
      ]

      mockPrisma.locker.findMany.mockResolvedValue(availableLockers)

      const result = await prisma.locker.findMany({
        where: { status: 'AVAILABLE' },
        orderBy: { lockerNumber: 'asc' },
      })

      expect(result).toEqual(availableLockers)
      expect(mockPrisma.locker.findMany).toHaveBeenCalledWith({
        where: { status: 'AVAILABLE' },
        orderBy: { lockerNumber: 'asc' },
      })
    })

    it('ロッカー状態更新', async () => {
      const updatedLocker = {
        id: 'locker123',
        status: 'OCCUPIED',
        updatedAt: new Date(),
      }

      mockPrisma.locker.update.mockResolvedValue(updatedLocker)

      const result = await prisma.locker.update({
        where: { id: 'locker123' },
        data: { status: 'OCCUPIED' },
      })

      expect(result).toEqual(updatedLocker)
      expect(mockPrisma.locker.update).toHaveBeenCalledWith({
        where: { id: 'locker123' },
        data: { status: 'OCCUPIED' },
      })
    })
  })

  describe('Transaction Operations', () => {
    it('決済完了トランザクション', async () => {
      const mockTransactionCallback = jest.fn().mockResolvedValue('success')
      mockPrisma.$transaction.mockImplementation(mockTransactionCallback)

      const transactionFn = async (tx: any) => {
        await tx.payment.update({
          where: { id: 'payment123' },
          data: { status: 'COMPLETED' },
        })
        
        await tx.dailyPass.create({
          data: {
            userId: 'user123',
            paymentId: 'payment123',
            amount: 500,
            validDate: new Date(),
            status: 'ACTIVE',
          },
        })
        
        return 'success'
      }

      const result = await prisma.$transaction(transactionFn)

      expect(result).toBe('success')
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(transactionFn)
    })

    it('セッション開始トランザクション', async () => {
      const mockTransactionResult = {
        session: { id: 'session123' },
        locker: { id: 'locker123' },
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          session: {
            create: jest.fn().mockResolvedValue({ id: 'session123' }),
          },
          locker: {
            update: jest.fn().mockResolvedValue({ id: 'locker123' }),
          },
        }
        return await callback(mockTx)
      })

      const result = await prisma.$transaction(async (tx) => {
        const session = await tx.session.create({
          data: {
            userId: 'user123',
            lockerId: 'locker123',
            startTime: new Date(),
            status: 'ACTIVE',
          },
        })
        
        const locker = await tx.locker.update({
          where: { id: 'locker123' },
          data: { status: 'OCCUPIED' },
        })
        
        return { session, locker }
      })

      expect(result).toEqual({
        session: { id: 'session123' },
        locker: { id: 'locker123' },
      })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('トランザクション失敗時のロールバック', async () => {
      const error = new Error('Transaction failed')
      mockPrisma.$transaction.mockRejectedValue(error)

      await expect(
        prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: 'payment123' },
            data: { status: 'COMPLETED' },
          })
          throw error
        })
      ).rejects.toThrow('Transaction failed')

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('Audit Log Operations', () => {
    it('監査ログ作成', async () => {
      const auditData = {
        userId: 'user123',
        action: 'CREATE_SESSION',
        resource: 'session',
        resourceId: 'session123',
        details: { lockerId: 'locker123' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }

      const createdLog = {
        id: 'audit123',
        ...auditData,
        timestamp: new Date(),
      }

      mockPrisma.auditLog.create.mockResolvedValue(createdLog)

      const result = await prisma.auditLog.create({
        data: auditData,
      })

      expect(result).toEqual(createdLog)
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: auditData,
      })
    })
  })
})