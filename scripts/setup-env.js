#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
# Replace these placeholder values with your actual Supabase project credentials
# Get these from your Supabase project dashboard: Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Instructions:
# 1. Go to https://supabase.com and create a new project or select existing one
# 2. Go to Settings → API in your Supabase dashboard
# 3. Copy the "Project URL" and replace the URL above
# 4. Copy the "anon public" key and replace the key above
# 5. Save this file and restart your development server
`;

const envPath = path.join(__dirname, '..', '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    console.log('Please check your existing .env.local file and ensure it has the correct Supabase credentials.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with template configuration');
    console.log('📝 Please edit .env.local and add your actual Supabase credentials');
  }
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
}

console.log('\n📋 Next steps:');
console.log('1. Go to https://supabase.com');
console.log('2. Create a new project or select an existing one');
console.log('3. Go to Settings → API');
console.log('4. Copy your Project URL and anon public key');
console.log('5. Update the .env.local file with your actual credentials');
console.log('6. Run the database setup script: node scripts/setup-database.js');
console.log('7. Restart your development server');
