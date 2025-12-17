import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Migration script to move sub-branch coefficients to parent subjects
 * 
 * For each subject with sub-branches:
 * - If subject coefficient is NULL or 1.0 (default):
 *   - Calculate average of all sub-branch coefficients for that subject
 *   - Update subject coefficient with the average
 * - Sub-branch coefficients remain in database but will be ignored by code
 */
async function migrateSubBranchCoefficients() {
  console.log('\n' + '='.repeat(60));
  console.log('Migrating Sub-Branch Coefficients to Parent Subjects');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all subjects with sub-branches
    const { data: subjectsWithBranches, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name, coefficient, has_sub_branches')
      .eq('has_sub_branches', true);

    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError);
      return;
    }

    if (!subjectsWithBranches || subjectsWithBranches.length === 0) {
      console.log('ℹ️  No subjects with sub-branches found.');
      return;
    }

    console.log(`Found ${subjectsWithBranches.length} subject(s) with sub-branches\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const subject of subjectsWithBranches) {
      console.log(`\nProcessing: ${subject.name} (ID: ${subject.id})`);
      console.log(`  Current coefficient: ${subject.coefficient || 'NULL'}`);

      // Get all sub-branches for this subject
      const { data: subBranches, error: branchesError } = await supabase
        .from('subject_sub_branches')
        .select('id, name, coefficient')
        .eq('subject_id', subject.id)
        .eq('is_active', true);

      if (branchesError) {
        console.error(`  ❌ Error fetching sub-branches:`, branchesError);
        continue;
      }

      if (!subBranches || subBranches.length === 0) {
        console.log(`  ⚠️  No active sub-branches found, skipping`);
        skippedCount++;
        continue;
      }

      console.log(`  Found ${subBranches.length} active sub-branch(es):`);
      subBranches.forEach(sb => {
        console.log(`    - ${sb.name}: coefficient = ${sb.coefficient}`);
      });

      // Check if subject coefficient needs migration
      const currentCoeff = parseFloat(subject.coefficient) || 0;
      const needsMigration = currentCoeff === 0 || currentCoeff === 1.0;

      if (!needsMigration) {
        console.log(`  ⏭️  Subject already has coefficient ${currentCoeff} (not default), skipping migration`);
        skippedCount++;
        continue;
      }

      // Calculate average of sub-branch coefficients
      const coefficients = subBranches
        .map(sb => parseFloat(sb.coefficient) || 1.0)
        .filter(coef => coef > 0);

      if (coefficients.length === 0) {
        console.log(`  ⚠️  No valid coefficients found in sub-branches, using default 1.0`);
        skippedCount++;
        continue;
      }

      const averageCoefficient = coefficients.reduce((sum, coef) => sum + coef, 0) / coefficients.length;
      const roundedCoefficient = parseFloat(averageCoefficient.toFixed(2));

      console.log(`  📊 Average coefficient: ${roundedCoefficient}`);

      // Update subject coefficient
      const { error: updateError } = await supabase
        .from('subjects')
        .update({ coefficient: roundedCoefficient })
        .eq('id', subject.id);

      if (updateError) {
        console.error(`  ❌ Error updating subject coefficient:`, updateError);
        continue;
      }

      console.log(`  ✅ Updated subject coefficient to ${roundedCoefficient}`);
      migratedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Migrated: ${migratedCount} subject(s)`);
    console.log(`⏭️  Skipped: ${skippedCount} subject(s)`);
    console.log(`📊 Total processed: ${subjectsWithBranches.length} subject(s)`);
    console.log('='.repeat(60) + '\n');

    console.log('ℹ️  Note: Sub-branch coefficients remain in the database');
    console.log('    but will be ignored by the application code going forward.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSubBranchCoefficients().catch(console.error);
