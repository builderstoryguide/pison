const fs = require('fs');
const path = require('path');

// List of API routes that need to be updated
const apiRoutes = [
  'app/api/bursar/reports/revenue/route.ts',
  'app/api/bursar/reports/outstanding/route.ts',
  'app/api/bursar/reports/collection/route.ts',
  'app/api/bursar/payments/[id]/route.ts',
  'app/api/bursar/payments/route.ts',
  'app/api/bursar/payment-methods/route.ts',
  'app/api/bursar/fee-structures/[id]/route.ts',
  'app/api/bursar/fee-structures/route.ts',
  'app/api/bursar/fee-categories/route.ts'
];

function updateFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace all instances of "const supabase = createClient()" with "const supabase = await createClient()"
    const updatedContent = content.replace(
      /const supabase = createClient\(\)/g,
      'const supabase = await createClient()'
    );

    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing Supabase client calls in API routes...\n');

apiRoutes.forEach(updateFile);

console.log('\n✅ All API routes have been updated!');
console.log('\n📝 Summary of changes:');
console.log('- Made createClient() calls async with await');
console.log('- This fixes the Next.js 15 cookies() requirement');
console.log('- All API routes should now work without the async cookies error');
