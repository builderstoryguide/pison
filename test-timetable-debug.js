// Comprehensive timetable debugging script
const testTimetableDebug = async () => {
  try {
    console.log('🔍 Starting comprehensive timetable debugging...\n');
    
    // Test 1: Check if API is accessible
    console.log('1️⃣ Testing API accessibility...');
    const testResponse = await fetch('http://localhost:3000/api/timetable/test');
    const testData = await testResponse.json();
    console.log('✅ Test endpoint response:', testData);
    console.log('');
    
    // Test 2: Check if classes exist
    console.log('2️⃣ Testing classes endpoint...');
    const classesResponse = await fetch('http://localhost:3000/api/timetable/classes');
    const classesData = await classesResponse.json();
    console.log('✅ Classes endpoint response:', classesData);
    console.log('');
    
    // Test 3: Try to generate a timetable with a real class ID
    if (classesData.classes && classesData.classes.length > 0) {
      const firstClass = classesData.classes[0];
      console.log('3️⃣ Testing timetable generation with real class:', firstClass.name);
      
      const generateResponse = await fetch('http://localhost:3000/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: firstClass.id,
          academicYear: '2024-2025',
          term: 'first',
          generatedBy: 'debug-test'
        }),
      });
      
      const generateData = await generateResponse.json();
      console.log('✅ Generate timetable response:', generateData);
      console.log('📊 Response status:', generateResponse.status);
    } else {
      console.log('❌ No classes found in database');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

// Run the debug test
testTimetableDebug();
