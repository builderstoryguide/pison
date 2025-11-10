# Student & Parent Account Creation Testing Guide

## Overview

This guide provides comprehensive manual testing instructions for the student and parent account creation functionality in the school management system. It covers both happy path scenarios and error handling to ensure the system works correctly.

## Prerequisites

1. **Admin Access**: You need admin credentials to access the user creation functionality
2. **Database Setup**: Ensure the database tables are properly set up (run the SQL scripts if needed)
3. **Classes Available**: Verify that classes are available in the system for student enrollment

## Test Environment Setup

1. **Login as Admin**:
   - Navigate to the application
   - Login with admin credentials: `admin@school.com` / `Admin@2024`
   - Verify you can access the dashboard

2. **Navigate to User Management**:
   - Click on "User Management" in the sidebar
   - Click "Create User" button
   - Select "Student" from the role options

## Happy Path Testing

### Test 1: Complete Student Enrollment with Parent Account

**Objective**: Verify that a complete student enrollment creates both student and parent accounts successfully.

**Steps**:
1. **Personal Information**:
   - First Name: `John`
   - Last Name: `Doe`
   - Middle Name: `Michael`
   - Date of Birth: `2010-05-15`
   - Gender: `Male`
   - Place of Birth: `Yaounde`
   - Nationality: `Cameroonian`
   - Religion: `Christian`
   - Email: `john.doe@example.com`
   - Phone: `+237 6 1234 5678`
   - Address: `123 Main Street, Yaounde`
   - City: `Yaounde`
   - Region: `Centre`

2. **Academic Information**:
   - Subsystem: `English`
   - Branch: `Grammar`
   - Class: Select any available class (e.g., `Form 5A`)
   - Previous School: `Previous School Name`
   - Previous Class: `Form 4`

3. **Parent Information**:
   - Parent Name: `Jane Doe`
   - Parent Email: `jane.doe@example.com`
   - Parent Phone: `+237 6 8765 4321`
   - Parent Address: `123 Main Street, Yaounde`
   - Parent Occupation: `Engineer`
   - Relationship: `Mother`

4. **Emergency Contact**:
   - Emergency Contact Name: `Robert Smith`
   - Emergency Contact Phone: `+237 6 1111 2222`
   - Emergency Contact Relationship: `Uncle`

5. **Medical Information**:
   - Medical Conditions: `None`
   - Allergies: `None`
   - Blood Group: `O+`

6. **Documents**:
   - Check all document checkboxes (Birth Certificate, Previous Transcript, Passport Photo, Medical Certificate)

7. **Submit Form**:
   - Click "Submit" or "Create Student" button
   - Wait for success message

**Expected Results**:
- ✅ Success dialog appears with student and parent credentials
- ✅ Student ID is generated (format: `STU` + numbers)
- ✅ Parent Code is generated (format: `PAR` + year + numbers)
- ✅ Student Password is generated (format: `Student@2024` + 4 random chars)
- ✅ Parent Password is generated (format: `Parent@2024` + 4 random chars)
- ✅ Class NAME is displayed (not class ID)
- ✅ Both accounts are created in the database

### Test 2: Student Login Verification

**Objective**: Verify that the generated student password works for login.

**Steps**:
1. **Close Success Dialog**: Click "Close" or "Done" button
2. **Logout as Admin**: Click logout button
3. **Login as Student**:
   - Email: `john.doe@example.com`
   - Password: Use the generated student password from Test 1
4. **Verify Dashboard**: Check that student dashboard loads correctly

**Expected Results**:
- ✅ Login successful
- ✅ Student dashboard displays
- ✅ Student can see their assignments, grades, etc.

### Test 3: Parent Login Verification

**Objective**: Verify that the generated parent password works for login.

**Steps**:
1. **Logout as Student**: Click logout button
2. **Login as Parent**:
   - Email: `jane.doe@example.com`
   - Password: Use the generated parent password from Test 1
3. **Verify Dashboard**: Check that parent dashboard loads correctly

**Expected Results**:
- ✅ Login successful
- ✅ Parent dashboard displays
- ✅ Parent can see child's progress, grades, etc.

### Test 4: Welcome Email Content Verification

**Objective**: Verify that welcome emails contain class names (not IDs).

**Steps**:
1. **Create Another Student**: Follow Test 1 steps with different data
2. **Check Email Content**: Look for email send/download option
3. **Verify Email Content**: Check that email contains:
   - Student ID
   - Parent Code
   - Class NAME (e.g., "Form 5A", not a UUID)
   - Student Password
   - Parent Password

**Expected Results**:
- ✅ Email contains all required information
- ✅ Class name is human-readable (not UUID)
- ✅ Passwords are in correct format

## Error Handling Testing

### Test 5: Missing Required Fields

**Objective**: Verify that missing required fields show appropriate error messages.

**Test Cases**:

#### 5a. Missing Student First Name
- Leave "First Name" field empty
- Fill all other required fields
- Click Submit
- **Expected**: Error message "First name is required"

#### 5b. Missing Student Last Name
- Leave "Last Name" field empty
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Last name is required"

#### 5c. Missing Class Selection
- Leave "Class" field unselected
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Class is required"

#### 5d. Missing Parent Name
- Leave "Parent Name" field empty
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Parent name is required"

### Test 6: Invalid Data Format

**Objective**: Verify that invalid data formats show appropriate error messages.

**Test Cases**:

#### 6a. Invalid Student Email
- Enter invalid email: `invalid-email`
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Invalid email format"

#### 6b. Invalid Parent Email
- Enter invalid parent email: `parent-invalid-email`
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Invalid email format"

#### 6c. Invalid Phone Number
- Enter invalid phone: `123`
- Fill all other required fields
- Click Submit
- **Expected**: Error message "Invalid phone number"

### Test 7: Duplicate Account Creation

**Objective**: Verify that duplicate accounts are prevented.

**Steps**:
1. **Create First Student**: Follow Test 1 steps
2. **Close Success Dialog**: Click "Close" button
3. **Create Second Student**: 
   - Use same email as first student
   - Fill all other fields with different data
   - Click Submit
4. **Verify Error**: Check for duplicate email error

**Expected Results**:
- ✅ Error message: "Email already exists"
- ✅ Second student account is not created

## Password Security Testing

### Test 8: Password Format Verification

**Objective**: Verify that generated passwords meet security requirements.

**Steps**:
1. **Create Multiple Students**: Create 3-5 students with different data
2. **Check Password Formats**: For each student, verify:
   - Student password format: `Student@2024` + 4 random uppercase alphanumeric chars
   - Parent password format: `Parent@2024` + 4 random uppercase alphanumeric chars
3. **Verify Uniqueness**: Ensure all passwords are different

**Expected Results**:
- ✅ All passwords follow the correct format
- ✅ All passwords are unique
- ✅ Passwords contain uppercase letters, numbers, and special characters

### Test 9: Immediate Login After Creation

**Objective**: Verify that generated passwords work immediately after account creation.

**Steps**:
1. **Create Student**: Follow Test 1 steps
2. **Note Credentials**: Write down the generated passwords
3. **Close Dialog**: Click "Close" button
4. **Logout Admin**: Click logout
5. **Immediate Login**: Try to login with generated credentials
6. **Verify Success**: Check that login works immediately

**Expected Results**:
- ✅ Login successful immediately after account creation
- ✅ No delay or activation period required

## Class Name Display Testing

### Test 10: Class Name vs Class ID

**Objective**: Verify that class names (not IDs) are displayed in emails and success dialogs.

**Steps**:
1. **Create Student**: Follow Test 1 steps
2. **Check Success Dialog**: Verify class name is displayed (e.g., "Form 5A")
3. **Check Email Content**: If email is sent/downloaded, verify class name
4. **Verify Not UUID**: Ensure class is not displayed as UUID format

**Expected Results**:
- ✅ Class name is human-readable (e.g., "Form 5A", "Class 3B")
- ✅ Class is not displayed as UUID (e.g., "123e4567-e89b-12d3-a456-426614174000")

## Troubleshooting

### Common Issues

1. **"Classes not loading"**:
   - Check database connection
   - Verify classes table exists
   - Run database setup scripts

2. **"Email not sending"**:
   - Check email configuration
   - Verify SMTP settings
   - Check email service status

3. **"Login not working"**:
   - Verify password format
   - Check user account status
   - Verify database user records

4. **"Class name showing as ID"**:
   - Check class lookup in enrollment context
   - Verify classes table has class_name field
   - Check email template updates

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are successful
3. **Check Database**: Verify records are created correctly
4. **Check Logs**: Look for server-side errors

## Success Criteria Checklist

- [ ] Student account created successfully
- [ ] Parent account created successfully
- [ ] Student password generated in correct format
- [ ] Parent password generated in correct format
- [ ] Student can login with generated password
- [ ] Parent can login with generated password
- [ ] Class name displayed (not class ID)
- [ ] Welcome email contains class name
- [ ] Error messages shown for invalid data
- [ ] Duplicate accounts prevented
- [ ] All required fields validated
- [ ] Form clears properly
- [ ] Passwords are unique and secure

## Test Data Templates

### Valid Student Data Template
```
First Name: TestStudent[RandomID]
Last Name: LastName[RandomID]
Email: teststudent[timestamp]@example.com
Phone: +237 6[7 digits]
Class: [Select from available classes]
Parent Name: TestParent[RandomID]
Parent Email: testparent[timestamp]@example.com
Parent Phone: +237 6[7 digits]
```

### Invalid Data Examples
```
Invalid Emails: invalid-email, @example.com, test@
Invalid Phones: 123, +237, 1234567890
Invalid Names: "", "   ", "123"
```

## Reporting Issues

When reporting issues, include:
1. **Steps to Reproduce**: Exact steps taken
2. **Expected Result**: What should happen
3. **Actual Result**: What actually happened
4. **Screenshots**: Visual evidence of the issue
5. **Browser/Environment**: Browser version, OS, etc.
6. **Error Messages**: Any error messages displayed

## Conclusion

This testing guide ensures comprehensive coverage of the student and parent account creation functionality. Regular testing using this guide will help maintain system quality and catch issues early.
