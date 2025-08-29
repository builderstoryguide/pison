// Test script for timetable API debugging
const testTimetableAPI = async () => {
  try {
    console.log('Testing timetable API...');
    
    // Test 1: Check if API is accessible
    const testResponse = await fetch('http://localhost:3000/api/timetable/test');
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    // Test 2: Try to generate a timetable
    const generateResponse = await fetch('http://localhost:3000/api/timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classId: 'test-class-id', // This will fail, but we'll see the error
        academicYear: '2024-2025',
        term: 'first',
        generatedBy: 'test'
      }),
    });
    
    const generateData = await generateResponse.json();
    console.log('Generate timetable response:', generateData);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Run the test
testTimetableAPI();
