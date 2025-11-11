import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

// Enhanced error types for better debugging
interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Create standardized error response
const createErrorResponse = (error: ApiError, status: number) => {
  return NextResponse.json({
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
    timestamp: error.timestamp,
  }, { status })
}

// POST - Upload school logo with enhanced error handling
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch (error) {
      return createErrorResponse({
        code: 'FORM_DATA_PARSE_ERROR',
        message: 'Failed to parse form data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const file = formData.get('logo') as File

    if (!file) {
      return createErrorResponse({
        code: 'NO_FILE_PROVIDED',
        message: 'No file provided in request',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse({
        code: 'INVALID_FILE_TYPE',
        message: 'Invalid file type',
        details: { 
          providedType: file.type, 
          allowedTypes,
          fileName: file.name,
          fileSize: file.size
        },
        timestamp: new Date().toISOString()
      }, 400)
    }

    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return createErrorResponse({
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds 5MB limit',
        details: { 
          fileSize: file.size, 
          maxSize,
          fileName: file.name
        },
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Validate storage bucket exists
    try {
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets()
      
      if (bucketListError) {
        console.error('Error listing buckets:', bucketListError)
        return createErrorResponse({
          code: 'BUCKET_LIST_ERROR',
          message: 'Failed to access storage buckets',
          details: bucketListError.message,
          timestamp: new Date().toISOString()
        }, 500)
      }

      const schoolAssetsBucket = buckets?.find(bucket => bucket.id === 'school-assets' || bucket.name === 'school-assets')
      
      if (!schoolAssetsBucket) {
        return createErrorResponse({
          code: 'BUCKET_NOT_FOUND',
          message: 'Storage bucket "school-assets" does not exist',
          details: {
            availableBuckets: buckets?.map(b => b.name) || [],
            setupInstructions: 'Please run the storage setup script: scripts/2025-11-04_025_setup_school_assets_storage.sql'
          },
          timestamp: new Date().toISOString()
        }, 500)
      }

      // Verify bucket is accessible
      const { error: testError } = await supabase.storage
        .from('school-assets')
        .list('logos', { limit: 1 })

      if (testError && !testError.message.includes('not found')) {
        // If error is not about folder not existing, it might be a permission issue
        console.warn('Bucket access test warning:', testError)
      }
    } catch (bucketCheckError) {
      console.error('Bucket validation failed:', bucketCheckError)
      return createErrorResponse({
        code: 'BUCKET_VALIDATION_FAILED',
        message: 'Failed to validate storage bucket',
        details: bucketCheckError instanceof Error ? bucketCheckError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `school-logo-${timestamp}.${fileExtension}`
    const filePath = `logos/${fileName}`

    // Upload to Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to upload file to storage'
        let errorCode = 'STORAGE_UPLOAD_ERROR'
        
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          errorMessage = 'Storage bucket not found. Please run the setup script.'
          errorCode = 'BUCKET_NOT_FOUND'
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please check storage policies are configured correctly.'
          errorCode = 'STORAGE_PERMISSION_ERROR'
        } else if (uploadError.message?.includes('size') || uploadError.message?.includes('limit')) {
          errorMessage = 'File size exceeds storage limit.'
          errorCode = 'FILE_SIZE_LIMIT_EXCEEDED'
        } else if (uploadError.message?.includes('duplicate') || uploadError.message?.includes('already exists')) {
          errorMessage = 'File with this name already exists. Please try again.'
          errorCode = 'FILE_ALREADY_EXISTS'
        }
        
        return createErrorResponse({
          code: errorCode,
          message: errorMessage,
          details: {
            originalError: uploadError.message,
            filePath,
            fileName
          },
          timestamp: new Date().toISOString()
        }, 500)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath)

      const logoUrl = urlData.publicUrl

      // Log successful upload
      console.log('Logo uploaded successfully:', {
        fileName,
        filePath,
        logoUrl,
        uploadedBy: user.id,
        uploadTime: Date.now() - startTime
      })

      return NextResponse.json({
        success: true,
        message: 'Logo uploaded successfully',
        logoUrl,
        fileName,
        filePath,
        uploadedBy: user.id,
        uploadTime: Date.now() - startTime
      })

    } catch (storageError) {
      console.error('Storage operation failed:', storageError)
      return createErrorResponse({
        code: 'STORAGE_OPERATION_FAILED',
        message: 'Storage operation failed',
        details: storageError instanceof Error ? storageError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }

  } catch (error) {
    // If error is a NextResponse (from auth functions), return it directly
    if (error instanceof NextResponse) {
      return error
    }
    
    console.error('Unexpected error in POST /api/configuration/upload-logo-v2:', error)
    
    return createErrorResponse({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred during logo upload',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
}

// DELETE - Remove school logo
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    void await requireRole(request, 'admin')

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from('school-assets')
      .remove([`logos/${fileName}`])

    if (error) {
      console.error('Storage deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Logo deleted successfully' })

  } catch (error) {
    // If error is a NextResponse (from auth functions), return it directly
    if (error instanceof NextResponse) {
      return error
    }
    
    console.error('Unexpected error in DELETE /api/configuration/upload-logo-v2:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
