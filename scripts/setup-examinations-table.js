const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupExaminationsTable() {
  console.log('Setting up examinations table...')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-examinations-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error('Error executing statement:', error)
          console.error('Statement:', statement)
        } else {
          console.log('✓ Statement executed successfully')
        }
      }
    }

    console.log('✅ Examinations table setup completed!')
  } catch (error) {
    console.error('❌ Error setting up examinations table:', error)
    process.exit(1)
  }
}

// Alternative approach using direct SQL execution
async function setupExaminationsTableDirect() {
  console.log('Setting up examinations table using direct SQL...')

  try {
    // Create the examinations table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS examinations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'external', 'mock', 'continuous_assessment')),
        exam_board VARCHAR(255) NOT NULL,
        subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
        branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
        level VARCHAR(50) NOT NULL,
        subjects TEXT[] NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        duration INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        passing_marks INTEGER NOT NULL,
        venue VARCHAR(255) NOT NULL,
        instructions TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
        enrolled_students INTEGER DEFAULT 0,
        completed_students INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (tableError) {
      console.error('Error creating examinations table:', tableError)
      return
    }

    // Create the exam results table
    const createResultsTableSQL = `
      CREATE TABLE IF NOT EXISTS exam_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        marks_obtained DECIMAL(5,2) NOT NULL,
        total_marks INTEGER NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        grade VARCHAR(5),
        remarks TEXT,
        date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(examination_id, student_id, subject)
      );
    `

    const { error: resultsError } = await supabase.rpc('exec_sql', { sql: createResultsTableSQL })
    
    if (resultsError) {
      console.error('Error creating exam results table:', resultsError)
      return
    }

    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_examinations_subsystem ON examinations(subsystem);
      CREATE INDEX IF NOT EXISTS idx_examinations_branch ON examinations(branch);
      CREATE INDEX IF NOT EXISTS idx_examinations_type ON examinations(type);
      CREATE INDEX IF NOT EXISTS idx_examinations_status ON examinations(status);
      CREATE INDEX IF NOT EXISTS idx_examinations_start_date ON examinations(start_date);
      CREATE INDEX IF NOT EXISTS idx_examinations_end_date ON examinations(end_date);
      CREATE INDEX IF NOT EXISTS idx_exam_results_examination_id ON exam_results(examination_id);
      CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
      CREATE INDEX IF NOT EXISTS idx_exam_results_subject ON exam_results(subject);
    `

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL })
    
    if (indexesError) {
      console.error('Error creating indexes:', indexesError)
      return
    }

    console.log('✅ Examinations table setup completed!')
  } catch (error) {
    console.error('❌ Error setting up examinations table:', error)
    process.exit(1)
  }
}

// Run the setup
setupExaminationsTableDirect()
