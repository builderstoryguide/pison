// Simple environment check
const testEnvironment = async () => {
  try {
    console.log('🔍 Checking environment...\n');
    
    // Test basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const response = await fetch('http://localhost:3000/api/timetable/test');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const text = await response.text();
      console.log('📄 Response text (first 200 chars):', text.substring(0, 200));
      
      try {
        const json = JSON.parse(text);
        console.log('✅ Valid JSON response:', json);
      } catch (parseError) {
        console.log('❌ Invalid JSON response - this is the issue!');
        console.log('📄 Full response:', text);
      }
    } else {
      console.log('❌ Response not OK');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testEnvironment();
