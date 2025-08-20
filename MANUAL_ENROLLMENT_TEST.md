# Student Enrollment Component - Manual Test Guide

## Overview
This guide provides step-by-step instructions to manually test the student enrollment functionality in the school management application.

## Prerequisites
1. Ensure the development server is running (`npm run dev`)
2. Open the application in a web browser at `http://localhost:3000`
3. Have test data ready for enrollment

## Test Data
Use the following test data for enrollment:

### Student Information
- **First Name**: John
- **Last Name**: Doe
- **Middle Name**: Michael
- **Date of Birth**: 2008-05-15
- **Gender**: Male
- **Place of Birth**: Yaoundé
- **Nationality**: Cameroonian
- **Religion**: Christian

### Contact Information
- **Email**: john.doe@example.com
- **Phone**: +237 612345678
- **Address**: 123 Main Street, Yaoundé
- **City**: Yaoundé
- **Region**: Centre

### Academic Information
- **Subsystem**: English
- **Branch**: Grammar
- **Class**: Form 3
- **Previous School**: St. Joseph College
- **Previous Class**: Form 2

### Parent Information
- **Parent Name**: Robert Doe
- **Relationship**: Father
- **Parent Email**: robert.doe@example.com
- **Parent Phone**: +237 698765432
- **Parent Address**: 123 Main Street, Yaoundé
- **Parent Occupation**: Engineer

### Emergency Contact
- **Contact Name**: Mary Doe
- **Contact Phone**: +237 655443322
- **Relationship**: Mother
- **Blood Group**: O+
- **Medical Conditions**: None
- **Allergies**: None

### Required Documents
- ✅ Birth Certificate
- ✅ Passport Photos
- ✅ Previous Transcript
- ❌ Medical Certificate

## Test Steps

### Step 1: Access the Application
1. Open your web browser
2. Navigate to `http://localhost:3000`
3. Verify the application loads successfully
4. Check if you need to log in (if authentication is required)

### Step 2: Navigate to Student Management
1. Look for the sidebar navigation
2. Click on "Student Management" or "Students"
3. Verify you're on the student management page
4. Look for an "Add Student" or "+" button

### Step 3: Start Enrollment Process
1. Click the "Add Student" or "+" button
2. Verify the enrollment form opens
3. Check that you see "Step 1 of 6" in the progress indicator

### Step 4: Fill Step 1 - Personal Information
1. Enter the student's first name: "John"
2. Enter middle name: "Michael"
3. Enter last name: "Doe"
4. Select date of birth: "2008-05-15"
5. Select gender: "Male"
6. Enter place of birth: "Yaoundé"
7. Enter nationality: "Cameroonian"
8. Enter religion: "Christian"
9. Click "Next" button
10. Verify you move to Step 2

### Step 5: Fill Step 2 - Contact Information
1. Enter email: "john.doe@example.com"
2. Enter phone: "+237 612345678"
3. Enter address: "123 Main Street, Yaoundé"
4. Enter city: "Yaoundé"
5. Select region: "Centre"
6. Click "Next" button
7. Verify you move to Step 3

### Step 6: Fill Step 3 - Academic Information
1. Select subsystem: "English"
2. Select branch: "Grammar"
3. Select class: "Form 3"
4. Enter previous school: "St. Joseph College"
5. Enter previous class: "Form 2"
6. Click "Next" button
7. Verify you move to Step 4

### Step 7: Fill Step 4 - Parent Information
1. Enter parent name: "Robert Doe"
2. Select relationship: "Father"
3. Enter parent email: "robert.doe@example.com"
4. Enter parent phone: "+237 698765432"
5. Enter parent address: "123 Main Street, Yaoundé"
6. Enter parent occupation: "Engineer"
7. Click "Next" button
8. Verify you move to Step 5

### Step 8: Fill Step 5 - Emergency Contact
1. Enter emergency contact name: "Mary Doe"
2. Enter emergency contact phone: "+237 655443322"
3. Enter relationship: "Mother"
4. Select blood group: "O+"
5. Enter medical conditions: "None"
6. Enter allergies: "None"
7. Click "Next" button
8. Verify you move to Step 6

### Step 9: Fill Step 6 - Required Documents
1. Check the box for "Birth Certificate"
2. Check the box for "Passport Photos"
3. Check the box for "Previous Transcript"
4. Leave "Medical Certificate" unchecked
5. Verify the "Complete Enrollment" button is enabled
6. Click "Complete Enrollment"

### Step 10: Verify Success
1. Check that a success dialog appears
2. Verify the dialog shows "Enrollment Successful!"
3. Check that a Student ID is generated (format: STU2024XXX)
4. Check that a Parent Code is generated (format: PAR2024XXX)
5. Verify the student name is displayed correctly
6. Check that the dialog shows next steps
7. Click "Complete" to close the dialog

### Step 11: Verify Data Persistence
1. Return to the student management page
2. Check that the new student appears in the list
3. Verify the student's information is correct
4. Check that the enrollment status is "pending"

## Expected Results

### Success Criteria
- ✅ All form steps complete without errors
- ✅ Student ID is generated automatically
- ✅ Parent code is generated automatically
- ✅ Success dialog displays correctly
- ✅ Student appears in the student list
- ✅ All data is saved correctly

### Error Handling
- ✅ Form validation works (required fields)
- ✅ Step navigation is blocked if required fields are empty
- ✅ Error messages display appropriately
- ✅ Form can be cancelled without data loss

## Test Variations

### Test Case 1: Complete Enrollment
- Use all the test data above
- Complete all 6 steps
- Verify successful enrollment

### Test Case 2: Partial Information
- Skip optional fields (middle name, religion, etc.)
- Verify enrollment still works
- Check that optional fields are handled correctly

### Test Case 3: Validation Testing
- Try to proceed without required fields
- Verify validation messages appear
- Check that navigation is blocked

### Test Case 4: Different Academic Paths
- Test with French subsystem
- Test with Technical branch
- Test with Commercial branch
- Verify class options change appropriately

## Troubleshooting

### Common Issues
1. **Form doesn't load**: Check if the development server is running
2. **Navigation doesn't work**: Check browser console for JavaScript errors
3. **Data not saving**: Check if localStorage is enabled in browser
4. **Validation errors**: Ensure all required fields are filled

### Browser Compatibility
- Test in Chrome, Firefox, Safari, and Edge
- Verify responsive design on mobile devices
- Check accessibility features

## Reporting
Document any issues found during testing:
- Screenshots of errors
- Browser console logs
- Steps to reproduce
- Expected vs actual behavior

## Conclusion
This manual test ensures the student enrollment component works correctly and provides a smooth user experience for enrolling new students.
