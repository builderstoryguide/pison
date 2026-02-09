/**
 * API Integration Hooks
 * Provides type-safe React Query hooks for data fetching and mutations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// ─── Standard API response types ────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  code: string;
  details?: ApiErrorDetail[];

  constructor(code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// ─── Core fetch helpers ─────────────────────────────────────────

/**
 * Type-safe GET request returning parsed data directly.
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiFetch(url);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const msg =
      body?.error?.message || body?.error || `Request failed (${response.status})`;
    const code = body?.error?.code || 'FETCH_ERROR';
    throw new ApiError(code, msg, body?.error?.details);
  }

  const body = await response.json();
  return body.data ?? body;
}

/**
 * Type-safe POST / PUT / DELETE that return parsed data.
 */
export async function apiMutate<T>(
  url: string,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {},
): Promise<T> {
  const { method = 'POST', body } = options;

  const response = await apiFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const msg =
      json?.error?.message || json?.error || `Request failed (${response.status})`;
    const code = json?.error?.code || 'MUTATION_ERROR';
    throw new ApiError(code, msg, json?.error?.details);
  }

  const json = await response.json();
  return json.data ?? json;
}

// ─── React Query hooks ──────────────────────────────────────────

/**
 * A thin wrapper around `useQuery` that calls `apiGet` and provides
 * consistent defaults for the application.
 *
 * @example
 *   const { data } = useApiQuery<Client[]>(['clients'], '/api/clients');
 */
export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string | null, // pass null to disable
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn: () => apiGet<T>(url as string),
    enabled: url !== null,
    staleTime: 1000 * 60 * 5, // 5 min default
    retry: 1,
    ...options,
  });
}

/**
 * A thin wrapper around `useMutation` that calls `apiMutate`.
 *
 * @example
 *   const mutation = useApiMutation<Client>('/api/clients', {
 *     invalidateKeys: [['clients']],
 *   });
 *   mutation.mutate({ fullName: 'Jean' });
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<TData, ApiError, TVariables>,
    'mutationFn'
  > & {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    invalidateKeys?: QueryKey[];
  },
) {
  const queryClient = useQueryClient();
  const method = options?.method ?? 'POST';
  const invalidateKeys = options?.invalidateKeys;

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) =>
      apiMutate<TData>(url, { method, body: variables }),
    onSuccess: (...args) => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

// ─── Currency formatting helper ─────────────────────────────────

const XOF = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as CFA Franc (XOF).
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 XOF';
  return XOF.format(num);
}

/**
 * Build a URL with optional search params (skips undefined / null / empty).
 */
export function buildUrl(
  base: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) return base;
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      sp.append(k, String(v));
    }
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
