/**
 * NextAuth.js API Route Handler
 * Dynamic API route for all authentication endpoints
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const handler = NextAuth(authOptions)

// Export named handlers for Next.js 13+ App Router
export { handler as GET, handler as POST }