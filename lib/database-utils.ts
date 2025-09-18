// Database utility functions
// This file provides common database operations and connection testing

import { testConnection as supabaseTestConnection } from './supabase'

/**
 * Test database connection
 * @returns Promise<boolean> - true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  return await supabaseTestConnection()
}

/**
 * Check if database is available
 * @returns boolean - true if database is available
 */
export function isDatabaseAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Get database connection status
 * @returns object with connection status information
 */
export function getDatabaseStatus() {
  return {
    isAvailable: isDatabaseAvailable(),
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  }
}


