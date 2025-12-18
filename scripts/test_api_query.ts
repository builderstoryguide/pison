import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const CLASS_ID = '8fe6b8a4-0eba-4e52-8813-32975299b206'; // AC 4

async function testQuery() {
  const output: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    output.push(msg);
  };

  log("=== Testing exact query used in /api/students ===");
  log("");

  // This is the exact query structure from the API
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      classes (
        id,
        class_name,
        subsystem,
        academic_year
      )
    `)
    .eq('status', 'active')
    .eq('class', CLASS_ID)
    .order('first_name', { ascending: true });

  if (error) {
    log("ERROR: " + JSON.stringify(error, null, 2));
  } else {
    log(`SUCCESS: Found ${data?.length || 0} students`);
    if (data && data.length > 0) {
      log("");
      log("First student data:");
      log(JSON.stringify(data[0], null, 2));
    }
  }

  log("");
  log("=== Done ===");

  fs.writeFileSync(path.resolve(__dirname, 'test_api_query_result.txt'), output.join('\n'), 'utf8');
  console.log('\nOutput written to scripts/test_api_query_result.txt');
}

testQuery().catch(console.error);
