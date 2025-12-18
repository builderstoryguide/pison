import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const supabase = await createClient()

    // Try to select from notifications table
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .limit(1)

    if (error) {
        return NextResponse.json({ success: false, error: error })
    }

    return NextResponse.json({ success: true, data: data, message: 'Table exists and is accessible' })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message })
  }
}
