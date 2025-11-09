/**
 * Migration script to normalize student class assignments
 * 
 * This script updates all students that have class stored as class name (string)
 * to use class ID (UUID) instead, ensuring consistency across the database.
 * 
 * Usage:
 *   npx tsx scripts/migrate-student-classes.ts
 * 
 * Or with environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-student-classes.ts
 */

import { createClient } from '@supabase/supabase-js'

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(str: string | null | undefined): boolean {
  if (!str) return false
  return UUID_REGEX.test(str)
}

async function migrateStudentClasses() {
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔄 Starting migration: Normalizing student class assignments...\n')

  try {
    // Fetch all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, student_id, first_name, last_name, class')
      .not('class', 'is', null)

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`)
    }

    if (!students || students.length === 0) {
      console.log('✅ No students found with class assignments. Migration complete.')
      return
    }

    console.log(`📊 Found ${students.length} students with class assignments\n`)

    // Fetch all active classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, class_name, status')
      .eq('status', 'active')

    if (classesError) {
      throw new Error(`Failed to fetch classes: ${classesError.message}`)
    }

    if (!classes || classes.length === 0) {
      console.log('⚠️  No active classes found. Cannot perform migration.')
      return
    }

    // Create a map of class names to class IDs for quick lookup
    const classNameToIdMap = new Map<string, string>()
    classes.forEach(cls => {
      if (cls.class_name) {
        classNameToIdMap.set(cls.class_name, cls.id)
      }
    })

    console.log(`📚 Found ${classes.length} active classes\n`)

    // Process students
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const errors: Array<{ studentId: string; studentName: string; className: string; error: string }> = []

    for (const student of students) {
      const studentClass = student.class as string

      // Skip if already a UUID
      if (isUUID(studentClass)) {
        skippedCount++
        continue
      }

      // Look up class ID by name
      const classId = classNameToIdMap.get(studentClass)

      if (!classId) {
        errorCount++
        errors.push({
          studentId: student.student_id || student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          className: studentClass,
          error: 'Class not found in active classes'
        })
        continue
      }

      // Update student's class to use class ID
      const { error: updateError } = await supabase
        .from('students')
        .update({ class: classId })
        .eq('id', student.id)

      if (updateError) {
        errorCount++
        errors.push({
          studentId: student.student_id || student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          className: studentClass,
          error: updateError.message
        })
      } else {
        updatedCount++
        console.log(`✅ Updated ${student.first_name} ${student.last_name} (${student.student_id || student.id}): "${studentClass}" → ${classId}`)
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))
    console.log(`Total students processed: ${students.length}`)
    console.log(`✅ Updated (name → ID): ${updatedCount}`)
    console.log(`⏭️  Skipped (already UUID): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach(err => {
        console.log(`   - ${err.studentName} (${err.studentId}): Class "${err.className}" - ${err.error}`)
      })
    }

    if (updatedCount > 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log(`   ${updatedCount} student(s) updated to use class IDs.`)
    } else if (errorCount === 0) {
      console.log('\n✅ All students already use class IDs. No migration needed.')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateStudentClasses()
  .then(() => {
    console.log('\n✨ Migration script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

