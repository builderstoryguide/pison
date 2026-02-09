/**
 * Database Connection Test Script
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    await prisma.$connect();
    console.log('   ✅ Connected successfully\n');

    // Test 2: Query database version
    console.log('2. Querying database version...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('   ✅ Database version:', (result as any)[0]?.version?.substring(0, 50) + '...\n');

    // Test 3: Check if tables exist
    console.log('3. Checking existing tables...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`   ✅ Found ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`      - ${table.tablename}`);
    });
    console.log('');

    // Test 4: Test a simple query (if UserRole table exists)
    if (tables.some((t) => t.tablename === 'UserRole')) {
      console.log('4. Testing UserRole query...');
      const roleCount = await prisma.userRole.count();
      console.log(`   ✅ Found ${roleCount} user roles\n`);
    }

    // Test 5: Test transaction capability
    console.log('5. Testing transaction capability...');
    await prisma.$transaction(async (tx) => {
      const count = await tx.userRole.count();
      console.log(`   ✅ Transaction test successful (count: ${count})\n`);
    });

    console.log('✅ All database connection tests passed!');
    console.log('\n📊 Database Connection Status:');
    console.log('   Status: CONNECTED');
    console.log('   Database: dcm_db');
    console.log('   Provider: PostgreSQL');
    console.log('   Tables: ' + tables.length);

  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
