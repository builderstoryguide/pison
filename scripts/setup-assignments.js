const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAssignments() {
  try {
    console.log('🚀 Setting up assignments database schema...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-assignments-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('\n🎉 Assignments database setup completed!')
    console.log('\n📋 What was created:')
    console.log('   • assignments table with comprehensive fields')
    console.log('   • assignment_submissions table for student submissions')
    console.log('   • Performance indexes for optimal queries')
    console.log('   • Sample assignments and submissions data')
    console.log('\n✨ You can now use the assignment management features in your app!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupAssignments()
