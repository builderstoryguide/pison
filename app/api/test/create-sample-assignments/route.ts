import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    console.log('🔧 Creating sample teacher assignments...')

    // Get active teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name')
      .eq('status', 'active')
      .limit(3)

    if (teachersError) {
      console.error('❌ Error fetching teachers:', teachersError)
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
    }

    if (!teachers || teachers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active teachers found' 
      }, { status: 404 })
    }

    // Get active classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, class_name, subsystem')
      .eq('status', 'active')
      .limit(5)

    if (classesError) {
      console.error('❌ Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active classes found' 
      }, { status: 404 })
    }

    // Get subject branches
    const { data: branches, error: branchesError } = await supabase
      .from('subject_branches')
      .select(`
        id, 
        branch_name, 
        subject_id,
        subjects:subject_id(
          id,
          subject_name,
          subject_code,
          subsystem
        )
      `)
      .eq('is_active', true)
      .limit(10)

    if (branchesError) {
      console.error('❌ Error fetching subject branches:', branchesError)
      return NextResponse.json({ error: 'Failed to fetch subject branches' }, { status: 500 })
    }

    if (!branches || branches.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active subject branches found' 
      }, { status: 404 })
    }

    let createdAssignments = 0
    const assignments = []

    // Create assignments for each teacher
    for (const teacher of teachers) {
      console.log(`👨‍🏫 Creating assignments for teacher: ${teacher.first_name} ${teacher.last_name}`)
      
      // Assign 1-2 classes per teacher
      const teacherClasses = classes.slice(0, Math.min(2, classes.length))
      
      for (const classData of teacherClasses) {
        // Find a subject branch that matches the class subsystem
        const matchingBranches = branches.filter((branch: any) => 
          branch.subjects?.subsystem === classData.subsystem
        )
        
        if (matchingBranches.length > 0) {
          const branch = matchingBranches[0]
          
          // Check if assignment already exists
          const { data: existingAssignment } = await supabase
            .from('teacher_branch_assignments')
            .select('id')
            .eq('teacher_id', teacher.id)
            .eq('branch_id', branch.id)
            .eq('class_id', classData.id)
            .eq('academic_year', '2024-2025')
            .eq('term', 'Term 1')
            .single()

          if (!existingAssignment) {
            // Create the assignment
            const { data: newAssignment, error: assignmentError } = await supabase
              .from('teacher_branch_assignments')
              .insert({
                teacher_id: teacher.id,
                branch_id: branch.id,
                class_id: classData.id,
                academic_year: '2024-2025',
                term: 'Term 1',
                is_primary_teacher: true,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (assignmentError) {
              console.error('❌ Error creating assignment:', assignmentError)
            } else {
              createdAssignments++
              assignments.push({
                teacher: `${teacher.first_name} ${teacher.last_name}`,
                subject: (branch as any).subjects?.subject_name,
                branch: (branch as any).branch_name,
                class: classData.class_name,
                assignmentId: newAssignment.id
              })
              console.log(`  ✅ Created: ${(branch as any).subjects?.subject_name} - ${classData.class_name}`)
            }
          } else {
            console.log(`  ⚠️ Assignment already exists: ${(branch as any).subjects?.subject_name} - ${classData.class_name}`)
          }
        }
      }
    }

    console.log(`🎉 Created ${createdAssignments} new teacher assignments`)

    return NextResponse.json({
      success: true,
      message: `Created ${createdAssignments} new teacher assignments`,
      assignments,
      summary: {
        teachers: teachers.length,
        classes: classes.length,
        branches: branches.length,
        createdAssignments
      }
    })

  } catch (error) {
    console.error('❌ Error creating sample assignments:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
