/**
 * IoT Locker Control System
 * ハードウェア連携・リアルタイム制御システム
 */

import { prisma } from './prisma'

// ================== Types ==================

export interface LockerCommand {
  lockerId: string
  command: 'LOCK' | 'UNLOCK' | 'STATUS' | 'RESET'
  parameters?: {
    unlockCode?: string
    duration?: number // seconds
    forceUnlock?: boolean
  }
}

export interface LockerResponse {
  lockerId: string
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'
  data?: {
    batteryLevel?: number
    temperature?: number
    humidity?: number
    isLocked?: boolean
    lastAccess?: string
  }
  error?: string
  timestamp: string
}

export interface LockerSensorData {
  lockerId: string
  batteryLevel: number
  temperature: number
  humidity: number
  isLocked: boolean
  doorOpenCount: number
  lastAccess: Date
  timestamp: Date
}

// ================== Locker Control Service ==================

export class LockerControlService {
  private apiEndpoint: string
  private apiKey: string
  private timeout: number = 30000 // 30 seconds

  constructor() {
    this.apiEndpoint = process.env.LOCKER_API_ENDPOINT || 'http://localhost:8080'
    this.apiKey = process.env.LOCKER_API_KEY || 'dev-key'
  }

  // ================== Core Control Methods ==================

  async lockLocker(lockerId: string): Promise<LockerResponse> {
    return this.sendCommand({
      lockerId,
      command: 'LOCK'
    })
  }

  async unlockLocker(lockerId: string, unlockCode: string, duration: number = 30): Promise<LockerResponse> {
    return this.sendCommand({
      lockerId,
      command: 'UNLOCK',
      parameters: {
        unlockCode,
        duration
      }
    })
  }

  async getLockerStatus(lockerId: string): Promise<LockerResponse> {
    return this.sendCommand({
      lockerId,
      command: 'STATUS'
    })
  }

  async resetLocker(lockerId: string): Promise<LockerResponse> {
    return this.sendCommand({
      lockerId,
      command: 'RESET',
      parameters: {
        forceUnlock: true
      }
    })
  }

  // ================== Emergency Controls ==================

  async emergencyUnlock(lockerId: string, reason: string, adminId: string): Promise<LockerResponse> {
    try {
      // Log emergency action
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'EMERGENCY_UNLOCK',
          resource: 'locker',
          resourceId: lockerId,
          details: {
            reason,
            timestamp: new Date().toISOString()
          },
          success: true
        }
      })

      const response = await this.sendCommand({
        lockerId,
        command: 'UNLOCK',
        parameters: {
          forceUnlock: true,
          duration: 300 // 5 minutes for emergency access
        }
      })

      // Update session if exists
      const activeSession = await prisma.session.findFirst({
        where: {
          lockerId,
          status: { in: ['ACTIVE', 'EXTENDED'] }
        }
      })

      if (activeSession) {
        await prisma.session.update({
          where: { id: activeSession.id },
          data: {
            status: 'EMERGENCY_ACCESSED',
            phoneAccess: { increment: 1 }
          }
        })
      }

      return response
    } catch (error) {
      console.error('Emergency unlock failed:', error)
      throw error
    }
  }

  async lockdownAll(reason: string, adminId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] }

    try {
      // Get all active lockers
      const lockers = await prisma.locker.findMany({
        where: {
          status: { in: ['AVAILABLE', 'OCCUPIED'] }
        }
      })

      // Log lockdown initiation
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'SYSTEM_LOCKDOWN',
          resource: 'system',
          details: {
            reason,
            lockerCount: lockers.length,
            timestamp: new Date().toISOString()
          },
          success: true
        }
      })

      // Lock all lockers concurrently
      const lockPromises = lockers.map(async (locker) => {
        try {
          await this.lockLocker(locker.id)
          
          // Update locker status
          await prisma.locker.update({
            where: { id: locker.id },
            data: { status: 'MAINTENANCE' }
          })
          
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push(`Locker ${locker.lockerNumber}: ${error}`)
        }
      })

      await Promise.allSettled(lockPromises)

      return results
    } catch (error) {
      console.error('System lockdown failed:', error)
      throw error
    }
  }

  // ================== Sensor Data Management ==================

  async updateSensorData(lockerId: string, sensorData: Partial<LockerSensorData>): Promise<void> {
    try {
      await prisma.locker.update({
        where: { id: lockerId },
        data: {
          batteryLevel: sensorData.batteryLevel,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          updatedAt: new Date()
        }
      })

      // Check for alerts
      await this.checkSensorAlerts(lockerId, sensorData)
    } catch (error) {
      console.error('Failed to update sensor data:', error)
      throw error
    }
  }

  private async checkSensorAlerts(lockerId: string, sensorData: Partial<LockerSensorData>): Promise<void> {
    const alerts: string[] = []

    // Battery level alert
    if (sensorData.batteryLevel !== undefined && sensorData.batteryLevel < 20) {
      alerts.push(`Low battery: ${sensorData.batteryLevel}%`)
    }

    // Temperature alert
    if (sensorData.temperature !== undefined) {
      if (sensorData.temperature > 40) {
        alerts.push(`High temperature: ${sensorData.temperature}°C`)
      } else if (sensorData.temperature < 0) {
        alerts.push(`Low temperature: ${sensorData.temperature}°C`)
      }
    }

    // Humidity alert
    if (sensorData.humidity !== undefined && sensorData.humidity > 80) {
      alerts.push(`High humidity: ${sensorData.humidity}%`)
    }

    // Create maintenance logs for alerts
    if (alerts.length > 0) {
      await prisma.maintenanceLog.create({
        data: {
          lockerId,
          type: 'ROUTINE_CHECK',
          description: `Sensor alerts: ${alerts.join(', ')}`,
          performedBy: 'System',
          status: 'PENDING'
        }
      })

      // Send notifications (implement as needed)
      console.warn(`Locker ${lockerId} alerts:`, alerts)
    }
  }

  // ================== Communication Layer ==================

  private async sendCommand(command: LockerCommand): Promise<LockerResponse> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock response for development
        return this.mockLockerResponse(command)
      }

      const response = await fetch(`${this.apiEndpoint}/api/lockers/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-Timeout': this.timeout.toString()
        },
        body: JSON.stringify(command)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: LockerResponse = await response.json()
      
      // Log command execution
      await this.logCommand(command, result)
      
      return result
    } catch (error) {
      console.error('Locker command failed:', error)
      
      const errorResponse: LockerResponse = {
        lockerId: command.lockerId,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      
      await this.logCommand(command, errorResponse)
      return errorResponse
    }
  }

  private mockLockerResponse(command: LockerCommand): LockerResponse {
    // Simulate different responses based on command
    const baseResponse: LockerResponse = {
      lockerId: command.lockerId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    }

    switch (command.command) {
      case 'STATUS':
        return {
          ...baseResponse,
          data: {
            batteryLevel: Math.floor(Math.random() * 100),
            temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
            humidity: Math.floor(Math.random() * 100),
            isLocked: Math.random() > 0.5,
            lastAccess: new Date(Date.now() - Math.random() * 86400000).toISOString()
          }
        }

      case 'UNLOCK':
        // Simulate occasional failure
        if (Math.random() < 0.05) {
          return {
            ...baseResponse,
            status: 'ERROR',
            error: 'Mechanical failure'
          }
        }
        return {
          ...baseResponse,
          data: {
            isLocked: false,
            lastAccess: new Date().toISOString()
          }
        }

      case 'LOCK':
        return {
          ...baseResponse,
          data: {
            isLocked: true,
            lastAccess: new Date().toISOString()
          }
        }

      case 'RESET':
        return {
          ...baseResponse,
          data: {
            isLocked: false,
            batteryLevel: 100,
            lastAccess: new Date().toISOString()
          }
        }

      default:
        return baseResponse
    }
  }

  private async logCommand(command: LockerCommand, response: LockerResponse): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `LOCKER_${command.command}`,
          resource: 'locker',
          resourceId: command.lockerId,
          details: {
            command: JSON.parse(JSON.stringify(command)),
            response: JSON.parse(JSON.stringify(response)),
            timestamp: new Date().toISOString()
          } as any,
          success: response.status === 'SUCCESS'
        }
      })
    } catch (error) {
      console.error('Failed to log locker command:', error)
    }
  }

  // ================== Health Monitoring ==================

  async performHealthCheck(): Promise<{
    online: number
    offline: number
    maintenance: number
    errors: string[]
  }> {
    const results = {
      online: 0,
      offline: 0,
      maintenance: 0,
      errors: [] as string[]
    }

    try {
      const lockers = await prisma.locker.findMany({
        where: {
          status: { not: 'OUT_OF_ORDER' }
        }
      })

      const checkPromises = lockers.map(async (locker) => {
        try {
          const response = await this.getLockerStatus(locker.id)
          
          if (response.status === 'SUCCESS') {
            if (locker.status === 'MAINTENANCE') {
              results.maintenance++
            } else {
              results.online++
            }
          } else {
            results.offline++
            results.errors.push(`Locker ${locker.lockerNumber}: ${response.error}`)
          }
        } catch (error) {
          results.offline++
          results.errors.push(`Locker ${locker.lockerNumber}: Connection failed`)
        }
      })

      await Promise.allSettled(checkPromises)

      return results
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

// ================== Singleton Instance ==================

export const lockerControl = new LockerControlService()