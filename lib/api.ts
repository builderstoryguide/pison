import { NextRequest, NextResponse } from 'next/server';

/**
 * apiFetch - universal fetch for dev/prod that prefixes API calls with the correct base URL
 *
 * Usage:
 *   apiFetch('/users', { method: 'GET' })
 *   apiFetch('/api/clients', { signal }) // Pass AbortSignal for request cancellation (e.g. from React Query)
 *   apiFetch('https://external.com/endpoint') // untouched
 *
 * For React Query: pass context.signal from queryFn so in-flight requests are cancelled when the query key changes.
 */
export async function apiFetch(
  input: string | Request,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<Response> {
  let url = input;

  // If input is a string and is a relative API path, prefix with base URL only when set
  if (typeof input === 'string') {
    if (input.startsWith('/api/') && process.env.NEXT_PUBLIC_BASE_PATH) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
      url = base + (input.startsWith('/') ? input : '/' + input);
    }
  }
  // If input is a Request object, you could extend logic here if needed

  // Always send credentials for same- or cross-origin API calls so session cookies are sent
  const fetchInit: RequestInit = {
    ...init,
    credentials: init?.credentials ?? 'include',
  };
  return fetch(url as RequestInfo, fetchInit);
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Return a NextResponse.json() with Cache-Control headers for read endpoints.
 * `maxAge` is the s-maxage in seconds; stale-while-revalidate is set to 2x maxAge.
 */
export function cachedJson(
  body: unknown,
  maxAge: number = 30,
  status: number = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': `private, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    },
  });
}
