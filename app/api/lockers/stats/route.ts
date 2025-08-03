/**
 * Locker Statistics API
 * 管理者向け統計情報エンドポイント
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api-response'
import { withAdminApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'

const getLockerStatsHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const { searchParams } = request.nextUrl
    const days = Number(searchParams.get('days')) || 30
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Aggregate statistics
    const [
      totalLockers,
      availableLockers,
      occupiedLockers,
      maintenanceLockers,
      totalSessions,
      totalUsageHours,
      averageSessionTime,
      popularLocations
    ] = await Promise.all([
      // Total lockers
      prisma.locker.count(),
      
      // Available lockers
      prisma.locker.count({
        where: { status: 'AVAILABLE' }
      }),
      
      // Occupied lockers
      prisma.locker.count({
        where: { status: 'OCCUPIED' }
      }),
      
      // Maintenance lockers
      prisma.locker.count({
        where: { 
          status: {
            in: ['MAINTENANCE', 'OUT_OF_ORDER']
          }
        }
      }),
      
      // Total sessions in period
      prisma.session.count({
        where: {
          startTime: {
            gte: startDate
          }
        }
      }),
      
      // Total usage hours
      prisma.session.aggregate({
        where: {
          startTime: {
            gte: startDate
          },
          status: 'COMPLETED'
        },
        _sum: {
          actualDuration: true
        }
      }),
      
      // Average session time
      prisma.session.aggregate({
        where: {
          startTime: {
            gte: startDate
          },
          status: 'COMPLETED'
        },
        _avg: {
          actualDuration: true
        }
      }),
      
      // Popular locations
      prisma.locker.groupBy({
        by: ['location'],
        _count: {
          id: true
        },
        _sum: {
          totalUsages: true
        },
        orderBy: {
          _sum: {
            totalUsages: 'desc'
          }
        },
        take: 5
      })
    ])
    
    const stats = {
      overview: {
        totalLockers,
        availableLockers,
        occupiedLockers,
        maintenanceLockers,
        utilizationRate: totalLockers > 0 ? Math.round((occupiedLockers / totalLockers) * 100) : 0
      },
      usage: {
        totalSessions,
        totalUsageHours: Math.round((totalUsageHours._sum.actualDuration || 0) / 60 * 100) / 100,
        averageSessionTime: Math.round((averageSessionTime._avg.actualDuration || 0) * 100) / 100,
        period: `${days}日間`
      },
      locations: popularLocations.map(location => ({
        name: location.location,
        totalUsages: location._sum?.totalUsages || 0,
        lockerCount: location._count?.id || 0
      }))
    }
    
    return successResponse(stats)
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

export const GET = withAdminApi(
  withAuditLog('GET_LOCKER_STATS')(getLockerStatsHandler)
)

// Force dynamic rendering
export const dynamic = 'force-dynamic'