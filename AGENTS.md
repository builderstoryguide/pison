# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Daily Collection Management System (DCMS)** for a microfinance company. It manages daily collections from clients, agent operations, loan processing, financial transactions, and compliance reporting. Built with Next.js 15.3, React 19, TypeScript, Tailwind CSS 4, Prisma ORM, and PostgreSQL.

## Commands

```bash
# Install dependencies (--force required for React 19 peer deps)
npm install --force

# Development server
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Code formatting
npm run format

# Database operations
npx prisma db push          # Push schema to database
npx prisma generate         # Generate Prisma client
npx prisma studio           # Open database GUI

# E2E tests (Playwright)
npm run test:e2e

# Run single Playwright test
npx playwright test e2e/specs/api/clients.spec.ts

# Test database setup
npm run db:test:push

# Seed microfinance data
npm run seed:microfinance
```

## Architecture

### Directory Structure

- `app/` - Next.js App Router
  - `(auth)/` - Public authentication pages (signin, signup, reset-password)
  - `(protected)/` - Authenticated pages requiring login
  - `api/` - API routes organized by domain (clients, agents, loans, transactions, reports)
  - `components/layouts/` - Demo layout components (Demo1Layout is active)
- `lib/services/` - Business logic layer (service classes for each domain)
- `lib/utils/` - Utility functions (export, helpers)
- `lib/hooks/` - React hooks (useApi)
- `components/` - Reusable UI components (ReUI-based)
- `prisma/` - Database schema and migrations
- `e2e/` - Playwright end-to-end tests
- `i18n/` - Internationalization (French & English)

### Service Layer Pattern

All business logic is in `lib/services/`. Services are singletons exported from `lib/services/index.ts`:

```typescript
import { clientService, transactionService, loanService } from '@/lib/services';
```

Services handle validation, business rules, and database operations. API routes are thin wrappers that call services.

### API Route Pattern

API routes follow RESTful conventions with consistent response format:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...' } }
```

Routes use `getServerSession(authOptions)` for authentication and check `session.user?.roleName` for authorization.

### Authentication

- NextAuth v4 with JWT strategy (`app/api/auth/[...nextauth]/`)
- Auth options in `app/api/auth/[...nextauth]/auth-options.ts`
- Middleware at `middleware.ts` protects routes
- Public paths: /signin, /signup, /reset-password, /verify-email, /api/auth/*

### Database

- Prisma with PostgreSQL using `@prisma/adapter-pg`
- Client singleton in `lib/prisma.ts`
- All monetary values use `Decimal(19, 4)`
- Soft deletes preferred (no hard deletes on financial records)
- For local development: see `config/postgresql-local.conf` and `docs/DATABASE_SETUP.md` for optimized PostgreSQL settings

## Domain Concepts

### User Roles (RBAC)
- **Administrator**: Full system access, approves transactions
- **Accountant**: Financial operations, client/agent management
- **Agent**: Collection operations in assigned areas only
- **Client**: Read-only access to own account

### Four-Eye Principle
Transactions require dual authorization:
1. Agent/Accountant creates transaction → status: `PENDING_APPROVAL`
2. Administrator reviews and approves/rejects → status: `COMPLETED` or `REJECTED`

### Daily Session Flow
1. Session opens for the day (`DailySession`)
2. Agents collect cash, enter ventilation entries
3. Transactions created as `PENDING_APPROVAL`
4. Administrator approves transactions at day end
5. Day closure generates reports (`DailyClosure`)

### Key Entities
- `CollectionArea` - Geographic zones for collection
- `Agent` - Collectors assigned to areas (via `AgentAreaAssignment`)
- `Client` - Account holders in collection areas
- `FinancialAccount` - Tracks balance with `balance` and `availableBalance`
- `Transaction` - All financial movements (DEPOSIT, WITHDRAWAL, COLLECTION, LOAN_DISBURSEMENT, etc.)
- `Loan` - Loan lifecycle from PENDING → APPROVED → DISBURSED → ACTIVE → PAID_OFF
- `Commission` - Calculated fees on transactions
- `AuditLog` - Immutable trail of all actions

## E2E Testing

Tests use Playwright with `.env.test` configuration:

```
e2e/
├── config/global-setup.ts    # Auth setup before tests
├── helpers/                  # API client, auth, seeding utilities
└── specs/
    ├── api/                  # API endpoint tests
    ├── auth/                 # Authentication flow tests
    └── flows/                # Business flow tests (collection, loan)
```

Auth state persisted in `e2e/.auth/user.json`.

## Important Notes

- All financial operations MUST use database transactions (`prisma.$transaction`)
- Always validate session is open before creating transactions
- Monetary calculations must use Decimal types (never JavaScript floats)
- Audit logs are automatically created for transaction approvals/rejections
- Currency is CFA Franc by default; format configured in `SystemSetting`
