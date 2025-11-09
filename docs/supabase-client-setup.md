# Supabase Client Setup Guide

## Overview

This project uses **`@supabase/ssr`** (Supabase SSR package) for all Supabase client creation. This is the official recommended package for Next.js App Router (Next.js 13+) and provides proper cookie handling for server-side rendering.

## Package Installation

The project requires the following Supabase packages:

```json
{
  "dependencies": {
    "@supabase/ssr": "^latest",
    "@supabase/supabase-js": "^2.56.1"
  }
}
```

**Always ensure both packages are installed** when setting up the project:
```bash
npm install @supabase/ssr @supabase/supabase-js
```

## Client Types and Usage

### 1. Server-Side Client (`lib/supabase/server.ts`)

**Use for:** API routes, Server Components, Server Actions

**Import:**
```typescript
import { createClient } from '@/lib/supabase/server'
```

**Usage:**
```typescript
// In API routes or Server Components
export async function GET(request: NextRequest) {
  const supabase = await createClient() // Note: async function
  const { data, error } = await supabase.from('users').select('*')
  // ...
}
```

**Important:** This is an **async function** because it uses Next.js `cookies()` which is async.

### 2. Client-Side Client (`lib/supabase/client.ts`)

**Use for:** Client Components, React hooks, browser-side code

**Import:**
```typescript
import { createClient } from '@/lib/supabase/client'
```

**Usage:**
```typescript
// In Client Components
'use client'

import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient() // Note: synchronous function
  // ...
}
```

**Important:** This is a **synchronous function** for use in client components.

### 3. Service Role Client (`lib/supabase/service.ts`)

**Use for:** Server-side operations requiring admin privileges (bypasses RLS)

**Import:**
```typescript
import { createServiceClient } from '@/lib/supabase/service'
```

**Usage:**
```typescript
// In API routes only - requires service role key
const supabase = createServiceClient() // Note: synchronous function
const { data, error } = await supabase.from('users').select('*')
```

**Important:** 
- Only use in API routes (server-side)
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **NEVER expose this key to the client**
- Bypasses Row Level Security (RLS)

## Common Mistakes to Avoid

### ❌ WRONG: Direct import from `@supabase/ssr/server`

```typescript
// DON'T DO THIS
import { createClient } from '@supabase/ssr/server'
```

**Why:** The `@supabase/ssr` package exports from the main entry point, not subpaths. Use our utility functions instead.

### ❌ WRONG: Using `@supabase/ssr/browser`

```typescript
// DON'T DO THIS
import { createBrowserClient } from '@supabase/ssr/browser'
```

**Why:** Use `@/lib/supabase/client` instead for consistency.

### ❌ WRONG: Mixing client types

```typescript
// DON'T DO THIS - Using server client in client component
'use client'
import { createClient } from '@/lib/supabase/server' // ❌ Wrong!
```

### ❌ WRONG: Forgetting `await` for server client

```typescript
// DON'T DO THIS
const supabase = createClient() // Missing await!
```

Should be:
```typescript
const supabase = await createClient() // ✅ Correct
```

### ❌ WRONG: Using service client in client components

```typescript
// DON'T DO THIS - Security risk!
'use client'
import { createServiceClient } from '@/lib/supabase/service' // ❌ Never!
```

## Quick Reference Table

| Context | File to Import | Function Call | Async? |
|---------|---------------|---------------|--------|
| API Routes | `@/lib/supabase/server` | `await createClient()` | ✅ Yes |
| Server Components | `@/lib/supabase/server` | `await createClient()` | ✅ Yes |
| Client Components | `@/lib/supabase/client` | `createClient()` | ❌ No |
| API Routes (Admin) | `@/lib/supabase/service` | `createServiceClient()` | ❌ No |

## Environment Variables Required

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only for service client
```

## Troubleshooting

### Error: "Module not found: Can't resolve '@supabase/ssr/server'"

**Solution:**
1. Ensure `@supabase/ssr` is installed: `npm install @supabase/ssr`
2. Clear Next.js cache: Delete `.next` folder
3. Restart dev server: `npm run dev`
4. **Use utility functions** instead of direct imports:
   - Use `@/lib/supabase/server` instead of `@supabase/ssr/server`
   - Use `@/lib/supabase/client` instead of `@supabase/ssr/browser`

### Error: "createClient is not a function"

**Solution:**
- Check if you're using the correct import path
- Ensure you're awaiting server client: `await createClient()`
- Verify the package is installed: `npm list @supabase/ssr`

### Error: "Missing environment variables"

**Solution:**
- Check `.env.local` file exists
- Verify all required environment variables are set
- Restart dev server after adding environment variables

## Best Practices

1. **Always use utility functions** from `@/lib/supabase/*` instead of direct imports
2. **Never import service client in client-side code** - security risk
3. **Use server client in API routes** for proper cookie handling
4. **Clear build cache** (`rm -rf .next`) if you encounter import errors
5. **Keep dependencies updated** - regularly check for `@supabase/ssr` updates

## Migration Notes

If you see old code using:
```typescript
import { createClient } from '@supabase/supabase-js'
```

Update to:
- **Server-side**: `import { createClient } from '@/lib/supabase/server'`
- **Client-side**: `import { createClient } from '@/lib/supabase/client'`

This ensures proper SSR support and cookie handling.

