import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to find all page.tsx files in test directories
function findTestPages(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestPages(filePath, fileList);
    } else if (file === 'page.tsx' && (dir.includes('test-') || dir.includes('\\test-'))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all test page files
const allTestPages = findTestPages('app');

console.log(`Found ${allTestPages.length} test pages to fix\n`);

let fixedCount = 0;
let skippedCount = 0;

allTestPages.forEach((filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if already has the dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`⏭️  Skipped (already has dynamic export): ${filePath}`);
      skippedCount++;
      return;
    }
    
    // Find the position after "use client" or at the start if no "use client"
    let newContent;
    if (content.includes('"use client"') || content.includes("'use client'")) {
      // Add after "use client" and imports
      const lines = content.split('\n');
      let insertIndex = 0;
      let inMultiLineImport = false;
      
      // Find the last import statement or "use client"
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        
        // Check if we're starting a multi-line import
        if (trimmed.startsWith('import ') && trimmed.includes('{') && !trimmed.includes('}')) {
          inMultiLineImport = true;
          insertIndex = i + 1;
        }
        // Check if we're ending a multi-line import
        else if (inMultiLineImport && trimmed.includes('}')) {
          inMultiLineImport = false;
          insertIndex = i + 1;
        }
        // Regular single-line import or in multi-line import
        else if (inMultiLineImport) {
          insertIndex = i + 1;
        }
        else if (trimmed.startsWith('import ') || 
                 lines[i].includes('"use client"') || 
                 lines[i].includes("'use client'")) {
          insertIndex = i + 1;
        } 
        else if (insertIndex > 0 && trimmed === '') {
          // Skip empty lines after imports
          insertIndex = i + 1;
        } 
        else if (insertIndex > 0 && !inMultiLineImport) {
          // Found the first non-import, non-empty line and not in multi-line import
          break;
        }
      }
      
      // Insert the dynamic export
      lines.splice(insertIndex, 0, '', '// Force dynamic rendering to skip static generation during build', 'export const dynamic = \'force-dynamic\'', '');
      newContent = lines.join('\n');
    } else {
      // No "use client", add at the top
      newContent = '// Force dynamic rendering to skip static generation during build\nexport const dynamic = \'force-dynamic\'\n\n' + content;
    }
    
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    fixedCount++;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log(`\n✨ Done! Fixed ${fixedCount} pages, skipped ${skippedCount} pages.`);

