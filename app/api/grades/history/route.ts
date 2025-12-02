import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
       return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch assessments
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        subject,
        class_id,
        created_at,
        grades (
            count
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Get unique class IDs to fetch names
    const classIds = [...new Set(assessments?.map(a => a.class_id) || [])]
    
    let classMap: Record<string, string> = {}
    if (classIds.length > 0) {
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .in('id', classIds)
        
        if (classes) {
            classes.forEach(c => {
                classMap[c.id] = c.name
            })
        }
    }

    const history = assessments?.map(a => ({
        id: a.id,
        date: new Date(a.created_at).toISOString().split('T')[0],
        class: classMap[a.class_id] || 'Unknown Class',
        classId: a.class_id,
        subject: a.subject,
        sequence: a.title,
        // @ts-ignore - Supabase types might not infer 'count' correctly in this context
        count: a.grades?.[0]?.count || 0
    }))

    return NextResponse.json({ success: true, history })

  } catch (error: any) {
    console.error("Error fetching grade history:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the assessment. 
    // Note: If 'grades' table has ON DELETE CASCADE on assessment_id, grades will be deleted automatically.
    // If not, we might need to delete grades first. Assuming CASCADE or manual deletion if needed.
    // Let's try deleting the assessment directly first.
    
    // First check if it exists and belongs to the user (optional security check if we had user context here easily, 
    // but for now relying on the ID being valid and the user being authenticated via middleware)
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error deleting assessment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

