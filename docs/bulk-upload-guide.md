# Bulk Student Upload Guide

## Overview

The bulk upload feature allows administrators to enroll multiple students at once by uploading Excel (.xls, .xlsx) or CSV files containing student information.

## Features

- **File Format Support**: Excel (.xls, .xlsx) and CSV files
- **Data Validation**: Comprehensive validation of all required fields
- **Error Reporting**: Detailed error messages for invalid data
- **Progress Tracking**: Real-time progress during upload
- **Template Download**: Pre-formatted template with correct column headers
- **Preview Functionality**: Review data before processing

## How to Use

### 1. Access the Bulk Upload Feature

1. Navigate to **Student Management** in the admin dashboard
2. Click the **"Bulk Upload"** button in the header
3. The bulk upload dialog will open

### 2. Download Template (Recommended)

1. Click **"Download Template"** to get a pre-formatted Excel file
2. The template contains all required columns with sample data
3. Use this template as a starting point for your data

### 3. Prepare Your Data

#### Required Fields

The following fields are **required** and must be included in your file:

| Column Header | Description | Format/Options |
|---------------|-------------|----------------|
| First Name | Student's first name | Text |
| Last Name | Student's last name | Text |
| Date of Birth | Student's birth date | YYYY-MM-DD |
| Gender | Student's gender | male/female |
| Place of Birth | City/town of birth | Text |
| Nationality | Student's nationality | Text |
| Email | Student's email address | Valid email format |
| Address | Student's address | Text |
| City | Student's city | Text |
| Region | Student's region | Text |
| Subsystem | Education subsystem | english/french |
| Branch | Academic branch | grammar/technical/commercial |
| Class | Student's class | Text (e.g., "Form 1", "4ème") |
| Parent Name | Parent/guardian name | Text |
| Parent Email | Parent's email address | Valid email format |
| Parent Phone | Parent's phone number | Text |
| Relationship | Relationship to student | father/mother/guardian/other |
| Emergency Contact Name | Emergency contact name | Text |
| Emergency Contact Phone | Emergency contact phone | Text |

#### Optional Fields

| Column Header | Description |
|---------------|-------------|
| Middle Name | Student's middle name |
| Religion | Student's religion |
| Phone | Student's phone number |
| Previous School | Previous school attended |
| Previous Class | Previous class level |
| Parent Address | Parent's address |
| Parent Occupation | Parent's occupation |
| Emergency Contact Relationship | Relationship to emergency contact |
| Medical Conditions | Any medical conditions |
| Allergies | Any allergies |
| Blood Group | Student's blood group |

### 4. Upload Your File

1. Click **"Choose File"** or drag and drop your file
2. Supported formats: `.xls`, `.xlsx`, `.csv`
3. The system will automatically parse and validate your data

### 5. Review and Validate

1. Check the **"Data Validation"** tab for any errors
2. Review the validation summary:
   - Number of records parsed
   - Number of validation errors
3. Click **"Preview Data"** to see the first 10 records
4. Fix any validation errors in your file and re-upload

### 6. Process Upload

1. Once validation passes, click **"Proceed with Upload"**
2. Monitor the progress bar during processing
3. Review the final results:
   - Number of successful enrollments
   - Number of failed enrollments
   - Total records processed

## File Format Examples

### Excel Template Structure

```
| First Name | Last Name | Date of Birth | Gender | Email | ... |
|------------|-----------|---------------|--------|-------|-----|
| John       | Doe       | 2008-05-15    | male   | john@example.com | ... |
| Sarah      | Smith     | 2009-03-22    | female | sarah@example.com | ... |
```

### CSV Template Structure

```csv
First Name,Last Name,Date of Birth,Gender,Email,...
John,Doe,2008-05-15,male,john@example.com,...
Sarah,Smith,2009-03-22,female,sarah@example.com,...
```

## Validation Rules

### Email Validation
- Must be a valid email format (e.g., `user@domain.com`)
- Cannot be empty

### Date Validation
- Date of Birth must be in YYYY-MM-DD format
- Must be a valid date

### Enumeration Validation
- **Gender**: Must be `male` or `female`
- **Subsystem**: Must be `english` or `french`
- **Branch**: Must be `grammar`, `technical`, or `commercial`
- **Relationship**: Must be `father`, `mother`, `guardian`, or `other`

### Required Field Validation
- All required fields must have values
- Empty cells or whitespace-only values are not allowed

## Error Handling

### Common Validation Errors

1. **Missing Required Fields**
   - Error: "firstName is required"
   - Solution: Ensure all required columns are present and filled

2. **Invalid Email Format**
   - Error: "Invalid email format"
   - Solution: Check email addresses for proper format

3. **Invalid Enumeration Values**
   - Error: "Subsystem must be 'english' or 'french'"
   - Solution: Use only the allowed values for enumeration fields

4. **Empty Values**
   - Error: "firstName is required"
   - Solution: Remove empty rows or fill in missing data

### Processing Errors

- **Database Connection Issues**: Ensure database is properly configured
- **Duplicate Student IDs**: System automatically generates unique IDs
- **Parent Code Generation**: System automatically generates unique parent codes

## Best Practices

### Data Preparation

1. **Use the Template**: Always start with the provided template
2. **Check Data Types**: Ensure dates are in correct format
3. **Validate Emails**: Verify email addresses are valid
4. **Remove Empty Rows**: Clean your data before uploading
5. **Test with Small Files**: Start with a few records to test the process

### File Management

1. **Backup Your Data**: Keep a copy of your original file
2. **Use Descriptive Names**: Name files clearly (e.g., `students_2024_batch1.xlsx`)
3. **Check File Size**: Large files may take longer to process
4. **Verify Encoding**: For CSV files, ensure proper encoding (UTF-8 recommended)

### Process Management

1. **Review Before Upload**: Always preview your data
2. **Monitor Progress**: Watch the progress bar during processing
3. **Check Results**: Review the final summary
4. **Handle Errors**: Address any failed enrollments individually

## Troubleshooting

### File Won't Upload

- **File Format**: Ensure file is .xls, .xlsx, or .csv
- **File Size**: Check if file is too large
- **File Corruption**: Try opening and resaving the file

### Validation Errors

- **Column Headers**: Ensure headers match exactly (case-sensitive)
- **Data Format**: Check date formats and email addresses
- **Required Fields**: Verify all required columns are present

### Processing Failures

- **Database Issues**: Check database connection
- **Network Problems**: Ensure stable internet connection
- **System Resources**: Close other applications if system is slow

## Support

If you encounter issues with the bulk upload feature:

1. Check this guide for common solutions
2. Verify your data format matches the template
3. Contact system administrator for technical support
4. Review error messages for specific guidance

## Security Notes

- Files are processed locally in your browser
- No files are stored on the server
- Student data is encrypted during transmission
- Access is restricted to administrators only
