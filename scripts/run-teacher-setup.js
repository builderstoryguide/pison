#!/usr/bin/env node

/**
 * Teacher Database Setup Script
 * 
 * This script sets up the teachers table in the database.
 * Run with: node scripts/run-teacher-setup.js
 */

const { setupTeachersTable } = require('./setup-teachers-table');

async function main() {
  console.log('🏫 School Management System');
  console.log('📚 Teacher Database Setup\n');
  
  try {
    const success = await setupTeachersTable();
    
    if (success) {
      console.log('\n✅ Setup completed successfully!');
      console.log('🎉 You can now use the teacher management features.');
      console.log('\n📖 Next steps:');
      console.log('   1. Access the admin dashboard');
      console.log('   2. Navigate to Teacher Management');
      console.log('   3. Start adding teachers to the system');
      process.exit(0);
    } else {
      console.log('\n❌ Setup failed. Please check the error messages above.');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Verify your database connection');
      console.log('   2. Check your environment variables');
      console.log('   3. Ensure you have proper database permissions');
      console.log('   4. Try running the SQL script manually in your database client');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    console.log('\n🔧 Please check your setup and try again.');
    process.exit(1);
  }
}

// Run the setup
main();
