#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Script to run the student fees sync migration
 * This creates the trigger to sync payment records with student fees
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
    console.log("🚀 Starting student fees sync migration...");
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Read the SQL file
    const sqlFilePath = join(
      __dirname,
      "2025-12-08_sync_student_fees.sql"
    );
    const sql = readFileSync(sqlFilePath, "utf8");

    console.log("📄 SQL file loaded successfully");
    console.log(`📏 SQL file size: ${sql.length} characters`);

    // Execute the SQL
    console.log("⚙️  Executing SQL migration...");

    // Basic split for PL/PGSQL functions which use $$ delimiters
    // This is a naive parser but should work for this specific file if we send the whole block or explicit splits
    // The previous script split by ';' which breaks function definitions.
    // For this specific file containing functions and triggers, we should try to execute the whole thing 
    // or split carefully.
    // Supabase's exec_sql often handles multiple statements if they are valid.
    // However, the safest way for functions is often to execute the whole block if the RPC supports it.
    // If not, we might need to split by special comments or just try sending the whole file content.
    
    // Let's try sending the whole content first.
    console.log("Executing full SQL script...");
    
    const { error } = await supabase.rpc("exec_sql", {
        sql_query: sql,
    });

    if (error) {
        console.log("⚠️  RPC method failed, trying direct execution via REST...");
         // For table creation and other DDL, we need to use the REST API directly
         const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ sql_query: sql }),
          });

          if (!response.ok) {
            const text = await response.text();
             console.error("❌ Migration failed via REST:", text);
             throw new Error(text);
          }
    }

    console.log("✅ Migration executed successfully");
    console.log("\n🎉 Triggers and functions created!");
    console.log("Student fees should now be synchronized.");

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(
      "\n📋 Please run the SQL script manually in Supabase SQL Editor:"
    );
    console.error(`   File: scripts/2025-12-08_sync_student_fees.sql`);
    process.exit(1);
  }
}

// Run the migration
runMigration();
