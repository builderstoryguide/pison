# Bulk Marks Import Tool

This tool allows you to import student marks in bulk from a CSV file. It automatically finds students by their names, determines which class they belong to, and inserts their marks.

## Quick Start

### 1. Prepare Your CSV File

Create a CSV file with student names and scores. Use `marks_data_TEMPLATE.csv` as a reference.

**Required columns:**
- `first_name` - Student's first name
- `last_name` - Student's last name  
- `subject` - The subject name (e.g. "Mathematics")
- `first_sequence` - First sequence mark/score (optional)
- `second_sequence` - Second sequence mark/score (optional)

**Example CSV:**
```csv
first_name,last_name,first_sequence,second_sequence
John,Doe,85,88
Jane,Smith,92,90
Michael,Johnson,78,82
Emily,Williams,95,
David,Brown,,85
```

**Note:** You can leave sequence columns empty if marks aren't available yet. The script will skip those entries.

### 2. Configure the Script

Open `bulk_import_marks.js` and update the `CONFIG` section at the top:

```javascript
const CONFIG = {
  csvFilePath: './marks_data.csv',           // Your CSV file path
  // defaultSubjectName: 'Math',             // Optional default if not in CSV
  
  // First Sequence configuration
  firstSequence: {
    sequenceName: 'First Sequence',
    assessmentName: 'Math First Sequence',
    maxScore: 100,
  },
  
  // Second Sequence configuration
  secondSequence: {
    sequenceName: 'Second Sequence',
    assessmentName: 'Math Second Sequence',
    maxScore: 100,
  },
  
  academicYear: '2024/2025',                 // Academic year
};
```

### 3. Run the Script

```bash
node scripts/bulk_import_marks.js
```

## What the Script Does

1. ✅ Reads your CSV file
2. ✅ Finds the subject in the database
3. ✅ Processes BOTH sequences (First and Second) in one run
4. ✅ Creates assessments if they don't exist (or uses existing ones)
5. ✅ For each student and each sequence:
   - Finds the student by name
   - Automatically detects which class they belong to
   - Inserts or updates their marks for both sequences
6. ✅ Provides a detailed summary report for both sequences

## Features

- **Flexible Name Matching** - Matches students even if names are swapped (e.g. "John Doe" matches "Doe John") or partial
- **Processes both sequences at once** - Import First AND Second Sequence marks in a single run
- **Supports Multiple Subjects** - Import marks for different subjects in the same CSV file
- **Auto-detects student classes** - No need to specify which class each student is in
- **Works across multiple classes** - If your CSV has students from different classes, it handles them all
- **Creates assessments automatically** - If the assessment doesn't exist, it creates it
- **Updates existing marks** - If a student already has a mark for this assessment, it updates it
- **Skips empty scores** - If a sequence column is empty, it skips that entry gracefully
- **Detailed reporting** - Shows exactly what was inserted, updated, skipped, or failed for each sequence
- **Error handling** - Reports students not found or any errors

## Example Output

```
═══════════════════════════════════════════════════════════
              BULK MARKS IMPORT TOOL                       
═══════════════════════════════════════════════════════════

Configuration:
  CSV File: ./marks_data.csv
  Subject: Construction process and Building practice (CPB)
  First Sequence: CPB First Sequence (Max: 100)
  Second Sequence: CPB Second Sequence (Max: 100)

Step 1: Reading CSV file...
✓ Found 15 records in CSV

Step 2: Finding subject...
✓ Subject: Construction process and Building practice (CPB) (Code: 5200)

═══════════════════════════════════════════════════════════
  PROCESSING FIRST SEQUENCE
═══════════════════════════════════════════════════════════

Finding First Sequence...
✓ Sequence: First Sequence

Setting up assessment...
✓ Created new assessment: CPB First Sequence (ID: abc-123)

Processing student marks...
─────────────────────────────────────────────────────────

✓ INSERTED: John Doe (Form 1 BC) - 85/100
✓ INSERTED: Jane Smith (Form 1 BC) - 92/100
✓ INSERTED: Michael Johnson (Form 2 BC) - 78/100

═══════════════════════════════════════════════════════════
  PROCESSING SECOND SEQUENCE
═══════════════════════════════════════════════════════════

Finding Second Sequence...
✓ Sequence: Second Sequence

Setting up assessment...
✓ Created new assessment: CPB Second Sequence (ID: def-456)

Processing student marks...
─────────────────────────────────────────────────────────

✓ INSERTED: John Doe (Form 1 BC) - 88/100
✓ INSERTED: Jane Smith (Form 1 BC) - 90/100
✓ INSERTED: Michael Johnson (Form 2 BC) - 82/100

═══════════════════════════════════════════════════════════
                   FINAL SUMMARY                           
═══════════════════════════════════════════════════════════

Total records in CSV: 15

FIRST SEQUENCE:
  ✓ Successfully inserted: 14
  ✓ Successfully updated: 0
  ⊘ Skipped (no score): 1
  ❌ Students not found: 0
  ❌ Failed to insert: 0

SECOND SEQUENCE:
  ✓ Successfully inserted: 14
  ✓ Successfully updated: 0
  ⊘ Skipped (no score): 1
  ❌ Students not found: 0
  ❌ Failed to insert: 0

═══════════════════════════════════════════════════════════
```

## Troubleshooting

### Student not found
- Check that the first and last names match exactly as they appear in the database
- Names are case-insensitive
- Make sure there are no extra spaces

### Subject/Sequence not found
- Check that you've specified the exact name as it appears in the database
- You can use partial names, the script will search for matches

### Failed to insert
- Check that the score is a valid number
- Make sure the score doesn't exceed the max_score

## Tips

- **Test with a small file first** - Try with 2-3 students to make sure everything works
- **Keep backups** - Always keep a copy of your original CSV file
- **Run multiple times safely** - If you run the script twice with the same data, it will update existing marks instead of creating duplicates
- **Check the output** - Always review the summary to ensure all marks were inserted correctly

## CSV Format Variations

The script accepts different column name variations:
- First name: `first_name`, `firstname`, or `first name`
- Last name: `last_name`, `lastname`, or `last name`
- First sequence: `first_sequence` or `first sequence`
- Second sequence: `second_sequence` or `second sequence`
