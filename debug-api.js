#!/usr/bin/env node

/**
 * API Diagnostic Script
 * This script tests your API endpoints to identify which one is returning HTML instead of JSON
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    
    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n🧪 Testing: ${method} ${path}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Content-Type: ${res.headers['content-type']}`);
        
        // Check if response looks like HTML
        if (data.trim().startsWith('<') || data.includes('<!DOCTYPE') || data.includes('<html>')) {
          console.log(`   ❌ ISSUE: Returning HTML instead of JSON`);
          console.log(`   📄 First 200 chars: ${data.substring(0, 200)}...`);
          resolve({ 
            path, 
            status: res.statusCode, 
            contentType: res.headers['content-type'],
            isHtml: true,
            data: data.substring(0, 500)
          });
        } else if (data.trim().startsWith('Internal Server Error') || data.includes('Internal S')) {
          console.log(`   ❌ ISSUE: Server Error (likely causing JSON parse error)`);
          console.log(`   📄 Error: ${data.substring(0, 200)}...`);
          resolve({ 
            path, 
            status: res.statusCode, 
            contentType: res.headers['content-type'],
            isError: true,
            data: data.substring(0, 500)
          });
        } else {
          try {
            const parsed = JSON.parse(data);
            console.log(`   ✅ Valid JSON response`);
            console.log(`   📊 Keys: ${Object.keys(parsed).join(', ')}`);
            resolve({ path, status: res.statusCode, isValid: true });
          } catch (parseError) {
            console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
            console.log(`   📄 First 200 chars: ${data.substring(0, 200)}...`);
            resolve({ 
              path, 
              status: res.statusCode, 
              parseError: parseError.message,
              data: data.substring(0, 500)
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      console.log(`\n🧪 Testing: ${method} ${path}`);
      console.log(`   ❌ Request failed: ${error.message}`);
      resolve({ path, error: error.message });
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log('🔍 API Diagnostics - Testing for JSON Parse Issues');
  console.log('==================================================');
  
  const endpoints = [
    '/api/users?limit=5',
    '/api/activity-logs/simple?limit=5',
    '/api/activity-logs/optimized?limit=5',
    '/api/activity-logs?limit=5',
    '/api/timetable/admin-classes',
    '/api/auth/login',
    '/', // Test main page
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Summary Report');
  console.log('=================');
  
  const issues = results.filter(r => r.isHtml || r.isError || r.parseError);
  const working = results.filter(r => r.isValid);
  
  console.log(`✅ Working endpoints: ${working.length}`);
  console.log(`❌ Problematic endpoints: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    issues.forEach(issue => {
      console.log(`   • ${issue.path}`);
      if (issue.isHtml) {
        console.log(`     - Returning HTML instead of JSON`);
      }
      if (issue.isError) {
        console.log(`     - Server error response`);
      }
      if (issue.parseError) {
        console.log(`     - JSON parse error: ${issue.parseError}`);
      }
      if (issue.data) {
        console.log(`     - Response preview: ${issue.data.substring(0, 100)}...`);
      }
    });
    
    console.log('\n💡 Next steps:');
    console.log('   1. Check your development server logs for stack traces');
    console.log('   2. Verify your environment variables are set correctly');
    console.log('   3. Check database connections');
    console.log('   4. Look at the browser Network tab for the specific failing request');
  } else {
    console.log('\n🎉 All tested endpoints are working correctly!');
    console.log('   The JSON parse error might be coming from a different request.');
    console.log('   Check your browser\'s Network tab to identify the specific failing request.');
  }
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic script failed:', error);
  process.exit(1);
});
