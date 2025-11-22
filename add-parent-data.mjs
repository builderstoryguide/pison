/* eslint-env node */
/**
 * Simple script to add parent data functionality to the teacher assignments API
 * Run with: node add-parent-data.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const filePath = './app/api/teachers/[id]/assignments/route.ts'

// Read the file
let content = readFileSync(filePath, 'utf-8')

// 1. Add import statement
const importLine = "import { serializeSupabaseError } from '@/lib/safe-error'"
const newImport = `import { serializeSupabaseError } from '@/lib/safe-error'
import { fetchParentsForStudents, getParentInfoForStudent, calculateParentCoverage } from '@/lib/utils/parent-data-fetcher'`

content = content.replace(importLine, newImport)

// 2. Add parent fetching after student query results log
const studentLogLine = 'console.log(`Student query results: ${studentsByClassId.length} by class ID, ${studentsByClassName.length} by class name, ${allActiveStudents.length} total active, ${classStudentsJunction.length} from junction table`)'

const parentFetchCode = `console.log(\`Student query results: \${studentsByClassId.length} by class ID, \${studentsByClassName.length} by class name, \${allActiveStudents.length} total active, \${classStudentsJunction.length} from junction table\`)

    // Batch fetch parents for all students using utility function
    const studentIds = allActiveStudents
      .map(s => s.student_id)
      .filter(Boolean)
    
    const parentsByStudentId = await fetchParentsForStudents(supabase, studentIds)`

content = content.replace(studentLogLine, parentFetchCode)

// 3. Replace parent data in student transformation


// This is tricky - let's find and replace the whole student return block
const studentReturnStart = 'return {\r\n          id: student.id,'
const studentReturnEnd = 'parentEmail: undefined,'

// Find the position
const startIdx = content.indexOf(studentReturnStart)
if (startIdx === -1) {
  console.error('Could not find student return block start')
  process.exit(1)
}

const endIdx = content.indexOf(studentReturnEnd, startIdx) + studentReturnEnd.length
if (endIdx === studentReturnEnd.length - 1) {
  console.error('Could not find student return block end')
  process.exit(1)
}

const oldBlock = content.substring(startIdx, endIdx)
const newBlock = `const parentInfo = getParentInfoForStudent(student.student_id, parentsByStudentId)

        return {
          id: student.id,
          studentId: student.student_id || '',
          firstName: student.first_name || '',
          lastName: student.last_name || '',
          email: student.email || '',
          phone: student.phone || undefined,
          // photo column doesn't exist in students table, so we don't include it
          enrollmentStatus,
          parentName: parentInfo.parentName,
          parentPhone: parentInfo.parentPhone,
          parentEmail: parentInfo.parentEmail,`

content = content.replace(oldBlock, newBlock)

// 4. Add parent coverage logging
const enrollmentLogEnd = 'transferred: transferredCount\r\n      })'

const newEnrollmentLogEnd = `transferred: transferredCount
      })

      // Log parent data coverage
      const parentCoverage = calculateParentCoverage(students)
      console.log(\`👪 Parent data summary for class \${cls.name}:\`, parentCoverage)`

content = content.replace(enrollmentLogEnd, newEnrollmentLogEnd)

// Write the file back
writeFileSync(filePath, content, 'utf-8')

console.log('✅ Successfully added parent data functionality!')
console.log('Please review the changes and test the API endpoint.')
