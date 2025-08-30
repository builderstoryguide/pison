// Test Fee Structure Creation Functionality
// This script helps debug fee structure creation issues

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFeeStructureCreation() {
  console.log('🧪 Testing Fee Structure Creation Functionality...\n')

  try {
    // 1. Check if fee_structures table exists
    console.log('1. Checking fee_structures table...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('fee_structures')
      .select('count', { count: 'exact', head: true })

    if (tableError) {
      console.error('❌ Error accessing fee_structures table:', tableError)
      console.log('💡 The table might not exist or you might not have permissions')
      return
    }

    console.log('✅ Fee structures table is accessible')

    // 2. Check current fee structures
    console.log('\n2. Checking current fee structures...')
    const { data: feeStructures, error: fetchError } = await supabase
      .from('fee_structures')
      .select('id, name, subsystem, level, amount')
      .limit(5)

    if (fetchError) {
      console.error('❌ Error fetching fee structures:', fetchError)
      return
    }

    console.log(`✅ Found ${feeStructures.length} existing fee structures`)

    // 3. Test creation of a new fee structure
    console.log('\n3. Testing fee structure creation...')
    const testFeeStructure = {
      name: 'Test Fee Structure',
      subsystem: 'english',
      level: 'form-1',
      branch: 'grammar',
      amount: 50000,
      due_date: '2024-12-31',
      term: 'first',
      academic_year: '2024-2025',
      description: 'Test fee structure for debugging',
      is_active: true
    }

    console.log('📝 Test fee structure data:', testFeeStructure)

    const { data: newFeeStructure, error: createError } = await supabase
      .from('fee_structures')
      .insert([testFeeStructure])
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating fee structure:', createError)
      return
    }

    console.log('✅ Fee structure created successfully!')
    console.log('📊 Created fee structure:', newFeeStructure)

    // 4. Verify creation by checking fee structures again
    console.log('\n4. Verifying creation...')
    const { data: updatedFeeStructures, error: verifyError } = await supabase
      .from('fee_structures')
      .select('id, name, subsystem, level, amount')
      .limit(5)

    if (verifyError) {
      console.error('❌ Error verifying creation:', verifyError)
      return
    }

    console.log(`✅ Updated fee structures count: ${updatedFeeStructures.length}`)
    const newFeeStructureExists = updatedFeeStructures.some(fs => fs.id === newFeeStructure.id)
    
    if (newFeeStructureExists) {
      console.log('✅ New fee structure successfully added to database')
    } else {
      console.log('❌ New fee structure not found in database')
    }

    // 5. Clean up - delete the test fee structure
    console.log('\n5. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', newFeeStructure.id)

    if (deleteError) {
      console.error('⚠️ Error deleting test fee structure:', deleteError)
    } else {
      console.log('✅ Test fee structure deleted successfully')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testFeeStructureCreation()
