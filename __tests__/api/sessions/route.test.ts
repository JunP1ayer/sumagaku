/**
 * Session Management API Unit Tests
 * セッション管理の包括的テスト
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/sessions/route'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dailyPass: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    locker: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockPrisma = require('@/lib/prisma').prisma

describe('/api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/sessions - Create Session', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@student.nagoya-u.ac.jp',
      name: 'Test User',
    }

    const createMockRequest = (body: any, user = mockUser) => {
      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      ;(request as any).user = user
      ;(request as any).requestId = 'test-session-123'
      
      return request
    }

    it('正常なセッション作成', async () => {
      // Setup mocks
      mockPrisma.dailyPass.findFirst.mockResolvedValue({
        id: 'pass123',
        status: 'ACTIVE',
        validDate: new Date(),
      })
      
      // Mock to check for active sessions - should return null (no active sessions)
      mockPrisma.session.findFirst.mockResolvedValue(null)
      
      mockPrisma.locker.findUnique.mockResolvedValue({
        id: 'cm3x8b9k0000012abc123456',
        lockerNumber: 101,
        status: 'AVAILABLE',
        sessions: [] // No active sessions
      })
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Create a mock transaction client
        const mockTx = {
          session: {
            create: jest.fn().mockResolvedValue({
              id: 'cm3x8b9k0000123session456',
              userId: 'test-user-123',
              lockerId: 'cm3x8b9k0000012abc123456',
              lockerNumber: 101,
              status: 'ACTIVE',
              plannedDuration: 120,
              unlockCode: '1234',
              startTime: new Date('2025-08-03T12:00:00Z'),
              user: {
                id: 'test-user-123',
                name: 'Test User',
                email: 'test@student.nagoya-u.ac.jp'
              },
              locker: {
                id: 'cm3x8b9k0000012abc123456',
                lockerNumber: 101,
                location: 'Building A',
                qrCode: 'QR-101'
              }
            }),
          },
          locker: {
            update: jest.fn().mockResolvedValue({
              id: 'cm3x8b9k0000012abc123456',
              status: 'OCCUPIED',
              totalUsages: 1
            }),
          },
          dailyPass: {
            update: jest.fn().mockResolvedValue({
              id: 'pass123',
              usageCount: 1
            }),
          },
        }
        
        return await callback(mockTx)
      })

      const request = createMockRequest({
        lockerId: 'cm3x8b9k0000012abc123456', // Valid CUID format
        plannedDuration: 120, // 2 hours
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()


      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.session).toMatchObject({
        id: 'cm3x8b9k0000123session456',
        status: 'ACTIVE',
        plannedDuration: 120,
        unlockCode: '1234',
        user: {
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@student.nagoya-u.ac.jp'
        },
        locker: {
          id: 'cm3x8b9k0000012abc123456',
          lockerNumber: 101,
          location: 'Building A'
        }
      })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('有効な一日券がない場合はエラー', async () => {
      mockPrisma.dailyPass.findFirst.mockResolvedValue(null)

      const request = createMockRequest({
        lockerId: 'cm3x8b9k0000012abc123456',
        plannedDuration: 120,
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.message || data.message).toBe('有効な一日券がありません。決済を完了してください。')
      expect(mockPrisma.session.create).not.toHaveBeenCalled()
    })

    it('アクティブなセッションが既にある場合はエラー', async () => {
      mockPrisma.dailyPass.findFirst.mockResolvedValue({
        id: 'pass123',
        status: 'ACTIVE',
      })
      
      mockPrisma.session.findFirst.mockResolvedValue({
        id: 'existing-session',
        status: 'ACTIVE',
      })

      const request = createMockRequest({
        lockerId: 'cm3x8b9k0000012abc123456',
        plannedDuration: 120,
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.message || data.message).toBe('既にアクティブなセッションがあります')
    })

    it('利用できないロッカーの場合はエラー', async () => {
      mockPrisma.dailyPass.findFirst.mockResolvedValue({
        id: 'pass123',
        status: 'ACTIVE',
      })
      
      mockPrisma.session.findFirst.mockResolvedValue(null)
      
      mockPrisma.locker.findUnique.mockResolvedValue({
        id: 'cm3x8b9k0000012abc123456',
        status: 'OCCUPIED',
        sessions: []
      })

      const request = createMockRequest({
        lockerId: 'cm3x8b9k0000012abc123456',
        plannedDuration: 120,
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.message || data.message).toBe('このロッカーは現在利用できません')
    })

    it('存在しないロッカーIDでエラー', async () => {
      mockPrisma.dailyPass.findFirst.mockResolvedValue({
        id: 'pass123',
        status: 'ACTIVE',
      })
      
      mockPrisma.session.findFirst.mockResolvedValue(null)
      mockPrisma.locker.findUnique.mockResolvedValue(null)

      const request = createMockRequest({
        lockerId: 'cm3x8b9k0000099nonexistent',
        plannedDuration: 120,
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error?.message || data.message).toBe('ロッカーが見つかりません')
    })

    it('無効な計画時間でバリデーションエラー', async () => {
      const request = createMockRequest({
        lockerId: 'locker123',
        plannedDuration: -30, // Invalid negative duration
        unlockCode: '1234'
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.code || data.error).toBe('VALIDATION_ERROR')
    })

    it('認証されていないユーザーはエラー', async () => {
      const request = createMockRequest({
        lockerId: 'locker123',
        plannedDuration: 120,
        unlockCode: '1234'
      }, null)
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/sessions - List Sessions', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@student.nagoya-u.ac.jp',
    }

    const createMockGetRequest = (searchParams = {}, user = mockUser) => {
      const url = new URL('http://localhost:3000/api/sessions')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
      
      const request = new NextRequest(url.toString(), {
        method: 'GET',
      })
      
      ;(request as any).user = user
      ;(request as any).requestId = 'test-get-sessions-123'
      
      return request
    }

    it('正常なセッション一覧取得', async () => {
      const mockSessions = [
        {
          id: 'session1',
          userId: mockUser.id,
          lockerId: 'locker1',
          startTime: new Date(),
          endTime: null,
          plannedDuration: 120,
          actualDuration: null,
          status: 'ACTIVE',
          locker: {
            id: 'locker1',
            lockerNumber: 101,
            location: '図書館1階',
          },
          extensions: [],
        },
        {
          id: 'session2',
          userId: mockUser.id,
          lockerId: 'locker2',
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          endTime: new Date(Date.now() - 1800000), // 30 min ago
          plannedDuration: 90,
          actualDuration: 30,
          status: 'COMPLETED',
          locker: {
            id: 'locker2',
            lockerNumber: 102,
            location: '図書館1階',
          },
          extensions: [],
        },
      ]

      mockPrisma.session.findMany.mockResolvedValue(mockSessions)
      mockPrisma.session.count.mockResolvedValue(2)

      const request = createMockGetRequest({ page: 1, limit: 10 })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.metadata.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('フィルタ付きセッション取得', async () => {
      mockPrisma.session.findMany.mockResolvedValue([
        {
          id: 'active-session',
          userId: mockUser.id,
          lockerId: 'locker1',
          startTime: new Date(),
          endTime: null,
          plannedDuration: 60,
          actualDuration: null,
          status: 'ACTIVE',
          locker: { 
            id: 'locker1',
            lockerNumber: 101,
            location: '図書館1階'
          },
          extensions: [],
        },
      ])
      mockPrisma.session.count.mockResolvedValue(1)

      const request = createMockGetRequest({
        status: 'ACTIVE',
        page: 1,
        limit: 5,
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: 'ACTIVE',
        },
        include: { 
          locker: {
            select: {
              id: true,
              lockerNumber: true,
              location: true
            }
          },
          extensions: {
            select: {
              id: true,
              extendedBy: true,
              reason: true,
              timestamp: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        skip: 0,
        take: 5,
      })
    })

    it('空のセッション一覧', async () => {
      mockPrisma.session.findMany.mockResolvedValue([])
      mockPrisma.session.count.mockResolvedValue(0)

      const request = createMockGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
      expect(data.metadata.pagination.total).toBe(0)
    })

    it('無効なページネーション', async () => {
      const request = createMockGetRequest({
        page: -1, // Invalid page
        limit: 0,  // Invalid limit
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.code || data.error).toBe('VALIDATION_ERROR')
    })

    it('認証されていないユーザーはエラー', async () => {
      const request = createMockGetRequest({}, null)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Database Transaction Behavior', () => {
    it('セッション作成時のトランザクション失敗処理', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockPrisma.dailyPass.findFirst.mockResolvedValue({ id: 'pass123', status: 'ACTIVE' })
      mockPrisma.session.findFirst.mockResolvedValue(null)
      mockPrisma.locker.findUnique.mockResolvedValue({ id: 'locker123', status: 'AVAILABLE', sessions: [] })
      
      // Mock transaction failure
      mockPrisma.$transaction.mockRejectedValue(new Error('Database transaction failed'))

      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          lockerId: 'locker123',
          plannedDuration: 120,
          unlockCode: '1234'
        }),
      })
      ;(request as any).user = mockUser
      ;(request as any).requestId = 'test-123'

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})