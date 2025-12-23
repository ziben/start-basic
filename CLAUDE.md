# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Code Quality
```bash
pnpm check            # Run format, lint, and type checks
pnpm format           # Format code with Prettier
pnpm lint             # Run ESLint
pnpm check-types      # Run TypeScript type checking
```

### Testing
```bash
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage report
```

### Database
```bash
npx prisma studio     # Open Prisma Studio (database GUI)
```

### Dependencies
```bash
pnpm deps             # Check for dependency updates
```

## Architecture Overview

### Tech Stack
- **Framework**: TanStack Start (file-based routing with SSR)
- **UI**: React 19 + Radix UI components + Tailwind CSS v4
- **Database**: Prisma ORM with LibSQL (SQLite)
- **Authentication**: Better Auth with email/password and role-based access control (RBAC)
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next (supports runtime translations from database)

### Project Structure

```
src/
├── routes/           # File-based routing (TanStack Router)
│   ├── __root.tsx    # Root route with providers and beforeLoad
│   ├── _authenticated/  # Protected routes (require auth)
│   ├── (public)/     # Public routes (sign-in, sign-up)
│   ├── admin/        # Admin section routes
│   └── api/          # API endpoints
├── features/         # Feature modules (self-contained)
│   └── [feature]/
│       ├── components/  # Feature-specific components
│       ├── data/        # Schemas, types, API clients
│       ├── hooks/       # Feature-specific hooks
│       └── utils/       # Feature-specific utilities
├── components/
│   ├── ui/           # Reusable UI primitives (shadcn/ui)
│   └── layout/       # Layout components
├── context/          # React contexts (theme, auth, locale, etc.)
├── lib/              # Core utilities (auth, db, env, utils)
├── i18n/             # Internationalization setup and locales
└── styles/           # Global styles
```

### Key Architectural Patterns

#### Route Structure & Authentication
- Routes use file-based layout with `__root.tsx` as the entry point
- `__root.tsx` sets up all providers and fetches the current user via `getUser()` server function
- Protected routes use `_authenticated/` layout with `beforeLoad` redirect to `/sign-in`
- Admin routes (`/admin`) check for admin roles (see `src/routes/admin/route.tsx`)

#### API Routes
- API routes are in `src/routes/api/` following REST conventions
- Use `createFileRoute` with `server` handlers for GET/POST/PUT/DELETE
- Admin endpoints use `withAdminAuth()` middleware from `src/middleware.ts`
- Query params are validated with Zod schemas

#### Feature Module Pattern
Each feature (e.g., `admin/users`) is self-contained:
- `components/` - Feature UI components (tables, dialogs, forms)
- `data/` - Zod schemas for validation and type definitions
- `hooks/` - Custom React hooks (e.g., `useAdminUsers`)
- `utils/` - Helper functions specific to the feature

#### Admin Authentication
- Better Auth is configured in `src/lib/auth.ts` with admin plugin
- Admin roles: `['admin', 'superadmin']`
- Admin API routes are protected with `withAdminAuth()` middleware
- The middleware checks `session.user.role` and returns 403 if unauthorized

#### Data Fetching & Caching
- TanStack Query is configured in `src/router.tsx`
- Cache time tiers: SHORT (30s), MEDIUM (5min), LONG (30min)
- Different query keys have custom stale times:
  - `['admin', 'navgroups']` - LONG (static)
  - `['admin-users']` - SHORT (frequent changes)
  - `['auth-session']` - MEDIUM

#### Database Schema
- Prisma schema is in `prisma/schema.prisma`
- Models include: User, Session, Account, Organization, Member, Invitation, NavGroup, NavItem, Translation
- Better Auth generates core auth tables (user, session, account, verification)
- Custom models for navigation management (role-based nav groups)

#### Internationalization
- i18next configured in `src/i18n/i18n.ts`
- Locales: `en`, `zh` (default: Chinese)
- Runtime translations loaded from database via `/api/i18n/$lng`
- Fallback to bundled locale files in `src/i18n/locales/`

## Environment Configuration

Required environment variables (see `.env.example`):
```bash
BETTER_AUTH_SECRET=    # Min 32 characters
BETTER_AUTH_URL=       # Default: http://localhost:3000
DATABASE_URL=          # Default: file:./prisma/dev.db
```

Configuration is validated at runtime via `src/lib/env.ts` using Zod.

## Naming Conventions

- **Components**: PascalCase (e.g., `AdminUsersTable.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAdminUsers.ts`)
- **Utils/Functions**: camelCase (e.g., `serializeAdminUser`)
- **API Routes**: Follow REST pattern (`/api/admin/user/`, `/api/admin/user/$id.ts`)

## Important Notes

- Always validate request/query params with Zod schemas in API routes
- Use `withAdminAuth()` middleware for admin-only endpoints
- When working with dates, serialize to ISO strings for client
- Prisma client is exported from `src/lib/db.ts` as a singleton
- Use `~/` or `@/` path aliases for imports (both resolve to `src/`)
- Default response language is Chinese (简体中文)
