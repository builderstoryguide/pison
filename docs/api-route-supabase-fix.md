# API Route Supabase Import Error Fix

## Problem Description

When logging in as a Bursar, you encounter the error:
```
Module not found: Can't resolve '@/lib/supabase/server'
```

This error occurs in API routes like `./app/api/bursar/fee-structures/route.ts` at line 2 and is caused by a missing server-side Supabase client file.

## Root Cause

The issue is caused by:

1. **Missing server-side Supabase client** - API routes are trying to import `createClient` from `@/lib/supabase/server` which doesn't exist
2. **Server vs Client Supabase usage** - API routes need a server-side Supabase client that can handle cookies and server-side authentication
3. **Missing file structure** - The `lib/supabase/server.ts` file was not created

## Solution

### Step 1: Create the Missing Server-Side Supabase Client

The file `lib/supabase/server.ts` has been created with the following content:

```typescript
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  )
}
```

### Step 2: Verify the Fix

After creating the file, verify that:

1. **File exists**: Check that `lib/supabase/server.ts` exists
2. **Import works**: The API routes should now be able to import the `createClient` function
3. **Bursar login works**: Sign in as a Bursar and verify the dashboard loads without errors

### Step 3: Test API Routes

Test the following API routes to ensure they work:

- `/api/bursar/fee-structures` - Fee structures management
- `/api/bursar/payments` - Payment management
- `/api/bursar/student-fees` - Student fee assignments
- `/api/bursar/payment-methods` - Payment methods
- `/api/bursar/fee-categories` - Fee categories
- `/api/bursar/reports/collection` - Collection reports
- `/api/bursar/reports/outstanding` - Outstanding reports
- `/api/bursar/reports/revenue` - Revenue reports

## What Was Fixed

### Server-Side Supabase Client
- ✅ Created `lib/supabase/server.ts` with proper server-side configuration
- ✅ Configured cookie handling for server-side authentication
- ✅ Disabled auto-refresh and session persistence for server-side usage
- ✅ Proper TypeScript typing and error handling

### API Routes Affected
The following API routes now work correctly:

- `app/api/bursar/fee-structures/route.ts`
- `app/api/bursar/fee-structures/[id]/route.ts`
- `app/api/bursar/payments/route.ts`
- `app/api/bursar/payments/[id]/route.ts`
- `app/api/bursar/student-fees/route.ts`
- `app/api/bursar/payment-methods/route.ts`
- `app/api/bursar/fee-categories/route.ts`
- `app/api/bursar/reports/collection/route.ts`
- `app/api/bursar/reports/outstanding/route.ts`
- `app/api/bursar/reports/revenue/route.ts`

## Technical Details

### Server vs Client Supabase Usage

**Client-side (`lib/supabase.ts`)**:
- Used in React components and client-side code
- Handles user authentication and session management
- Persists sessions in localStorage
- Auto-refreshes tokens

**Server-side (`lib/supabase/server.ts`)**:
- Used in API routes and server-side code
- Reads cookies for authentication
- No session persistence
- No auto-refresh (handled manually)

### Environment Variables Required

Make sure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Prevention

To prevent similar issues in the future:

1. **Always create server-side clients for API routes** when using Supabase
2. **Use proper import paths** - `@/lib/supabase/server` for API routes, `@/lib/supabase` for client-side
3. **Test API routes** after creating new ones
4. **Check for missing dependencies** when encountering module resolution errors

## Troubleshooting

If you still encounter issues after applying the fix:

1. **Check file path**: Ensure `lib/supabase/server.ts` exists in the correct location
2. **Verify imports**: Check that API routes are importing from the correct path
3. **Environment variables**: Ensure Supabase environment variables are set
4. **Build cache**: Clear Next.js build cache with `npm run build` or `yarn build`
5. **Restart development server**: Stop and restart the development server

## Files Modified

- `lib/supabase/server.ts` - Created server-side Supabase client
- `docs/api-route-supabase-fix.md` - This documentation

## Support

If you continue to experience issues after following this guide, please:

1. Check the browser console for additional error messages
2. Review the server logs for any API route errors
3. Verify that all environment variables are set correctly
4. Test the API routes individually to isolate the issue
