import { createClient } from '@/lib/supabase/server'

/**
 * Get the academic year from app configuration (server-side)
 * Falls back to environment variable or default if not found
 */
export async function getAcademicYearFromConfig(): Promise<string> {
  try {
    const supabase = await createClient()
    
    const { data: configuration, error } = await supabase
      .from('app_configuration')
      .select('academic_year')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST301') { // PGRST301 = no rows found
      console.warn('Error fetching academic year from config:', error)
    }

    if (configuration?.academic_year) {
      return configuration.academic_year
    }
  } catch (error) {
    console.warn('Failed to fetch academic year from config:', error)
  }

  // Fallback to environment variable or default
  return process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'
}
