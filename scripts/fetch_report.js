const fs = require('fs');

async function fetchReport() {
    try {
        const content = fs.readFileSync('ids.txt', 'utf8');
        const classIdMatch = content.match(/Class ID: (.+)/);
        const studentIdMatch = content.match(/Student ID: (.+)/);

        if (!classIdMatch || !studentIdMatch) {
            console.error('Could not parse IDs from ids.txt');
            return;
        }

        const classId = classIdMatch[1].trim();
        const studentId = studentIdMatch[1].trim();

        console.log(`Fetching report for Student: ${studentId}, Class: ${classId}`);

        const url = `http://localhost:3000/api/admin/reports/student-report?studentId=${studentId}&classId=${classId}&academicTermId=first`;
        console.log(`URL: ${url}`);

        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        
        console.log('\n--- API Response Analysis ---');
        console.log('Subjects Keys:', Object.keys(data.subjects));
        
        if (data.subjects.others) {
            console.log('"others" section FOUND!');
            console.log('Items in "others":', data.subjects.others.items.length);
            data.subjects.others.items.forEach(item => {
                console.log(`  - ${item.name} (Eval: ${item.eval}, Coef: ${item.coef})`);
            });
        } else {
            console.log('"others" section NOT FOUND.');
        }

        // Check for specific subjects
        const subjectsToCheck = ['Citizenship', 'Physical Education'];
        console.log('\n--- Checking for Specific Subjects ---');
        
        let foundAny = false;
        Object.values(data.subjects).forEach(section => {
            if (!section.items) return;
            section.items.forEach(item => {
                if (subjectsToCheck.some(s => item.name.includes(s))) {
                    console.log(`Found "${item.name}" in section "${section.title}" (Category: ${item.category})`);
                    foundAny = true;
                }
            });
        });
        if (!foundAny) {
            console.log('Did not find Citizenship or Physical Education in any section.');
        }

    } catch (e) {
        console.error('Script error:', e);
    }
}

fetchReport();
