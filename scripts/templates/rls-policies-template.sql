-- RLS Policies Template
-- Use this template when creating RLS policies for a new table
-- Replace 'table_name' with your actual table name

-- Enable RLS on the table
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

-- SELECT policy (read access)
DO $$ BEGIN
  CREATE POLICY table_name_select_all ON public.table_name FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT policy (create access)
-- Note: WITH CHECK (true) allows any row to be inserted
-- Tighten this based on your security requirements
DO $$ BEGIN
  CREATE POLICY table_name_insert_all ON public.table_name FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE policy (modify access)
-- Note: USING (true) allows any row to be updated, WITH CHECK (true) allows any values
-- Tighten this based on your security requirements
DO $$ BEGIN
  CREATE POLICY table_name_update_all ON public.table_name FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DELETE policy (remove access)
-- Note: USING (true) allows any row to be deleted
-- Tighten this based on your security requirements
DO $$ BEGIN
  CREATE POLICY table_name_delete_all ON public.table_name FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Example: Tightened policies for role-based access
-- Uncomment and modify as needed:
-- DO $$ BEGIN
--   CREATE POLICY table_name_select_admin ON public.table_name FOR SELECT 
--     USING (auth.role() = 'admin');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Example: User-specific access (if table has user_id column)
-- DO $$ BEGIN
--   CREATE POLICY table_name_select_own ON public.table_name FOR SELECT 
--     USING (auth.uid() = user_id);
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

