/**
 * Lockers API - Management and Status
 * IoTロッカー管理システム
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLockerSchema, paginationSchema } from '@/lib/validations'
import { 
  successResponse, 
  createdResponse, 
  handleApiError, 
  paginatedResponse,
  forbiddenError
} from '@/lib/api-response'
import { withAuthenticatedApi, withAdminApi, withAuditLog, AuthenticatedRequest } from '@/lib/middleware'

// ================== List Available Lockers (Public) ==================

const listLockersHandler = async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = request.nextUrl
    const pagination = paginationSchema.parse({
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      sortBy: searchParams.get('sortBy') || 'lockerNumber',
      sortOrder: searchParams.get('sortOrder') || 'asc'
    })
    
    const location = searchParams.get('location')
    const status = searchParams.get('status') || 'AVAILABLE'
    const includeMaintenance = searchParams.get('includeMaintenance') === 'true'
    
    // Build where clause
    const whereClause: any = {}
    
    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      }
    }
    
    // For regular users, only show available lockers
    if (!request.user || !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      whereClause.status = 'AVAILABLE'
    } else if (status !== 'ALL') {
      whereClause.status = status
    }
    
    // Get total count
    const total = await prisma.locker.count({ where: whereClause })
    
    // Get lockers with current session info
    const lockers = await prisma.locker.findMany({
      where: whereClause,
      include: {
        sessions: {
          where: {
            status: {
              in: ['ACTIVE', 'EXTENDED']
            }
          },
          select: {
            id: true,
            userId: true,
            startTime: true,
            plannedDuration: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          take: 1
        },
        maintenanceLogs: includeMaintenance ? {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          },
          select: {
            id: true,
            type: true,
            description: true,
            status: true,
            scheduledAt: true
          },
          orderBy: {
            scheduledAt: 'asc'
          },
          take: 1
        } : false,
        _count: {
          select: {
            sessions: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      orderBy: {
        [pagination.sortBy as string]: pagination.sortOrder
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    })
    
    // Calculate derived fields and filter sensitive data
    const lockersWithMetadata = lockers.map(locker => {
      const currentSession = locker.sessions[0]
      const isOccupied = !!currentSession
      
      // For non-admin users, don't expose sensitive information
      const isAdmin = request.user && ['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)
      
      return {
        id: locker.id,
        lockerNumber: locker.lockerNumber,
        location: locker.location,
        status: locker.status,
        qrCode: isAdmin ? locker.qrCode : undefined,
        
        // IoT sensor data (admin only)
        batteryLevel: isAdmin ? locker.batteryLevel : undefined,
        temperature: isAdmin ? locker.temperature : undefined,
        humidity: isAdmin ? locker.humidity : undefined,
        
        // Usage statistics
        totalUsages: locker.totalUsages,
        totalHours: Math.round(locker.totalHours * 100) / 100,
        completedSessions: locker._count.sessions,
        
        // Current session info (limited for privacy)
        isOccupied,
        currentSession: currentSession ? {
          id: currentSession.id,
          startTime: currentSession.startTime,
          status: currentSession.status,
          // Only show user info to admins or session owner
          user: (isAdmin || currentSession.userId === request.user?.id) 
            ? currentSession.user 
            : { name: '利用中', email: '***' }
        } : null,
        
        // Maintenance info (admin only)
        maintenanceInfo: isAdmin && includeMaintenance ? locker.maintenanceLogs[0] : undefined,
        
        // Availability info
        estimatedAvailableAt: currentSession && ['ACTIVE', 'EXTENDED'].includes(currentSession.status)
          ? new Date(currentSession.startTime.getTime() + currentSession.plannedDuration * 60 * 1000)
          : null,
        
        lastMaintenance: isAdmin ? locker.lastMaintenance : undefined,
        createdAt: locker.createdAt,
        updatedAt: locker.updatedAt
      }
    })
    
    return paginatedResponse(
      lockersWithMetadata,
      pagination.page,
      pagination.limit,
      total
    )
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Create Locker (Admin Only) ==================

const createLockerHandler = async (request: AuthenticatedRequest) => {
  try {
    if (!request.user) {
      throw new Error('User not authenticated')
    }
    
    const body = await request.json()
    const lockerData = createLockerSchema.parse(body)
    
    // Generate QR code data
    const qrCodeData = `sumagaku://locker/${lockerData.lockerNumber}?location=${encodeURIComponent(lockerData.location)}`
    
    const locker = await prisma.locker.create({
      data: {
        ...lockerData,
        qrCode: qrCodeData
      }
    })
    
    return createdResponse({
      locker,
      message: 'ロッカーが正常に作成されました'
    })
    
  } catch (error) {
    return handleApiError(error, request.requestId)
  }
}

// ================== Get Locker Statistics (Admin Only) ==================

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

// ================== Route Handlers ==================

export const GET = withAuthenticatedApi(
  withAuditLog('LIST_LOCKERS')(listLockersHandler)
)

export const POST = withAdminApi(
  withAuditLog('CREATE_LOCKER')(createLockerHandler)
)

// Statistics moved to separate endpoint /api/lockers/stats