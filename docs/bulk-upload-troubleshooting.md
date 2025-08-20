# Bulk Upload Troubleshooting Guide

## Common Issues and Solutions

### 1. Page Keeps Reloading When Uploading CSV

**Problem**: The page reloads and takes you back to the upload modal when trying to upload a CSV file.

**Root Cause**: This is typically caused by form submission behavior or event handling conflicts.

**Solutions**:
- ✅ **Fixed**: Added `event.preventDefault()` to the file input handler
- ✅ **Fixed**: Added `onClick={(e) => e.preventDefault()}` to the file input
- ✅ **Fixed**: Improved event handling to prevent any form submission

**If the issue persists**:
1. Check browser console for any JavaScript errors
2. Ensure you're using the latest version of the component
3. Try clearing browser cache and cookies
4. Check if any browser extensions are interfering

### 2. Not All Data Being Uploaded from CSV

**Problem**: Only some records from your CSV file are being uploaded, while others are missing.

**Root Causes and Solutions**:

#### A. Empty Rows Being Filtered Out
**Issue**: Empty rows or rows with only whitespace are automatically filtered out.

**Solution**: 
- ✅ **Fixed**: Added better empty row detection
- ✅ **Fixed**: Improved data filtering logic
- The system now properly identifies and processes all non-empty rows

#### B. Validation Errors Blocking Upload
**Issue**: Some records have validation errors that prevent them from being uploaded.

**Solution**:
- ✅ **Fixed**: Added detailed validation error reporting
- ✅ **Fixed**: Improved validation logic to be more flexible
- Check the "Validation Errors" section in the upload interface
- Fix any validation errors in your CSV file before re-uploading

#### C. Column Header Mismatches
**Issue**: Column headers in your CSV don't match the expected format.

**Expected Headers**:
```
First Name, Last Name, Date of Birth, Gender, Place of Birth, Nationality, Email, Address, City, Region, Subsystem, Branch, Class, Parent Name, Parent Email, Parent Phone, Relationship, Emergency Contact Name, Emergency Contact Phone
```

**Solution**:
- Use the "Download Template" button to get the correct format
- Ensure column headers match exactly (case-sensitive)
- Check for extra spaces or special characters in headers

#### D. Data Format Issues
**Issue**: Data in certain columns doesn't match expected formats.

**Required Formats**:
- **Date of Birth**: YYYY-MM-DD (e.g., 2008-05-15)
- **Gender**: male/female (case-insensitive)
- **Subsystem**: english/french (case-insensitive)
- **Branch**: grammar/technical/commercial (case-insensitive)
- **Relationship**: father/mother/guardian/other (case-insensitive)
- **Email**: Valid email format (e.g., user@domain.com)

### 3. Debugging Your Upload

**New Feature**: Added debug information to help troubleshoot issues.

**How to Use**:
1. Upload your file
2. Look for the "Show Debug Info" button at the bottom of the upload dialog
3. Click it to see detailed information about:
   - Number of records parsed
   - Validation errors
   - Upload results
   - Sample of parsed data

**What to Check**:
- **Parsed Records**: Should match the number of rows in your CSV (minus header)
- **Validation Errors**: Shows exactly which rows and fields have issues
- **Parsed Data Sample**: Shows how your data is being interpreted

### 4. Testing Your CSV File

**Use the Test File**: 
- Download `test-students.csv` from the project root
- This file contains 3 sample records with correct formatting
- Use it to test the upload functionality

**Test File Contents**:
```csv
First Name,Last Name,Date of Birth,Gender,Place of Birth,Nationality,Email,Address,City,Region,Subsystem,Branch,Class,Parent Name,Parent Email,Parent Phone,Relationship,Emergency Contact Name,Emergency Contact Phone
John,Doe,2008-05-15,male,Yaounde,Cameroonian,john.doe@example.com,123 Main Street,Yaounde,Centre,english,grammar,Form 1,Jane Doe,jane.doe@example.com,+237612345679,mother,John Doe Sr,+237612345680
Sarah,Smith,2009-03-22,female,Douala,Cameroonian,sarah.smith@example.com,456 Oak Avenue,Douala,Littoral,french,commercial,4ème,Robert Smith,robert.smith@example.com,+237612345682,father,Mary Smith,+237612345683
Michael,Johnson,2007-11-08,male,Bamenda,Cameroonian,michael.johnson@example.com,789 Pine Road,Bamenda,North West,english,technical,Form 2,Lisa Johnson,lisa.johnson@example.com,+237612345685,mother,David Johnson,+237612345686
```

### 5. Step-by-Step Troubleshooting Process

1. **Check File Format**:
   - Ensure your file is saved as CSV (UTF-8 encoding recommended)
   - Verify column headers match exactly
   - Remove any empty rows at the beginning or end

2. **Validate Data**:
   - Check all required fields are filled
   - Verify data formats (dates, emails, etc.)
   - Ensure enumeration values are correct

3. **Use Debug Information**:
   - Upload your file
   - Click "Show Debug Info"
   - Review parsed data and validation errors
   - Fix issues in your CSV file

4. **Test with Small File**:
   - Start with 1-3 records
   - Ensure they upload successfully
   - Gradually add more records

5. **Check Browser Console**:
   - Open browser developer tools (F12)
   - Look for any JavaScript errors
   - Check network tab for failed requests

### 6. Common CSV Format Issues

**Problem**: Extra commas or quotes in data
**Solution**: Ensure data doesn't contain unescaped commas or quotes

**Problem**: Different date formats
**Solution**: Use YYYY-MM-DD format only

**Problem**: Mixed case in enumeration fields
**Solution**: Use lowercase values (male/female, english/french, etc.)

**Problem**: Extra spaces in data
**Solution**: Trim whitespace from all fields

### 7. Getting Help

If you're still experiencing issues:

1. **Check the Debug Info**: Use the debug information to identify specific problems
2. **Review Console Logs**: Check browser console for error messages
3. **Test with Sample File**: Try the provided test CSV file
4. **Check Database Connection**: Ensure your database is properly configured
5. **Contact Support**: Provide the debug information and error messages

### 8. Recent Fixes Applied

✅ **Fixed Page Reloading Issue**:
- Added `event.preventDefault()` to file input handler
- Added click event prevention
- Improved event handling

✅ **Fixed Data Parsing Issues**:
- Added better empty row detection
- Improved CSV parsing with error handling
- Added console logging for debugging

✅ **Fixed Validation Issues**:
- Made validation more flexible
- Added detailed error reporting
- Improved field mapping

✅ **Added Debug Features**:
- Debug information panel
- Console logging throughout the process
- Detailed error reporting

### 9. Performance Tips

- **File Size**: Keep files under 10MB for best performance
- **Record Count**: Process files with up to 1000 records at once
- **Network**: Ensure stable internet connection during upload
- **Browser**: Use modern browsers (Chrome, Firefox, Safari, Edge)

### 10. Best Practices

1. **Always use the template**: Download and use the provided template
2. **Test with small files**: Start with a few records to test
3. **Check data before upload**: Validate your data in Excel/Google Sheets first
4. **Backup your data**: Keep a copy of your original file
5. **Use consistent formatting**: Ensure all data follows the same format
