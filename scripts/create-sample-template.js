const XLSX = require('xlsx');

// Sample student data for template
const templateData = [
  {
    'First Name': 'John',
    'Last Name': 'Doe',
    'Middle Name': 'Michael',
    'Date of Birth': '2008-05-15',
    'Gender': 'male',
    'Place of Birth': 'Yaounde',
    'Nationality': 'Cameroonian',
    'Religion': 'Christian',
    'Email': 'john.doe@example.com',
    'Phone': '+237612345678',
    'Address': '123 Main Street',
    'City': 'Yaounde',
    'Region': 'Centre',
    'Subsystem': 'english',
    'Branch': 'grammar',
    'Class': 'Form 1',
    'Previous School': 'Primary School',
    'Previous Class': 'Class 6',
    'Parent Name': 'Jane Doe',
    'Parent Email': 'jane.doe@example.com',
    'Parent Phone': '+237612345679',
    'Parent Address': '123 Main Street',
    'Parent Occupation': 'Teacher',
    'Relationship': 'mother',
    'Emergency Contact Name': 'John Doe Sr',
    'Emergency Contact Phone': '+237612345680',
    'Emergency Contact Relationship': 'father',
    'Medical Conditions': 'None',
    'Allergies': 'None',
    'Blood Group': 'O+'
  },
  {
    'First Name': 'Sarah',
    'Last Name': 'Smith',
    'Middle Name': 'Elizabeth',
    'Date of Birth': '2009-03-22',
    'Gender': 'female',
    'Place of Birth': 'Douala',
    'Nationality': 'Cameroonian',
    'Religion': 'Christian',
    'Email': 'sarah.smith@example.com',
    'Phone': '+237612345681',
    'Address': '456 Oak Avenue',
    'City': 'Douala',
    'Region': 'Littoral',
    'Subsystem': 'french',
    'Branch': 'commercial',
    'Class': '4ème',
    'Previous School': 'Collège Saint-Joseph',
    'Previous Class': '5ème',
    'Parent Name': 'Robert Smith',
    'Parent Email': 'robert.smith@example.com',
    'Parent Phone': '+237612345682',
    'Parent Address': '456 Oak Avenue',
    'Parent Occupation': 'Engineer',
    'Relationship': 'father',
    'Emergency Contact Name': 'Mary Smith',
    'Emergency Contact Phone': '+237612345683',
    'Emergency Contact Relationship': 'mother',
    'Medical Conditions': 'None',
    'Allergies': 'Peanuts',
    'Blood Group': 'A+'
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(templateData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Student Template');

// Write to file
XLSX.writeFile(wb, 'sample_student_upload_template.xlsx');

console.log('Sample template created: sample_student_upload_template.xlsx');
console.log('This file contains 2 sample student records for testing the bulk upload feature.');
