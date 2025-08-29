// Verify timetable data insertion
const verifyTimetableData = async () => {
  try {
    console.log('🔍 Verifying timetable data...\n');
    
    // Test 1: Check classes
    console.log('1️⃣ Checking classes...');
    const classesResponse = await fetch('http://localhost:3000/api/timetable/classes');
    const classesData = await classesResponse.json();
    console.log('✅ Classes found:', classesData.classes?.length || 0);
    
    if (classesData.classes && classesData.classes.length > 0) {
      console.log('📋 Sample classes:');
      classesData.classes.slice(0, 3).forEach((cls, index) => {
        console.log(`   ${index + 1}. ${cls.name} (${cls.subsystem}/${cls.branch})`);
      });
      console.log('');
      
      // Test 2: Try to generate a timetable
      const firstClass = classesData.classes[0];
      console.log('2️⃣ Testing timetable generation for:', firstClass.name);
      
      const generateResponse = await fetch('http://localhost:3000/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: firstClass.id,
          academicYear: '2024-2025',
          term: 'first',
          generatedBy: 'verification-test'
        }),
      });
      
      const generateData = await generateResponse.json();
      console.log('✅ Generate response:', generateData);
      console.log('📊 Response status:', generateResponse.status);
      
      if (generateData.success) {
        console.log('🎉 Timetable generation successful!');
      } else {
        console.log('❌ Timetable generation failed:', generateData.error);
      }
    } else {
      console.log('❌ No classes found. Please run the sample data script first.');
      console.log('📝 Run this in your Supabase SQL Editor:');
      console.log('   scripts/insert-sample-timetable-classes.sql');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
};

verifyTimetableData();
