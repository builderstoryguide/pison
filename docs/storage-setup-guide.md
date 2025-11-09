# Storage Setup Guide - School Assets

This guide will help you set up the Supabase Storage bucket required for logo uploads and other school assets.

## Overview

The school management application uses Supabase Storage to store:
- School logos
- Other school assets (future use)

The storage bucket `school-assets` must be created and configured with proper policies before logo uploads will work.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Database Access**: Access to your Supabase SQL Editor
3. **Admin Access**: You must be logged in as an admin user

## Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Storage Setup Script

1. Open the file `scripts/2025-11-04_025_setup_school_assets_storage.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** to execute the script

**Expected Output:**
```
✓ school-assets bucket created successfully
✓ Created 4 storage policies for logo access
Storage setup completed successfully!
```

### Step 3: Verify the Setup

After running the script, verify the setup:

1. Go to **Storage** in the Supabase dashboard
2. You should see a bucket named `school-assets`
3. The bucket should be marked as **Public**
4. Click on the bucket to see the `logos/` folder structure

### Step 4: Test Logo Upload

1. Go to your application
2. Navigate to **App Configuration** (Admin panel)
3. Try uploading a logo file
4. The upload should succeed

## Storage Configuration Details

### Bucket Settings

- **Bucket Name**: `school-assets`
- **Public Access**: Enabled (for logo URLs)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, SVG, WebP

### Storage Policies

The setup script creates the following policies:

1. **Public Logo Access**: Anyone can read/view logos
2. **Admin Upload**: Only authenticated admins can upload logos
3. **Admin Update**: Only authenticated admins can update logos
4. **Admin Delete**: Only authenticated admins can delete logos

### Folder Structure

```
school-assets/
  └── logos/
      └── school-logo-{timestamp}.{ext}
```

## Troubleshooting

### Issue: "Storage bucket 'school-assets' does not exist"

**Solution:**
1. Run the setup script: `scripts/2025-11-04_025_setup_school_assets_storage.sql`
2. Verify the bucket appears in Storage dashboard
3. Try uploading again

### Issue: "Permission denied" or "Storage policies not configured"

**Solution:**
1. Check that storage policies exist in Supabase dashboard:
   - Go to **Storage** > **Policies**
   - Look for policies related to `school-assets` bucket
2. If policies are missing, re-run the setup script
3. Verify your user has admin role in the `users` table

### Issue: "File size exceeds limit"

**Solution:**
- The maximum file size is 5MB
- Compress or resize your logo image
- Use image optimization tools before uploading

### Issue: "Invalid file type"

**Solution:**
- Only these formats are allowed: JPEG, JPG, PNG, SVG, WebP
- Convert your image to one of these formats
- Ensure the file extension matches the actual file type

### Issue: Upload works but logo doesn't display

**Solution:**
1. Check that the bucket is set to **Public**
2. Verify the logo URL is accessible
3. Check browser console for CORS or loading errors
4. Ensure the URL is saved correctly in app configuration

## Manual Setup (Alternative)

If the SQL script doesn't work, you can set up storage manually:

### 1. Create Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `school-assets`
4. Check **Public bucket**
5. Click **Create bucket**

### 2. Configure Bucket Settings

1. Click on `school-assets` bucket
2. Go to **Settings**
3. Set **File size limit** to 5242880 (5MB)
4. Set **Allowed MIME types** to:
   ```
   image/jpeg,image/jpg,image/png,image/svg+xml,image/webp
   ```

### 3. Create Storage Policies

Go to **Storage** > **Policies** and create these policies:

#### Policy 1: Public Logo Access
```sql
CREATE POLICY "Public logo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-assets' AND (storage.foldername(name))[1] = 'logos');
```

#### Policy 2: Admin Upload
```sql
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
```

#### Policy 3: Admin Update
```sql
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
```

#### Policy 4: Admin Delete
```sql
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
```

## Health Check

You can check the storage health status using the API endpoint:

```bash
GET /api/configuration/storage-health
```

This endpoint returns:
- Bucket existence status
- Access permissions
- Policy configuration status
- Any issues or recommendations

## Security Considerations

1. **Public Access**: Logos are publicly accessible. Don't store sensitive files in this bucket.
2. **Admin Only Upload**: Only users with `admin` role can upload/delete logos.
3. **File Validation**: Both client and server validate file types and sizes.
4. **Unique Filenames**: Files are automatically renamed with timestamps to prevent conflicts.

## Maintenance

### Cleaning Up Old Logos

To remove old logo files:

1. Go to **Storage** > `school-assets` > `logos/`
2. Select old logo files
3. Click **Delete**

Or use the API:
```bash
DELETE /api/configuration/upload-logo-v2?fileName={filename}
```

### Monitoring Storage Usage

1. Go to **Storage** dashboard
2. View bucket size and file count
3. Monitor for unusual activity

## Support

If you continue to experience issues:

1. Check the browser console for error messages
2. Review server logs for detailed error information
3. Use the health check endpoint to diagnose issues
4. Verify all prerequisites are met
5. Contact your system administrator

## Related Files

- Setup Script: `scripts/2025-11-04_025_setup_school_assets_storage.sql`
- API Route: `app/api/configuration/upload-logo-v2/route.ts`
- Health Check: `app/api/configuration/storage-health/route.ts`
- Frontend Component: `components/admin/app-configuration.tsx`

