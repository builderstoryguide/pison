import { NextResponse } from 'next/server'

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: string
  hint?: string
  timestamp: string
  path?: string
  stack?: string
  fullError?: any
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  timestamp: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  options?: {
    message?: string
    path?: string
    includeDetails?: boolean
  }
): NextResponse<ApiErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const timestamp = new Date().toISOString()

  // Extract error information
  let errorMessage = options?.message || 'Internal server error'
  let errorCode: string | undefined
  let errorDetails: string | undefined
  let errorHint: string | undefined
  let errorStack: string | undefined
  let fullError: any = undefined

  if (error instanceof Error) {
    errorMessage = error.message || errorMessage
    errorStack = error.stack
    fullError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any)
    }
  } else if (typeof error === 'object' && error !== null) {
    const err = error as any
    errorCode = err.code
    errorMessage = err.message || errorMessage
    errorDetails = err.details
    errorHint = err.hint
    fullError = err
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  const response: ApiErrorResponse = {
    success: false,
    error: errorMessage,
    timestamp,
    ...(options?.path && { path: options.path }),
    ...(errorCode && { code: errorCode }),
    ...(options?.includeDetails !== false && errorDetails && { details: errorDetails }),
    ...(errorHint && { hint: errorHint }),
    ...(isDevelopment && {
      ...(errorStack && { stack: errorStack }),
      ...(fullError && { fullError })
    })
  }

  return NextResponse.json(response, { status })
}

/**
 * Creates a standardized success response for API routes
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Logs error with full context for debugging
 */
export function logApiError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const errorInfo: Record<string, any> = {
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  }

  if (error instanceof Error) {
    errorInfo.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
        try {
          acc[key] = (error as any)[key]
        } catch {
          // Skip properties that can't be accessed
        }
        return acc
      }, {} as Record<string, any>)
    }
  } else if (typeof error === 'object' && error !== null) {
    errorInfo.error = error
  } else {
    errorInfo.error = String(error)
  }

  console.error('API Error:', JSON.stringify(errorInfo, null, 2))
}

/**
 * Handles Supabase errors with detailed logging
 */
export function handleSupabaseError(
  error: any,
  context: string,
  queryDetails?: {
    table?: string
    operation?: string
    filters?: Record<string, any>
  }
): { message: string; code?: string; details?: string; hint?: string } {
  logApiError(context, error, queryDetails)

  return {
    message: error.message || 'Database operation failed',
    code: error.code,
    details: error.details,
    hint: error.hint
  }
}

