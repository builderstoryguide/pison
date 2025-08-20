#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 School Management App - Database Setup');
console.log('==========================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please run: node scripts/setup-env.js first');
  process.exit(1);
}

// Read the .env.local file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check if Supabase credentials are configured
if (envContent.includes('your-project-id') || envContent.includes('your-anon-key-here')) {
  console.log('❌ Supabase credentials not configured!');
  console.log('Please update your .env.local file with your actual Supabase credentials.');
  console.log('Then restart your development server and run this script again.');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('📋 Database setup instructions:');
console.log('');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the contents of scripts/create-tables.sql');
console.log('4. Paste and execute the SQL script');
console.log('5. Verify that all tables were created successfully');
console.log('');

// Read and display the SQL script
const sqlPath = path.join(__dirname, 'create-tables.sql');
if (fs.existsSync(sqlPath)) {
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log('📄 SQL Script to execute:');
  console.log('========================');
  console.log(sqlContent);
  console.log('========================');
  console.log('');
  console.log('💡 Tip: You can also copy the SQL script from the file: scripts/create-tables.sql');
} else {
  console.log('❌ SQL script file not found: scripts/create-tables.sql');
}

console.log('🎯 After setting up the database:');
console.log('1. Restart your development server');
console.log('2. Test the connection at: http://localhost:3000/test-connection');
console.log('3. Try enrolling a student to verify everything works');
