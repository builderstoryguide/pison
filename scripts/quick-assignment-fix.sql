-- =====================================================
-- Quick Assignment Fix Script
-- =====================================================
-- Run this script to temporarily fix RLS and permission issues
-- WARNING: This disables security for testing - re-enable in production

-- Disable RLS temporarily for testing
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users (for testing)
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON assignment_submissions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments',
    'assignments',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- Grant storage permissions (without modifying storage.objects table)
GRANT ALL ON storage.buckets TO authenticated;

-- Verify the fix
SELECT 'RLS disabled on assignments table' as status WHERE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'assignments' 
    AND rowsecurity = false
);

SELECT 'Storage bucket exists' as status WHERE EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'assignments'
);

-- IMPORTANT: Remember to re-enable RLS in production with proper policies
-- Run this when ready for production:
/*
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
*/
