// Test Teacher Deletion Functionality
// This script helps debug teacher deletion issues

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTeacherDeletion() {
  console.log('🧪 Testing Teacher Deletion Functionality...\n')

  try {
    // 1. Check current teachers
    console.log('1. Checking current teachers...')
    const { data: teachers, error: fetchError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name, email')
      .limit(5)

    if (fetchError) {
      console.error('❌ Error fetching teachers:', fetchError)
      return
    }

    console.log(`✅ Found ${teachers.length} teachers`)
    teachers.forEach(teacher => {
      console.log(`   - ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id})`)
    })

    if (teachers.length === 0) {
      console.log('⚠️ No teachers found to test deletion')
      return
    }

    // 2. Test deletion of the first teacher
    const teacherToDelete = teachers[0]
    console.log(`\n2. Testing deletion of teacher: ${teacherToDelete.first_name} ${teacherToDelete.last_name}`)
    
    const { error: deleteError, count } = await supabase
      .from('teachers')
      .delete()
      .eq('id', teacherToDelete.id)

    if (deleteError) {
      console.error('❌ Error deleting teacher:', deleteError)
      return
    }

    console.log(`✅ Teacher deleted successfully! Rows affected: ${count}`)

    // 3. Verify deletion by checking teachers again
    console.log('\n3. Verifying deletion...')
    const { data: remainingTeachers, error: verifyError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name, email')
      .limit(5)

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }

    console.log(`✅ Remaining teachers: ${remainingTeachers.length}`)
    const deletedTeacherStillExists = remainingTeachers.some(t => t.id === teacherToDelete.id)
    
    if (deletedTeacherStillExists) {
      console.log('❌ Teacher still exists after deletion!')
    } else {
      console.log('✅ Teacher successfully removed from database')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testTeacherDeletion()
