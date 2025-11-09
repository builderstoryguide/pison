# Database Migration Scripts

This directory contains SQL migration scripts for the school management application database. Scripts are named with timestamps to ensure proper execution order.

## Migration Order

Execute the scripts in the following order (by filename):

1. `2025-11-04_001_core_users.sql` - Core users table and authentication (includes user_details view)
2. `2025-11-04_002_academics_people.sql` - Students, parents, teachers tables
3. `2025-11-04_003_classes_subjects.sql` - Classes, subjects, and teacher assignments
4. `2025-11-04_004_assessments_grades.sql` - Assessments and grades
5. `2025-11-04_005_timetable.sql` - Timetable structures
6. `2025-11-04_006_app_configuration.sql` - Application configuration
7. `2025-11-04_007_shared_helpers.sql` - Shared helper functions
8. `2025-11-04_008_seed_admin_user.sql` - Seed admin user
9. `2025-11-04_009_fk_classes_teacher.sql` - **IMPORTANT**: Fixes foreign key relationship for classes.class_teacher_id, adds RLS policies, and creates v_classes view
10. `2025-11-04_010_examinations.sql` - Examinations and exam results tables
11. `2025-11-04_011_subjects_sub_branches.sql` - Subject management with sub-branches
12. `2025-11-04_012_add_classes_columns.sql` - **IMPORTANT**: Adds missing columns (academic_year, capacity, status, etc.) and RLS policies for classes table
13. `2025-11-04_013_add_classes_sync_triggers.sql` - **IMPORTANT**: Adds synchronization triggers to keep old and new columns in sync

## Applying Migrations

### Local Development (Supabase CLI)

If using Supabase CLI for local development:

```bash
# Reset database and apply all migrations
supabase db reset

# Or apply migrations incrementally
supabase db push
```

### Production/Deployed Environment

For deployed Supabase instances:

1. **Via Supabase Dashboard SQL Editor:**
   - Navigate to SQL Editor in your Supabase project dashboard
   - Copy and paste each script in order
   - Execute each script one at a time
   - Verify success before proceeding to the next script

2. **Via Supabase CLI (if configured):**
   ```bash
   supabase db push --db-url "your-production-db-url"
   ```

3. **Via CI/CD Pipeline:**
   - Configure your CI/CD to run migrations in order
   - Ensure idempotent scripts (they can be run multiple times safely)

## Important Notes

### Script 009 - Foreign Key Fix

The script `2025-11-04_009_fk_classes_teacher.sql` is critical as it:
- Adds the missing foreign key relationship between `classes.class_teacher_id` and `teachers.id`
- Creates the `v_classes` view for easier querying
- Enables Row Level Security (RLS) with permissive policies for read operations
- Seeds a default teacher if none exists

**This script must be run after all other schema scripts to resolve the relationship error.**

### Script 010 - Examinations

The script `2025-11-04_010_examinations.sql` creates:
- `examinations` table for storing examination information
- `exam_results` table for storing individual student results
- Required indexes and RLS policies
- Triggers for updated_at timestamps

This script enables the examination management feature in the application.

### Script 012 - Classes Table Columns and RLS Policies

The script `2025-11-04_012_add_classes_columns.sql` is critical as it:
- Adds missing columns to `classes` table: `academic_year`, `capacity`, `status`, `class_name`, `class_level`, `stream`, `current_enrollment`
- Recreates the `v_classes` view with proper column mappings
- **Adds missing RLS policies**: INSERT, UPDATE, DELETE policies for classes table
- Fixes the "violates row-level security policy" error when creating classes

**This script must be run to fix class creation functionality.**

### Script 013 - Classes Table Synchronization Triggers

The script `2025-11-04_013_add_classes_sync_triggers.sql` is critical as it:
- Creates database triggers to automatically sync old and new columns during migration
- Ensures `name` ↔ `class_name`, `level` ↔ `class_level`, `section` ↔ `stream`, `student_count` ↔ `current_enrollment` stay synchronized
- Prevents "null value in column 'name' violates not-null constraint" errors
- Provides backward compatibility during schema migration

**This script must be run after script 012 to ensure column synchronization.**

### RLS Policies

All scripts use idempotent patterns (DO $$ BEGIN ... EXCEPTION ... END $$) so they can be safely re-run. 

**IMPORTANT: Complete RLS Policy Pattern**

When creating a new table with RLS enabled, you MUST add policies for all operations:
- SELECT (read)
- INSERT (create)
- UPDATE (modify)
- DELETE (remove)

#### Standard RLS Policy Template

For any table `table_name`, use this pattern:

```sql
-- Enable RLS
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

-- SELECT policy
DO $$ BEGIN
  CREATE POLICY table_name_select_all ON public.table_name FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT policy
DO $$ BEGIN
  CREATE POLICY table_name_insert_all ON public.table_name FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE policy
DO $$ BEGIN
  CREATE POLICY table_name_update_all ON public.table_name FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DELETE policy
DO $$ BEGIN
  CREATE POLICY table_name_delete_all ON public.table_name FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

#### Why All Policies Are Needed

- **Client-side code uses anon key**: The application uses `lib/supabase.ts` which uses the anon key, not the service role
- **Service role bypasses RLS**: API routes using service role bypass RLS, but client-side code doesn't
- **Missing policies cause errors**: Without INSERT/UPDATE/DELETE policies, operations fail with "violates row-level security policy"

#### Security Note

These policies are permissive (allow all operations) for initial setup. You should tighten these policies based on your security requirements:

### Column Synchronization During Migration

When adding new columns to replace old ones (e.g., `class_name` replacing `name`), you need to ensure both columns stay synchronized during the migration period. This is critical because:

1. **Old columns may have NOT NULL constraints**: The old `name` column has a NOT NULL constraint, so it must always have a value
2. **Client code may use either column**: During migration, some code may still reference old columns
3. **Database triggers provide automatic sync**: Triggers ensure data consistency without requiring code changes

#### Migration Pattern for Column Renames

When renaming columns, follow this pattern:

1. **Add new columns** alongside old ones (allow NULL initially)
2. **Create synchronization triggers** to keep both columns in sync
3. **Update application code** to use both columns (INSERT/UPDATE operations)
4. **Migrate existing data** to populate new columns
5. **Update views and queries** to use new columns
6. **Remove old columns** only after all code is updated

Example from `2025-11-04_013_add_classes_sync_triggers.sql`:
```sql
-- Trigger syncs old columns from new columns on INSERT
CREATE OR REPLACE FUNCTION public.sync_classes_columns_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.class_name;
  END IF;
  -- ... more sync logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Application Code Pattern

When writing INSERT/UPDATE operations during migration, always populate both old and new columns:

```typescript
// INSERT example
.insert({
  // New columns (preferred)
  class_name: classData.name,
  class_level: classData.level,
  // Old columns (for backward compatibility)
  name: classData.name,
  level: classData.level,
})

// UPDATE example
.update({
  class_name: classData.name,
  name: classData.name, // Keep old column in sync
})
```

#### Security Note

These policies are permissive (allow all operations) for initial setup. You should tighten these policies based on your security requirements:
- Add role-based checks (e.g., `auth.role() = 'admin'`)
- Add user-based checks (e.g., `auth.uid() = user_id`)
- Add time-based or status-based conditions as needed

### View: v_classes

The `v_classes` view provides a flattened view of classes with teacher information, making it easier for PostgREST to query without nested relationships. The frontend code has been updated to use this view when available, with fallback to the base `classes` table.

## Troubleshooting

### Error: "Could not find a relationship between 'classes' and 'class_teacher_id'"

This error occurs when the foreign key constraint is missing. Run script `2025-11-04_009_fk_classes_teacher.sql` to fix it.

### Error: "relation does not exist"

Ensure all previous migration scripts have been run in order. Check the Supabase dashboard logs for specific table/relation names.

### Error: Empty error objects `{}`

This was caused by missing error serialization. The codebase now includes `lib/safe-error.ts` which properly serializes Supabase errors. Ensure your API routes and context loaders use this utility.

### Error: "Could not find the table 'public.user_details' in the schema cache"

This error occurs when the `user_details` view is missing. Ensure you've run script `2025-11-04_001_core_users.sql` which creates this view. The view joins `users` and `user_profiles` tables.

### Error: "Error loading examinations: {}"

This error occurs when the `examinations` table is missing. Run script `2025-11-04_010_examinations.sql` to create the examinations and exam_results tables.

### Error: "null value in column 'name' violates not-null constraint"

This error occurs when creating a class during migration if only new columns (`class_name`) are populated but old columns (`name`) are not. This happens because:

1. The old `name` column has a NOT NULL constraint
2. Application code only populates new columns
3. Database triggers haven't been created to sync columns

**Solution**: 
- Run script `2025-11-04_013_add_classes_sync_triggers.sql` to create synchronization triggers
- Ensure application code (INSERT/UPDATE operations) populates both old and new columns during migration
- See the "Column Synchronization During Migration" section above for details

### Error: "new row violates row-level security policy for table 'classes'"

This error occurs when trying to create, update, or delete a class without proper RLS policies. This happens because:

1. RLS is enabled on the `classes` table
2. Only SELECT policy exists (from script 009)
3. INSERT/UPDATE/DELETE policies are missing

**Solution**: Run script `2025-11-04_012_add_classes_columns.sql` which adds the missing RLS policies. See the "RLS Policies" section above for details.

## Verification

After applying migrations, verify the setup:

1. Check database connection: Visit `/api/diagnostics/supabase` or `/_debug/db`
2. Verify classes load: Check that classes can be loaded without relationship errors
3. Verify RLS: Ensure authenticated users can read from tables with RLS enabled

## Next Steps

After applying all migrations:
1. Review and tighten RLS policies based on your security model
2. Add role-specific helper functions in `2025-11-04_007_shared_helpers.sql` if needed
3. Update seed data scripts if you need additional demo data
