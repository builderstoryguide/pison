# Server-Side Authentication System

## Overview

This application uses a custom authentication system that validates users server-side using user IDs sent in request headers. This system replaces the previous Supabase auth session-based approach and works seamlessly with the localStorage-based client-side authentication.

## How It Works

### Client-Side Flow

1. **User Login**: When a user logs in, their user data is stored in `localStorage` under the key `school_user`
2. **API Requests**: All API requests automatically include the `X-User-Id` header containing the user's ID
3. **Automatic Header Injection**: The `lib/api-utils.ts` utility automatically reads from localStorage and adds the header

### Server-Side Flow

1. **Header Extraction**: API routes extract the `X-User-Id` header from incoming requests
2. **User Validation**: The user ID is validated against the database to ensure:
   - User exists
   - User is active (status = 'active')
   - User has valid permissions
3. **Role Checking**: Role-based access control is enforced server-side

## Authentication Utility

The authentication system is centralized in `lib/auth/server.ts` with the following functions:

### Main Functions

#### `authenticateUser(request: NextRequest)`
Main authentication function that:
- Extracts user ID from `X-User-Id` header
- Validates user exists and is active
- Returns user object with role and permissions

**Returns**: `{ user: AuthenticatedUser | null, error: NextResponse | null }`

#### `requireAuth(request: NextRequest)`
Requires authentication - throws error if not authenticated.

**Returns**: `AuthenticatedUser` (throws if not authenticated)

#### `requireRole(request: NextRequest, role: string)`
Requires specific role - throws error if user doesn't have the role.

**Returns**: `AuthenticatedUser` (throws if not authenticated or wrong role)

#### `requireAnyRole(request: NextRequest, roles: string[])`
Requires one of multiple roles - throws error if user doesn't have any of the roles.

**Returns**: `AuthenticatedUser` (throws if not authenticated or wrong role)

#### `getUserFromRequest(request: NextRequest)`
Gets user from request without throwing errors (useful for optional auth).

**Returns**: `AuthenticatedUser | null`

### Helper Functions

- `hasPermission(user: AuthenticatedUser, permission: string)`: Check if user has specific permission
- `isAdmin(user: AuthenticatedUser)`: Check if user is admin
- `isBursar(user: AuthenticatedUser)`: Check if user is bursar
- `isTeacher(user: AuthenticatedUser)`: Check if user is teacher

## Usage in API Routes

### Basic Authentication

```typescript
import { requireAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)
    
    // User is authenticated, proceed with request
    // ...
  } catch (error) {
    // Error is already a NextResponse, return it
    return error
  }
}
```

### Role-Based Access Control

```typescript
import { requireRole } from '@/lib/auth/server'

export async function PUT(request: NextRequest) {
  try {
    // Require admin role
    const user = await requireRole(request, 'admin')
    
    // User is authenticated and is admin, proceed
    // ...
  } catch (error) {
    return error
  }
}
```

### Multiple Roles

```typescript
import { requireAnyRole } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Require either bursar or admin role
    const user = await requireAnyRole(request, ['bursar', 'admin'])
    
    // User is authenticated and has one of the required roles
    // ...
  } catch (error) {
    return error
  }
}
```

### Optional Authentication

```typescript
import { getUserFromRequest } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  // Get user if authenticated, but don't require it
  const user = await getUserFromRequest(request)
  
  if (user) {
    // User is authenticated, show personalized content
  } else {
    // User is not authenticated, show public content
  }
}
```

## Client-Side Integration

### Automatic Header Injection

The `lib/api-utils.ts` utility automatically adds the `X-User-Id` header to all requests:

```typescript
import { apiPost, apiGet, apiPut, apiDelete } from '@/lib/api-utils'

// These functions automatically include X-User-Id header
const result = await apiPost('/api/some-endpoint', data)
const result = await apiGet('/api/some-endpoint')
```

### Manual Header Injection

For direct `fetch` calls, manually add the header:

```typescript
const storedUser = localStorage.getItem('school_user')
const user = storedUser ? JSON.parse(storedUser) : null

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}

if (user?.id) {
  headers['X-User-Id'] = user.id
}

const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
})
```

## Error Responses

The authentication utility returns standardized error responses:

### 401 Unauthorized
- `MISSING_USER_ID`: User ID not provided in request headers
- `INVALID_USER_ID`: Invalid user ID format
- `USER_NOT_FOUND`: User not found in database
- `USER_INACTIVE`: User account is inactive, suspended, etc.

### 403 Forbidden
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required role

### 500 Internal Server Error
- `AUTH_ERROR`: Unexpected error during authentication

## Security Considerations

1. **Server-Side Validation**: All authentication and authorization happens server-side
2. **Database Validation**: User ID is validated against database on every request
3. **Active Status Check**: Only active users can authenticate
4. **Role Verification**: Roles are verified server-side, not trusted from client
5. **No Sensitive Data**: Only user ID is sent in headers, no passwords or tokens

## Migration Guide

### Updating Existing API Routes

**Before:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (!userProfile || userProfile.role !== 'admin') {
  return NextResponse.json({ error: 'Admin required' }, { status: 403 })
}
```

**After:**
```typescript
import { requireRole } from '@/lib/auth/server'

const user = await requireRole(request, 'admin')
```

### Benefits

1. **Simpler Code**: Reduced from ~10 lines to 1 line
2. **Consistent Errors**: Standardized error responses across all routes
3. **Type Safety**: TypeScript types for authenticated user
4. **Better Security**: Centralized validation logic
5. **Easier Testing**: Mockable authentication functions

## Testing

### Testing Authenticated Routes

```typescript
// In your test
const request = new NextRequest('http://localhost/api/endpoint', {
  headers: {
    'X-User-Id': 'test-user-id',
  },
})

const response = await handler(request)
```

### Testing Unauthenticated Requests

```typescript
// Request without X-User-Id header
const request = new NextRequest('http://localhost/api/endpoint')
const response = await handler(request)
// Should return 401
```

## Troubleshooting

### "Authentication required" Error

1. **Check localStorage**: Ensure user is logged in and `school_user` exists
2. **Check Header**: Verify `X-User-Id` header is being sent (check Network tab)
3. **Check User Status**: Ensure user account is active in database

### "Admin role required" Error

1. **Check User Role**: Verify user has 'admin' role in database
2. **Check Route**: Ensure route is using `requireRole(request, 'admin')`

### User Not Found Error

1. **Check User ID**: Verify user ID in localStorage matches database
2. **Check Database**: Ensure user exists in `users` table
3. **Check Status**: Ensure user status is 'active'

## Best Practices

1. **Always use the utility functions**: Don't manually check headers
2. **Use appropriate function**: Use `requireRole` for mandatory auth, `getUserFromRequest` for optional
3. **Handle errors**: Always catch and return authentication errors
4. **Test thoroughly**: Test both authenticated and unauthenticated scenarios
5. **Document role requirements**: Comment which roles are required for each route

