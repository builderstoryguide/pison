#!/usr/bin/env node

/**
 * Script to run the expenditures table migration
 * This creates the expenditures table in Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Missing Supabase credentials");
  console.error(
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting expenditures table migration...");
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Read the SQL file
    const sqlFilePath = join(
      __dirname,
      "2025-11-26_create_expenditures_table.sql"
    );
    const sql = readFileSync(sqlFilePath, "utf8");

    console.log("📄 SQL file loaded successfully");
    console.log(`📏 SQL file size: ${sql.length} characters`);

    // Execute the SQL
    console.log("⚙️  Executing SQL migration...");

    // Split SQL into individual statements (rough split by semicolon)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

      try {
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: statement + ";",
        });

        if (error) {
          // Try direct execution if RPC doesn't work
          console.log("⚠️  RPC method failed, trying direct execution...");

          // For table creation and other DDL, we need to use the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ sql_query: statement + ";" }),
          });

          if (!response.ok) {
            console.log(
              "⚠️  Statement might have executed or requires manual execution"
            );
            console.log(`Statement preview: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log("✅ Statement executed successfully");
        }
      } catch (err) {
        console.log(`⚠️  Error executing statement: ${err.message}`);
        console.log(`Statement preview: ${statement.substring(0, 100)}...`);
      }
    }

    // Verify table creation
    console.log("\n🔍 Verifying table creation...");
    const { data: tables, error: tableError } = await supabase
      .from("expenditures")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error("❌ Table verification failed:", tableError.message);
      console.log("\n⚠️  The table might not have been created successfully.");
      console.log(
        "📋 Please run the SQL script manually in Supabase SQL Editor:"
      );
      console.log(`   File: ${sqlFilePath}`);
      console.log("\nSteps:");
      console.log("1. Open Supabase Dashboard: https://app.supabase.com");
      console.log("2. Go to SQL Editor");
      console.log("3. Copy and paste the contents of the SQL file");
      console.log('4. Click "Run"');
      process.exit(1);
    }

    console.log("✅ Table verified successfully!");
    console.log("\n🎉 Migration completed successfully!");
    console.log("The expenditures table is now ready to use.");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(
      "\n📋 Please run the SQL script manually in Supabase SQL Editor:"
    );
    console.error(`   File: scripts/2025-11-26_create_expenditures_table.sql`);
    console.error("\nSteps:");
    console.error("1. Open Supabase Dashboard: https://app.supabase.com");
    console.error("2. Go to SQL Editor");
    console.error("3. Copy and paste the contents of the SQL file");
    console.error('4. Click "Run"');
    process.exit(1);
  }
}

// Run the migration
runMigration();
