import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let ids: string[] = []
  try {
    const body = await request.json()
    ids = body.ids
  } catch (_e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid input: ids array required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('fee_structures')
    .delete()
    .in('id', ids)
    .select()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting fee structures:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deletedCount: data?.length || 0, data })
}
