# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Development server
npm run dev

# Build for production (includes Prisma client generation)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test           # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes to database
npx prisma studio      # Open database browser
```

### Testing and Deployment
- **Local build testing**: Always run `npm run build` before pushing changes
- **Environment setup**: Use `.env.local` for development, ensure production env vars are set in Vercel
- **Database migrations**: Use `npx prisma db push` for schema changes

## Architecture Overview

### Application Structure
**Sumagaku (スマ学)** is a smart locker learning support system for Nagoya University that helps students achieve better focus by physically separating them from their smartphones. Built with Next.js 14 App Router following enterprise patterns:

- **Frontend**: Next.js 14 + TypeScript + Material-UI + Zustand state management
- **Backend**: Next.js API routes with middleware-based request processing  
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: Email-based registration (any domain accepted)
- **Payments**: PayPay integration for ¥100/day passes
- **IoT**: Smart locker control system (hardware in development)

### Key Directories
- **`/app/`** - Next.js 14 App Router structure
  - `api/` - REST endpoints (auth, lockers, payments, sessions)
  - Pages and layouts following App Router conventions
- **`/lib/`** - Core business logic and utilities
  - `prisma.ts` - Database client with connection pooling
  - `store.ts` - Zustand state management for sessions, timers, and user state
  - `validations.ts` - Zod schemas for API validation
  - `api-response.ts` - Standardized API response formats
  - `middleware.ts` - Request/response processing middleware
- **`/prisma/`** - Database schema and migrations
- **`/types/`** - TypeScript type definitions

### Database Schema
The Prisma schema includes:
- **User management** with role-based access (Student, Faculty, Admin, Super Admin)
- **Session system** for study session tracking with IoT integration
- **Payment system** with PayPay integration
- **Locker management** with IoT sensor monitoring
- **Audit logging** for all system operations
- **Analytics** for usage tracking

### User Flow and State Management
**Core User Journey**: `login → dashboard → memo-code → preparation → session → complete`

- **Zustand** (`lib/store.ts`) manages:
  - User authentication state
  - Daily pass validation (¥100/day)
  - Session timers (preparation: 60s, study sessions)
  - Locker availability and reservations
- **User-set unlock codes**: 4-6 digit codes set by users for locker access
- **Session lifecycle**: Preparation → Active → Completed with real-time timers

## Important Technical Details

### Build System
- **Critical**: The build script includes `npx prisma generate` to ensure Prisma client is generated before Next.js build
- **TypeScript**: Configured with strict mode disabled for flexibility
- **Path mapping**: Uses `@/*` for clean imports

### Database Connection
- Uses connection pooling in production
- Prisma client is initialized with environment-specific configurations
- Build-time database URL validation is disabled for Vercel deployment

### API Architecture
- All API routes use standardized response formats from `lib/api-response.ts`
- Middleware system for authentication, CORS, rate limiting, and audit logging
- Validation using Zod schemas from `lib/validations.ts`

### Authentication Flow
- Open email registration (any domain accepted - designed for library users)
- Simple email/password authentication for MVP
- Role-based access control throughout the system

### Environment Variables
Required for production:
- `DATABASE_URL` - PostgreSQL connection string (currently Supabase)
- `NEXTAUTH_URL` - Application URL  
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `JWT_SECRET` - JWT signing secret
- `PAYPAY_API_KEY`, `PAYPAY_API_SECRET`, `PAYPAY_MERCHANT_ID` - PayPay integration (not yet configured)

## Common Development Patterns

### API Route Structure
```typescript
// Standard API route with middleware
export const POST = withMiddleware(async (request: AuthenticatedRequest) => {
  const body = await request.json()
  const validatedData = schema.parse(body)
  // Business logic
  return successResponse(result)
})
```

### Database Operations
```typescript
// Always use Prisma client from lib/prisma.ts
import { prisma } from '@/lib/prisma'

// Use transactions for multi-table operations
const result = await prisma.$transaction(async (tx) => {
  // Multiple operations
})
```

### Type Safety
- All API inputs/outputs use Zod validation schemas
- Database operations use Prisma-generated types
- Frontend components use TypeScript interfaces

### Error Handling
- Use standardized error responses from `lib/api-response.ts`
- All errors are logged through the audit system
- Client-side errors are handled through toast notifications

## Development Guidelines

### Code Organization
- Business logic belongs in `/lib/`
- API routes should be thin wrappers around business logic
- Shared types go in `/types/`
- Validation schemas centralized in `lib/validations.ts`

### Database Changes
**Important**: This project uses Supabase with direct SQL management
1. Modify `prisma/schema.prisma` for local development
2. Use Supabase SQL Editor for production schema changes
3. Run `npx prisma db push` for local development
4. Run `npx prisma generate` to update client types
5. Update TypeScript types if needed

### Session Management Patterns
```typescript
// Access Zustand store in components
const { currentSession, startPreparation, updateTimer } = useAppStore()

// Timer management pattern (see /session and /preparation pages)
useEffect(() => {
  const timer = setInterval(() => {
    updateTimer()
    // Check for completion conditions
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

### Deployment Notes
- Application is optimized for Vercel deployment
- Build includes automatic Prisma client generation via `postinstall` script
- Environment variables must be configured in Vercel dashboard
- Database connection uses Supabase PostgreSQL with connection pooling
- Always run `npm run build` locally before pushing to catch build errors early

## Business Context
**Sumagaku (スマ学)** = "Smart Learning" - A learning support system that helps students focus by physically separating them from smartphones. Targeting Nagoya University initially, with plans to expand to other universities and educational institutions.

**Key differentiators**:
- Physical smartphone separation (not app-based blocking)
- User-set unlock codes for personal security  
- "Ritual UX" with preparation time and completion ceremony
- Learning analytics dashboard showing study progress
- Future expansion: IoT integration, receipt printing, biometric unlock