/**
 * Comprehensive API client utility with retry logic, caching, and error handling
 * Prevents timeout issues and ensures reliable API calls
 */

interface ApiCallOptions {
  url: string
  options?: RequestInit
  timeout?: number
  retries?: number
  retryDelay?: number
  cache?: boolean
  cacheKey?: string
  cacheTTL?: number // Time to live in milliseconds
}

interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  cached?: boolean
}

// In-memory cache (can be replaced with localStorage if needed)
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now()
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      apiCache.delete(key)
    }
  }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId)
  })
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return baseDelay * Math.pow(2, attempt)
}

/**
 * Comprehensive API call function with retry, timeout, and caching
 */
export async function apiCall<T = any>(options: ApiCallOptions): Promise<ApiResponse<T>> {
  const {
    url,
    options: fetchOptions = {},
    timeout = 15000,
    retries = 3,
    retryDelay = 1000,
    cache = false,
    cacheKey,
    cacheTTL = 5 * 60 * 1000 // 5 minutes default
  } = options

  // Clear expired cache entries
  clearExpiredCache()

  // Check cache first
  const cacheKeyToUse = cacheKey || url
  if (cache) {
    const cached = apiCache.get(cacheKeyToUse)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[API Cache Hit] ${url}`)
      return {
        data: cached.data as T,
        error: null,
        cached: true
      }
    }
  }

  // Try fetching with retries
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1, retryDelay)
        console.log(`[API Retry] Attempt ${attempt}/${retries} for ${url} after ${delay}ms delay`)
        await sleep(delay)
      }

      const response = await fetchWithTimeout(url, fetchOptions, timeout)
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If not JSON, try text
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText.substring(0, 200)
            }
          } catch {
            // Ignore parsing errors
          }
        }

        // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          return {
            data: null,
            error: errorMessage
          }
        }

        // Retry on server errors (5xx), timeout (408), and rate limit (429)
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Cache successful response
      if (cache) {
        apiCache.set(cacheKeyToUse, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL
        })
      }

      return {
        data: data as T,
        error: null,
        cached: false
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on AbortError (timeout) if it's the last attempt
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt === retries) {
          return {
            data: null,
            error: `Request timed out after ${timeout}ms. The server may be slow or unavailable.`
          }
        }
        // Continue to retry
        continue
      }

      // Log error
      console.error(`[API Error] Attempt ${attempt + 1}/${retries + 1} failed for ${url}:`, lastError.message)

      // If this is the last attempt, return error
      if (attempt === retries) {
        return {
          data: null,
          error: lastError.message || 'Unknown error occurred'
        }
      }
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Failed to fetch data after all retry attempts'
  }
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearApiCache(key?: string) {
  if (key) {
    apiCache.delete(key)
  } else {
    apiCache.clear()
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys())
  }
}

