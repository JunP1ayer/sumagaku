/**
 * NextAuth.js Type Extensions
 * TypeScript型定義の拡張
 */

import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      status: string
      studentId?: string
      department?: string
      loginCount: number
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    status: string
    studentId?: string
    department?: string
    loginCount: number
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: string
    status: string
    studentId?: string
    department?: string
    loginCount: number
  }
}