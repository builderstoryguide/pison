import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

export const testConnection = async (): Promise<boolean> => {
  if (!supabase) return false

  try {
    const { error } = await supabase.from("users").select("count", { count: "exact", head: true })
    return !error
  } catch {
    return false
  }
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
