/**
 * Network debugging utilities for handling API calls with better error reporting
 */

interface ApiCallOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  credentials?: RequestCredentials;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Headers;
  url?: string;
  responseText?: string;
}

/**
 * Gets user ID from localStorage for authentication
 */
function getUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem('school_user');
    if (storedUser && storedUser.trim()) {
      const user = JSON.parse(storedUser);
      if (user && typeof user === 'object' && user.id) {
        return user.id;
      }
    }
  } catch (error) {
    console.warn('Failed to read user from localStorage:', error);
  }
  
  return null;
}

/**
 * Enhanced fetch wrapper that provides better error handling and debugging information
 * Automatically adds X-User-Id header when user is logged in
 */
export async function safeFetch<T = any>(options: ApiCallOptions): Promise<ApiResponse<T>> {
  const { url, method = 'GET', headers = {}, body, credentials } = options;
  // Increase timeout for login endpoint to 60 seconds
  const timeout = options.timeout || (url.includes('/api/auth/login') ? 60000 : 30000);
  
  // Get user ID from localStorage and add to headers
  const userId = getUserIdFromStorage();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add X-User-Id header if user is logged in
  if (userId) {
    requestHeaders['X-User-Id'] = userId;
  }
  
  console.log(`🌐 API Call: ${method} ${url}`, body ? { body } : '');
  
  try {
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...(credentials !== undefined ? { credentials } : {}),
    });
    
    clearTimeout(timeoutId);
    
    // Get response text first
    const responseText = await response.text();
    console.log(`📡 Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseLength: responseText.length,
      responsePreview: responseText.slice(0, 200),
    });
    
    // Check if response is empty
    if (!responseText.trim()) {
      return {
        success: false,
        error: `Empty response from ${url}`,
        status: response.status,
        headers: response.headers,
        url,
        responseText,
      };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`⚠️ Non-JSON response from ${url}:`, {
        contentType,
        responsePreview: responseText.slice(0, 300),
      });
      
      return {
        success: false,
        error: `Expected JSON response but got ${contentType}. Response: ${responseText.slice(0, 200)}...`,
        status: response.status,
        headers: response.headers,
        url,
        responseText,
      };
    }
    
    // Try to parse JSON
    let data: T;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ JSON Parse Error for ${url}:`, {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        responseText: responseText.slice(0, 500),
        contentType,
        status: response.status,
      });
      
      return {
        success: false,
        error: `JSON Parse Error: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response: ${responseText.slice(0, 200)}...`,
        status: response.status,
        headers: response.headers,
        url,
        responseText,
      };
    }
    
    // Check if it's a successful response
    if (!response.ok) {
      console.warn(`⚠️ HTTP Error from ${url}:`, {
        status: response.status,
        data,
      });
      
      return {
        success: false,
        error: (data as any)?.error || (data as any)?.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        headers: response.headers,
        url,
        responseText,
        data,
      };
    }
    
    console.log(`✅ Successful response from ${url}:`, data);
    
    return {
      success: true,
      data,
      status: response.status,
      headers: response.headers,
      url,
    };
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`⏰ Request timeout for ${url}`);
      return {
        success: false,
        error: `Request timeout (${timeout}ms)`,
        url,
      };
    }
    
    console.error(`💥 Network error for ${url}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      url,
    };
  }
}

/**
 * Helper function for GET requests
 */
export async function apiGet<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return safeFetch<T>({ url, method: 'GET', headers });
}

/**
 * Helper function for POST requests
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  headers?: Record<string, string>,
  credentials?: RequestCredentials
): Promise<ApiResponse<T>> {
  return safeFetch<T>({ url, method: 'POST', body, headers, credentials });
}

/**
 * Helper function for PUT requests
 */
export async function apiPut<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return safeFetch<T>({ url, method: 'PUT', body, headers });
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return safeFetch<T>({ url, method: 'DELETE', headers });
}

/**
 * Legacy fetch wrapper for backward compatibility
 * @deprecated Use safeFetch instead
 */
export async function legacyFetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    console.log(`🔄 Legacy fetch: ${options?.method || 'GET'} ${url}`);
    
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`📋 Legacy response from ${url}:`, {
      status: response.status,
      responseLength: responseText.length,
      contentType: response.headers.get('content-type'),
    });
    
    // Try to parse as JSON if not empty
    if (responseText.trim()) {
      try {
        const data = JSON.parse(responseText);
        return { response, data };
      } catch (parseError) {
        console.error(`❌ Legacy JSON parse error for ${url}:`, {
          error: parseError,
          responseText: responseText.slice(0, 200),
        });
        throw new Error(`JSON Parse Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } else {
      console.warn(`⚠️ Empty response from ${url}`);
      return { response, data: null };
    }
  } catch (error) {
    console.error(`💥 Legacy fetch error for ${url}:`, error);
    throw error;
  }
}
