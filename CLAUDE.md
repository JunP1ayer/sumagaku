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
**Sumagaku** is an enterprise-grade smart locker system for Nagoya University built with Next.js 14 App Router. The architecture follows a layered enterprise pattern:

- **Frontend**: Next.js 14 + TypeScript + Material-UI + Zustand state management
- **Backend**: Next.js API routes with middleware-based request processing
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with university SSO (email-based)
- **Payments**: PayPay integration for daily passes
- **IoT**: Smart locker control system

### Key Directories
- **`/app/`** - Next.js 14 App Router structure
  - `api/` - REST endpoints (auth, lockers, payments, sessions)
  - Pages and layouts following App Router conventions
- **`/lib/`** - Core business logic and utilities
  - `prisma.ts` - Database client with connection pooling
  - `auth-config.ts` - NextAuth.js configuration
  - `validations.ts` - Zod schemas for API validation
  - `iot-locker.ts` - IoT device integration
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

### State Management
- **Zustand** for client-side state management
- **NextAuth.js** for authentication state
- **Material-UI** theme provider for UI state

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
- University SSO integration (supports 3 email domains)
- JWT-based session management
- Role-based access control throughout the system

### Environment Variables
Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `JWT_SECRET` - JWT signing secret
- `PAYPAY_API_KEY`, `PAYPAY_API_SECRET`, `PAYPAY_MERCHANT_ID` - PayPay integration

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
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Regenerate client with `npx prisma generate`
4. Update TypeScript types if needed

### Deployment Notes
- Application is optimized for Vercel deployment
- Build includes automatic Prisma client generation
- Environment variables must be configured in Vercel dashboard
- Database connection uses connection pooling for production scalability