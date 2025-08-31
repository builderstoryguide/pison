-- =====================================================
-- Storage Permissions Fix (Admin Only)
-- =====================================================
-- This script requires admin privileges to run
-- Run this if you have admin access to fix storage permissions

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments',
    'assignments',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- Grant storage permissions (requires admin privileges)
GRANT ALL ON storage.buckets TO authenticated;

-- If you have admin access, you can also run this:
-- GRANT ALL ON storage.objects TO authenticated;

-- Verify storage bucket exists
SELECT 'Storage bucket created successfully' as status WHERE EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'assignments'
);
