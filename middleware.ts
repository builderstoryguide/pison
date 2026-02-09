/**
 * Next.js Middleware
 * Protects routes and enforces authentication at the edge.
 *
 * - Public routes: /signin, /signup, /reset-password, /change-password, /verify-email, /api/auth/*
 * - Protected routes: everything else under / (including /api/* except /api/auth/*)
 * - Unauthenticated users are redirected to /signin
 * - Authenticated users visiting auth pages are redirected to /
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  '/signin',
  '/reset-password',
  '/change-password',
  '/verify-email',
];

// API routes that do NOT require authentication
const PUBLIC_API_PATHS = [
  '/api/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if this is a public API path
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));
  if (isPublicApi) {
    return NextResponse.next();
  }

  // Check if this is a public page path
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Get JWT token (validates the session)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to sign-in for protected pages/API routes
  if (!isAuthenticated && !isPublicPage) {
    // For API routes, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    // For page routes, redirect to sign-in with callback URL
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
