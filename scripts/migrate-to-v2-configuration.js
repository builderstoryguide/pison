#!/usr/bin/env node

/**
 * Migration script to upgrade to the bulletproof configuration system
 * This script handles the transition from the old system to the new v2 system
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Starting Configuration System Migration to V2...\n')

// Step 1: Backup current files
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`
    fs.copyFileSync(filePath, backupPath)
    console.log(`✅ Backed up ${filePath} to ${backupPath}`)
    return backupPath
  }
  return null
}

// Step 2: Update imports in key files
function updateImports() {
  const filesToUpdate = [
    'app/page.tsx',
    'components/dashboard.tsx',
    'components/school-dashboard.tsx'
  ]

  filesToUpdate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      
      // Replace old import with new one
      content = content.replace(
        /from ["']@\/lib\/app-configuration-context["']/g,
        "from '@/lib/app-configuration-context-v2'"
      )
      
      fs.writeFileSync(filePath, content)
      console.log(`✅ Updated imports in ${filePath}`)
    }
  })
}

// Step 3: Create environment variables template
function createEnvTemplate() {
  const envTemplate = `# App Configuration Environment Variables
# These provide fallback values when the database is unavailable

# School Information
NEXT_PUBLIC_SCHOOL_NAME="Pison Academy"
NEXT_PUBLIC_SCHOOL_LOGO="/placeholder-logo.svg"
NEXT_PUBLIC_SCHOOL_LOGO_ALT="School Logo"
NEXT_PUBLIC_SCHOOL_ADDRESS="Douala, Cameroon"
NEXT_PUBLIC_SCHOOL_PHONE="+237 123 456 789"
NEXT_PUBLIC_SCHOOL_EMAIL="info@pisonacademy.cm"
NEXT_PUBLIC_SCHOOL_WEBSITE="https://pisonacademy.cm"
NEXT_PUBLIC_SCHOOL_MOTTO="Excellence in Education"

# Theme Colors
NEXT_PUBLIC_PRIMARY_COLOR="#1f2937"
NEXT_PUBLIC_SECONDARY_COLOR="#3b82f6"

# System Settings
NEXT_PUBLIC_ACADEMIC_YEAR="2024-2025"
NEXT_PUBLIC_CURRENCY="XOF"
NEXT_PUBLIC_TIMEZONE="Africa/Douala"
NEXT_PUBLIC_LANGUAGE="en"
NEXT_PUBLIC_DATE_FORMAT="DD/MM/YYYY"
NEXT_PUBLIC_TIME_FORMAT="24h"
`

  fs.writeFileSync('.env.configuration.template', envTemplate)
  console.log('✅ Created .env.configuration.template')
}

// Step 4: Create database setup script
function createDatabaseSetup() {
  const dbSetup = `-- Bulletproof Configuration Table Setup
-- This script creates the configuration table with proper error handling

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'Pison Academy',
    school_logo_url TEXT,
    school_logo_alt_text VARCHAR(255) DEFAULT 'School Logo',
    school_address TEXT,
    school_phone VARCHAR(50),
    school_email VARCHAR(255),
    school_website VARCHAR(255),
    school_motto TEXT,
    primary_color VARCHAR(7) DEFAULT '#1f2937',
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    academic_year VARCHAR(20) DEFAULT '2024-2025',
    currency VARCHAR(10) DEFAULT 'XOF',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Insert default configuration if none exists
INSERT INTO app_configuration (
    school_name,
    school_logo_url,
    school_logo_alt_text,
    school_address,
    school_phone,
    school_email,
    school_website,
    school_motto,
    primary_color,
    secondary_color,
    academic_year,
    currency,
    timezone,
    language,
    date_format,
    time_format
) 
SELECT 
    'Pison Academy',
    '/placeholder-logo.svg',
    'Pison Academy Logo',
    'Douala, Cameroon',
    '+237 123 456 789',
    'info@pisonacademy.cm',
    'https://pisonacademy.cm',
    'Excellence in Education',
    '#1f2937',
    '#3b82f6',
    '2024-2025',
    'XOF',
    'Africa/Douala',
    'en',
    'DD/MM/YYYY',
    '24h'
WHERE NOT EXISTS (SELECT 1 FROM app_configuration);

-- Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to update app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to insert app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to delete app configuration" ON app_configuration;

-- Create new policies
CREATE POLICY "Allow authenticated users to read app configuration" ON app_configuration
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin users to update app configuration" ON app_configuration
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to insert app configuration" ON app_configuration
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to delete app configuration" ON app_configuration
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_app_configuration_updated_at ON app_configuration;
CREATE TRIGGER trigger_update_app_configuration_updated_at
    BEFORE UPDATE ON app_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_app_configuration_updated_at();

-- Verify the setup
SELECT 'Configuration table setup completed successfully' as status;
SELECT COUNT(*) as record_count FROM app_configuration;
SELECT school_name, primary_color, secondary_color FROM app_configuration LIMIT 1;
`

  fs.writeFileSync('scripts/setup-bulletproof-configuration.sql', dbSetup)
  console.log('✅ Created bulletproof database setup script')
}

// Step 5: Create migration guide
function createMigrationGuide() {
  const guide = `# Configuration System Migration Guide

## 🎯 What This Migration Does

This migration upgrades your configuration system to a **bulletproof, production-ready** version that:

- ✅ **Never fails** - Always provides configuration data
- ✅ **Works offline** - Caches data locally
- ✅ **Handles errors gracefully** - Multiple fallback strategies
- ✅ **Performance optimized** - Smart caching and retry logic
- ✅ **Production ready** - Comprehensive error handling

## 🚀 Migration Steps

### 1. Database Setup
Run the new database setup script in your Supabase SQL Editor:

\`\`\`sql
-- Copy and paste the contents of scripts/setup-bulletproof-configuration.sql
\`\`\`

### 2. Environment Variables (Optional)
Add these to your \`.env.local\` file for additional fallback values:

\`\`\`env
NEXT_PUBLIC_SCHOOL_NAME="Your School Name"
NEXT_PUBLIC_SCHOOL_LOGO="/your-logo.svg"
NEXT_PUBLIC_PRIMARY_COLOR="#your-color"
# ... (see .env.configuration.template for full list)
\`\`\`

### 3. Test the Migration
1. Restart your development server
2. Visit \`/test-app-configuration\` to verify everything works
3. Try the admin configuration panel

## 🔧 How the New System Works

### Fallback Strategy (in order):
1. **Cache** - Uses in-memory cache (5-minute TTL)
2. **Database** - Fetches from Supabase with retry logic
3. **LocalStorage** - Uses browser storage as backup
4. **Environment Variables** - Uses .env values
5. **Hardcoded Defaults** - Always works as last resort

### Error Handling:
- Network failures → Uses cached/local data
- Database errors → Uses fallback configuration
- Authentication issues → Uses public defaults
- Invalid data → Uses validated defaults

### Performance Features:
- Smart caching with TTL
- Optimistic updates
- Retry with exponential backoff
- Network status detection
- Request timeouts

## 🎉 Benefits

- **Zero downtime** - App always works
- **Better UX** - No more loading errors
- **Faster** - Cached data loads instantly
- **Reliable** - Multiple fallback layers
- **Maintainable** - Clear error messages and logging

## 🆘 Rollback (if needed)

If you need to rollback:

1. Restore the backup files (they have .backup.timestamp extensions)
2. Revert the import changes
3. Use the old API endpoints

## 📊 Monitoring

The new system provides detailed logging:
- Configuration source (cache/database/fallback)
- Response times
- Error details
- Network status

Check browser console for detailed logs.
`

  fs.writeFileSync('CONFIGURATION_MIGRATION_GUIDE.md', guide)
  console.log('✅ Created migration guide')
}

// Execute migration
async function runMigration() {
  try {
    console.log('📦 Step 1: Backing up current files...')
    backupFile('lib/app-configuration-context.tsx')
    backupFile('app/api/configuration/route.ts')
    
    console.log('\n🔄 Step 2: Updating imports...')
    updateImports()
    
    console.log('\n📝 Step 3: Creating environment template...')
    createEnvTemplate()
    
    console.log('\n🗄️ Step 4: Creating database setup...')
    createDatabaseSetup()
    
    console.log('\n📚 Step 5: Creating migration guide...')
    createMigrationGuide()
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the SQL script in your Supabase dashboard')
    console.log('2. Restart your development server')
    console.log('3. Test the configuration system')
    console.log('4. Read CONFIGURATION_MIGRATION_GUIDE.md for details')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
