import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission to delete fee structures
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'bursar'].includes(profile.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
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

  // Limit batch size
  const MAX_BATCH_SIZE = 100
  if (ids.length > MAX_BATCH_SIZE) {
    return NextResponse.json({ success: false, error: `Cannot delete more than ${MAX_BATCH_SIZE} items at once` }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const invalidIds = ids.filter(id => typeof id !== 'string' || !uuidRegex.test(id))
  if (invalidIds.length > 0) {
    return NextResponse.json({ success: false, error: 'Invalid UUID format in ids array' }, { status: 400 })
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
