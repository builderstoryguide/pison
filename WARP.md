# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: School Management App (Next.js + TypeScript + Tailwind + Supabase)

Essential commands

- Install dependencies (prefer pnpm if available):
  ```bash path=null start=null
  pnpm install
  # or
  npm install
  ```

- Environment setup for Supabase (copy example and fill values):
  ```bash path=null start=null
  cp .env.example .env.local
  # Required keys in .env.local
  # NEXT_PUBLIC_SUPABASE_URL=...
  # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```

- Development server (Turbo):
  ```bash path=null start=null
  pnpm dev
  # or
  npm run dev
  ```
  - Faster dev (disables source maps):
    ```bash path=null start=null
    pnpm run dev:fast
    # or
    npm run dev:fast
    ```
  - Clean then start dev (note: rm on Windows PowerShell requires an alternative):
    ```bash path=null start=null
    # POSIX shells
    npm run dev:clean

    # Windows PowerShell equivalent
    Remove-Item -Recurse -Force .next; next dev --turbo --port 3000
    # or cross-platform
    npx rimraf .next && next dev --turbo --port 3000
    ```

- Build and run production server:
  ```bash path=null start=null
  pnpm build
  pnpm start
  # or
  npm run build
  npm start
  ```

- Linting and type checks:
  ```bash path=null start=null
  pnpm lint           # next lint
  npx tsc --noEmit    # type-check only

  # Full validation pipeline (imports + lint + tsc)
  npm run validate
  ```
  Note: next.config.mjs is configured to ignore ESLint and TypeScript errors during next build. Use lint/tsc/validate to enforce quality gates.

- Utility scripts (from package.json):
  ```bash path=null start=null
  npm run setup-env       # node scripts/setup-env.js
  npm run check-imports   # node scripts/check-missing-imports.js
  npm run pre-commit      # node scripts/pre-commit-check.js
  ```

- Tests: No test framework/config detected (no jest/vitest config or dependencies; tests are excluded in tsconfig). Update this section if tests are added.

Database and scripts

- Supabase is the primary data store. Populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
- Database schema and helpers live under scripts/ (see scripts/README.md):
  - Setup tables: scripts/create-tables.sql (run in Supabase SQL Editor)
  - Admin accounts: scripts/create-admin-users-complete.sql or node scripts/create-admin-user.js
  - Performance tuning: scripts/README-OPTIMIZATION.md and related SQL files

Architecture overview (big picture)

- Framework: Next.js 15 App Router with TypeScript and Tailwind.
- Key directories (high level):
  - app/: Next.js routes and pages (App Router)
  - components/: UI and domain components (admin/, auth/, ui/)
  - lib/: Utilities and React Contexts
  - public/: Static assets
  - scripts/: DB setup, admin seeding, and optimization utilities
- Data layer: Supabase via @supabase/supabase-js; the app expects all student data to reside in the database (no local-only storage). Enrollment and management flows require a configured database.
- Forms and validation: react-hook-form with Zod schemas; resolvers wired via @hookform/resolvers.
- State management: React Context API for shared app state.

Conventions and config that affect development

- TypeScript (tsconfig.json):
  - Strict mode enabled; bundler module resolution; noEmit.
  - Path alias @/* mapped to the repo root.
  - Tests are excluded in tsconfig ("**/*.test.*", "**/*.spec.*"), reinforcing the lack of a test runner.

- Next.js configuration (next.config.mjs):
  - experimental.turbo enabled; custom rule to import SVGs via @svgr/webpack.
  - experimental.allowedDevOrigins includes localhost and a LAN IP, enabling dev from local network.
  - images.unoptimized = true and images.domains includes a Supabase storage domain.
  - eslint.ignoreDuringBuilds and typescript.ignoreBuildErrors are true: build won’t fail on lint/type errors.
  - compiler.removeConsole in production; swcMinify enabled.
  - Dev webpack watchOptions tuned for faster rebuilds.

Important docs to reference

- README.md: Getting started, prerequisites (Node 18+, npm or pnpm), Supabase setup, and project structure summary.
- scripts/README.md: Admin user creation (SQL and Node paths), troubleshooting notes, and environment requirements for service role operations.
- scripts/README-OPTIMIZATION.md and scripts/README-SIMPLE-OPTIMIZATION.md: Database indexing/materialized views and performance guidance for the Subject Branches domain.

AI rules and assistants

- No existing CLAUDE.md, Cursor rules, Copilot instructions, or prior WARP.md detected in this repo. This file acts as the project-scoped rules for Warp agents.
