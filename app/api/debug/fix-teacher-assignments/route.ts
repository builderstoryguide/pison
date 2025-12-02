import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    // Use service role client to bypass RLS policies
    const supabase = createServiceClient()
    const results = []

    // 1. Fetch all teachers with their subjects array
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, teacher_id, user_id, subjects')
    
    if (teachersError) throw teachersError

    for (const teacher of teachers) {
      const teacherResult = {
        teacherId: teacher.id,
        classesFound: 0,
        subjectsFound: 0,
        subjectsMigrated: 0,
        inserted: 0,
        errors: [] as string[],
        debug: {} as any // Added debug info
      }

      // 2. Get assigned classes
      const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_row_id', teacher.id)
      
      const classIds = classTeachers?.map(ct => ct.class_id) || []
      teacherResult.classesFound = classIds.length

      // 3. Get assigned subjects from relational table
      const { data: teacherSubjects } = await supabase
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', teacher.id)
        .eq('is_active', true)
      
      let subjectIds = teacherSubjects?.map(ts => ts.subject_id) || []
      teacherResult.subjectsFound = subjectIds.length

      // 3b. MIGRATION: If no relational subjects but array has subjects, migrate them
      if (subjectIds.length === 0 && teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
        const subjectNames = teacher.subjects
        
        // Find subject IDs for these names
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name')
          .in('name', subjectNames)
        
        teacherResult.debug = { subjectNames, subjectsData } // Capture debug data
        
        if (subjectsData && subjectsData.length > 0) {
          const newSubjectIds = subjectsData.map(s => s.id)
          
          // Insert into teacher_subjects one by one to handle duplicates
          let migratedCount = 0
          for (const subject of subjectsData) {
            const { error } = await supabase
              .from('teacher_subjects')
              .insert({
                teacher_id: teacher.id,
                subject_id: subject.id,
                subject_name: subject.name, // Added subject_name
                is_active: true,
                assignment_type: 'main_subject'
              })
            
            // Ignore duplicate errors (code 23505)
            if (!error || error.code === '23505') {
              migratedCount++
            } else if (error.code === '23503') { // Foreign key violation
               // Try with user_id if available
               if (teacher.user_id) {
                  const { error: retryError } = await supabase
                  .from('teacher_subjects')
                  .insert({
                    teacher_id: teacher.user_id, // Try user_id
                    subject_id: subject.id,
                    subject_name: subject.name,
                    is_active: true,
                    assignment_type: 'main_subject'
                  })
                  
                  if (!retryError || retryError.code === '23505') {
                    migratedCount++
                    teacherResult.debug.usedUserId = true
                  } else {
                    teacherResult.errors.push(`Migration retry failed for subject ${subject.id}: ${retryError.message}`)
                  }
               } else {
                  teacherResult.errors.push(`Migration failed (FK) for subject ${subject.id}: ${error.message}`)
               }
            } else {
              teacherResult.errors.push(`Migration error for subject ${subject.id}: ${error.message}`)
            }
          }
          
          teacherResult.subjectsMigrated = migratedCount
          subjectIds = newSubjectIds // Update for next step
        }
      }

      // 4. Insert into class_subjects for every combination
      if (classIds.length > 0 && subjectIds.length > 0) {
        let insertedCount = 0
        for (const classId of classIds) {
          for (const subjectId of subjectIds) {
            const { error } = await supabase
              .from('class_subjects')
              .insert({
                class_id: classId,
                subject_id: subjectId
              })
            
            // Ignore duplicate errors (code 23505)
            if (!error || error.code === '23505') {
              insertedCount++
            } else {
              teacherResult.errors.push(`Insert error for class ${classId}, subject ${subjectId}: ${error.message}`)
            }
          }
        }
        teacherResult.inserted = insertedCount
      }
      results.push(teacherResult)
    }

    return NextResponse.json({
      ok: true,
      message: 'Assignment fix completed (v3 - simplified)',
      results
    })

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}
