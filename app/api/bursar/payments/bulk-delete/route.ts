import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { ids } = await request.json()

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('payments')
    .delete()
    .in('id', ids)
    .select()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deletedCount: data?.length || 0, data })
}
