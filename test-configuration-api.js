// Simple test script to check if the configuration API is working
const fetch = require('node-fetch');

async function testConfigurationAPI() {
  try {
    console.log('🧪 Testing Configuration API...');
    
    // Test the configuration endpoint
    const response = await fetch('http://localhost:3000/api/configuration', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      
      if (response.status === 401) {
        console.log('🔐 Authentication required - this is expected for protected endpoints');
        console.log('💡 The API is working, but you need to be logged in to access it');
      } else if (response.status === 500) {
        console.log('🗄️  Server error - likely the app_configuration table does not exist');
        console.log('💡 Please create the table using the SQL script in scripts/create-app-configuration-table.sql');
      }
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('💡 Make sure the development server is running on port 3000');
  }
}

testConfigurationAPI();
