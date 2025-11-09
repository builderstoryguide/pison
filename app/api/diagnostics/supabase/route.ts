import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET() {
	try {
		const supabase = await createClient()
		const role = 'anonymous'
		const { error } = await supabase.from('v_classes').select('id', { head: true, count: 'exact' })
		if (error) {
			return NextResponse.json({ ok: false, role, canSelect: false, error: serializeSupabaseError(error) }, { status: 200 })
		}
		return NextResponse.json({ ok: true, role, canSelect: true })
	} catch (err) {
		return NextResponse.json({ ok: false, error: serializeSupabaseError(err as any) }, { status: 500 })
	}
}











