# Manual Storage Bucket Setup Guide

Since the automated storage setup requires admin privileges, follow these steps to manually create the storage bucket:

## Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **Storage** section in the left sidebar

## Step 2: Create Storage Bucket
1. Click **"Create a new bucket"**
2. Enter the following details:
   - **Name**: `assignments`
   - **Public bucket**: ✅ Check this option
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: 
     - `application/pdf`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/msword`

## Step 3: Configure Bucket Policies
1. Click on the `assignments` bucket
2. Go to the **Policies** tab
3. Add the following policies:

### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assignments');
```

### Policy 2: Allow authenticated users to view files
```sql
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'assignments');
```

### Policy 3: Allow users to update their own files
```sql
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Policy 4: Allow users to delete their own files
```sql
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 4: Test the Setup
1. Try creating an assignment with a file attachment
2. The file should upload successfully
3. Check the Storage section to see the uploaded file

## Alternative: Disable File Upload Temporarily
If you want to test assignment creation without file uploads, you can:
1. Comment out the file upload section in the form
2. Or modify the code to skip file uploads when storage is not available

The improved error handling will now allow assignment creation even if file upload fails.
