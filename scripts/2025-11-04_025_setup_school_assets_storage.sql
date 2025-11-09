-- Setup School Assets Storage Bucket
-- This script creates the storage bucket and policies needed for logo uploads
-- Run this script in your Supabase SQL Editor to set up file storage

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================
-- Create the school-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-assets',
  'school-assets',
  true, -- Public bucket for logo access
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

-- ============================================
-- 2. STORAGE POLICIES
-- ============================================
-- Drop existing policies if they exist, then create new ones
-- This ensures idempotent execution

-- Drop policies if they exist
DROP POLICY IF EXISTS "Public logo access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete logos" ON storage.objects;

-- Policy: Allow public read access to logos
CREATE POLICY "Public logo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-assets' AND (storage.foldername(name))[1] = 'logos');

-- Policy: Allow authenticated admins to upload logos
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-assets' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Allow authenticated admins to update their own uploads
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-assets' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Allow authenticated admins to delete logos
CREATE POLICY "Admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-assets' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- 3. VERIFICATION
-- ============================================
DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'school-assets'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✓ school-assets bucket created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create school-assets bucket';
  END IF;
  
  -- Count storage policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%logo%';
  
  RAISE NOTICE '✓ Created % storage policies for logo access', policy_count;
  
  RAISE NOTICE 'Storage setup completed successfully!';
END $$;

-- ============================================
-- 4. TEST QUERIES (Optional - for verification)
-- ============================================
-- Uncomment these to verify the setup:

-- Check bucket exists
-- SELECT id, name, public, file_size_limit, allowed_mime_types 
-- FROM storage.buckets 
-- WHERE id = 'school-assets';

-- Check policies exist
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects'
-- AND policyname LIKE '%logo%';

