import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

/** Default ceiling for a single Supabase HTTP round-trip (client has no built-in timeout). */
export const SUPABASE_REQUEST_TIMEOUT_MS = 30_000

const DEFAULT_TIMEOUT_MESSAGE =
  "The database request timed out. Check your network connection and try again."

/**
 * Rejects if `promise` does not settle within `ms`. The underlying fetch may still run in the background.
 * Accepts `PromiseLike` so Supabase query builders work without an extra wrapper.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  timeoutMessage: string = DEFAULT_TIMEOUT_MESSAGE,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(timeoutMessage)), ms)
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(id)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(id)
        reject(err)
      })
  })
}

export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

export const testConnection = async (): Promise<boolean> => {
  if (!supabase) {
    // Use console.warn instead of console.error to avoid triggering Next.js error boundaries
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase client not initialized - missing environment variables')
    }
    return false
  }

  try {
    // Test with a simple query to check if the connection works
    const { error } = await withTimeout(
      supabase.from("users").select("count", { count: "exact", head: true }),
      SUPABASE_REQUEST_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MESSAGE,
    )
    
    if (error) {
      // Use console.warn instead of console.error to avoid triggering Next.js error boundaries
      if (process.env.NODE_ENV === 'development') {
        console.warn('Database connection test failed:', error.message || 'Unknown error')
      }
      return false
    }
    
    return true
  } catch (error) {
    // Use console.warn instead of console.error to avoid triggering Next.js error boundaries
    // Extract error message safely
    const errorMessage = error instanceof Error 
      ? error.message 
      : error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Network error: Unable to reach Supabase. Check your internet connection and Supabase URL.'
        : String(error)
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database connection test failed with exception:', errorMessage)
    }
    return false
  }
}

export const getConnectionError = (): string | null => {
  if (!supabaseUrl) return 'NEXT_PUBLIC_SUPABASE_URL is not set'
  if (!supabaseAnonKey) return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
  if (!supabase) return 'Failed to create Supabase client'
  return null
}

// Database types
export interface Teacher {
  id: string
  teacher_id: string
  title?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  id_number?: string
  address?: string
  city?: string
  region?: string
  subsystem: "english" | "french"
  subjects: string[]
  classes: string[]
  qualifications: string[]
  experience?: string
  employment_type: "full-time" | "part-time" | "contract"
  salary?: number
  start_date?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  status: "active" | "inactive" | "suspended"
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  address?: string
  city?: string
  region?: string
  postal_code?: string
  subsystem: "english" | "french"
  class_level: string
  stream?: string
  status: "active" | "inactive" | "graduated" | "transferred"
  created_at: string
  updated_at: string
}
