#!/usr/bin/env node

/**
 * Test script to verify the database fix works correctly
 * This script tests the API endpoints to ensure they work after applying the database fix
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, expectedStatus = 200) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   Endpoint: ${path}`);
  
  try {
    const response = await makeRequest(path);
    
    if (response.status === expectedStatus) {
      console.log(`   ✅ Success: Status ${response.status}`);
      
      if (response.data) {
        if (response.data.error) {
          console.log(`   ⚠️  Has error: ${response.data.error}`);
          if (response.data.details) {
            console.log(`   📝 Details: ${response.data.details}`);
          }
        } else {
          console.log(`   📊 Response keys: ${Object.keys(response.data).join(', ')}`);
        }
      }
      
      return { success: true, response };
    } else {
      console.log(`   ❌ Failed: Expected ${expectedStatus}, got ${response.status}`);
      if (response.data && response.data.error) {
        console.log(`   📝 Error: ${response.data.error}`);
      }
      return { success: false, response };
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Database Fix for Activity Logs');
  console.log('=========================================');
  
  const tests = [
    {
      name: 'Users API (basic)',
      path: '/api/users?limit=10',
      expectedStatus: 200
    },
    {
      name: 'Activity Logs (optimized)',
      path: '/api/activity-logs/optimized?limit=10',
      expectedStatus: 200
    },
    {
      name: 'Activity Logs (simple)',
      path: '/api/activity-logs/simple?limit=10',
      expectedStatus: 200
    },
    {
      name: 'Activity Logs (optimized with search)',
      path: '/api/activity-logs/optimized?limit=5&search=login',
      expectedStatus: 200
    },
    {
      name: 'Users API (with filters)',
      path: '/api/users?role=admin&limit=5',
      expectedStatus: 200
    }
  ];
  
  const results = [];
  let successCount = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, test.expectedStatus);
    results.push({ ...test, ...result });
    if (result.success) successCount++;
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${successCount}`);
  console.log(`Failed: ${tests.length - successCount}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 All tests passed! The database fix is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    console.log('\n💡 Next steps:');
    console.log('   1. Ensure your development server is running (npm run dev)');
    console.log('   2. Apply the database fix script in Supabase SQL Editor');
    console.log('   3. Check your database connection and environment variables');
  }
  
  console.log('\n🔧 Manual verification:');
  console.log(`   • Visit: ${BASE_URL}/api/activity-logs/optimized?limit=5`);
  console.log(`   • Visit: ${BASE_URL}/api/users?limit=5`);
  console.log('   • Check browser console for any remaining errors');
  
  return results;
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint, makeRequest };
