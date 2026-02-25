/**
 * Batch API
 * POST /api/batch - Execute multiple API requests in a single call
 *
 * Body: { requests: Array<{ endpoint: string, method?: string, body?: object }> }
 * - endpoint: path starting with /api/ (e.g. /api/clients?limit=10)
 * - method: GET (default), POST, PUT, PATCH, DELETE
 * - body: optional JSON body for non-GET requests
 *
 * Returns: { responses: Array<{ status: number, data?: unknown, error?: object }> }
 * Max 10 requests per batch.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

const MAX_REQUESTS = 10;

function isValidEndpoint(endpoint: string): boolean {
  if (typeof endpoint !== 'string' || endpoint.length === 0) return false;
  if (endpoint.includes('://') || endpoint.startsWith('//')) return false;
  if (endpoint === '/api/batch' || endpoint.startsWith('/api/batch')) return false;
  return endpoint.startsWith('/api/');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requests } = body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'requests must be a non-empty array' },
        },
        { status: 400 }
      );
    }

    if (requests.length > MAX_REQUESTS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Maximum ${MAX_REQUESTS} requests per batch`,
          },
        },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl.origin;

    const cookieHeader = request.headers.get('cookie') || '';

    const results = await Promise.all(
      requests.map(async (req: { endpoint: string; method?: string; body?: object }) => {
        const endpoint = req.endpoint;
        const method = (req.method || 'GET').toUpperCase();
        const reqBody = req.body;

        if (!isValidEndpoint(endpoint)) {
          return {
            status: 400,
            error: { code: 'INVALID_ENDPOINT', message: 'Only /api/* paths are allowed' },
          };
        }

        const url = `${baseUrl}${endpoint}`;
        const init: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
        };

        if (reqBody != null && method !== 'GET') {
          init.body = JSON.stringify(reqBody);
        }

        const BATCH_FETCH_TIMEOUT_MS = 10_000;
        const controller = new AbortController();
        init.signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), BATCH_FETCH_TIMEOUT_MS);

        try {
          const res = await fetch(url, init);
          clearTimeout(timeoutId);
          const text = await res.text();
          let data: unknown;
          let parseError: object | undefined;
          try {
            data = text ? JSON.parse(text) : undefined;
          } catch {
            data = undefined;
            parseError = { code: 'PARSE_ERROR', message: 'Invalid JSON response' };
          }

          if (parseError) {
            return { status: res.status, error: parseError };
          }

          if (!res.ok) {
            return {
              status: res.status,
              error: (data as { error?: object })?.error ?? { code: 'REQUEST_FAILED', message: res.statusText },
            };
          }

          return { status: res.status, data };
        } catch (err) {
          clearTimeout(timeoutId);
          const isAbort = err instanceof Error && err.name === 'AbortError';
          return {
            status: isAbort ? 408 : 500,
            error: {
              code: isAbort ? 'TIMEOUT' : 'FETCH_ERROR',
              message: isAbort
                ? 'Request timed out'
                : err instanceof Error
                  ? err.message
                  : 'Request failed',
            },
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      responses: results,
    });
  } catch (error: unknown) {
    console.error('Batch API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Batch request failed',
        },
      },
      { status: 500 }
    );
  }
}
