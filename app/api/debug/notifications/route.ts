import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || err })
  }
}
