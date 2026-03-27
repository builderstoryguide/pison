import { createClient as supabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const missing = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !key ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean)
    throw new Error(`Missing required Supabase service env vars: ${missing.join(', ')}`)
  }

  return supabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}


