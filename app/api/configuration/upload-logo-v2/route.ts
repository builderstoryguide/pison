import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Enhanced authentication check
    let user = null
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        return createErrorResponse({
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          details: authError.message,
          timestamp: new Date().toISOString()
        }, 401)
      }
      user = authUser
    } catch (error) {
      console.error('Auth check failed:', error)
      return createErrorResponse({
        code: 'AUTH_CHECK_FAILED',
        message: 'Authentication check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 401)
    }

    if (!user) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Enhanced admin check
    let userProfile = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        return createErrorResponse({
          code: 'PROFILE_FETCH_ERROR',
          message: 'Failed to fetch user profile',
          details: profileError.message,
          timestamp: new Date().toISOString()
        }, 500)
      }

      userProfile = profile
    } catch (error) {
      console.error('Profile check failed:', error)
      return createErrorResponse({
        code: 'PROFILE_CHECK_FAILED',
        message: 'Profile check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }

    if (!userProfile || userProfile.role !== 'admin') {
      return createErrorResponse({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin role required for logo upload',
        details: { userRole: userProfile?.role || 'none', userId: user.id },
        timestamp: new Date().toISOString()
      }, 403)
    }

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

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `school-logo-${timestamp}.${fileExtension}`
    const filePath = `logos/${fileName}`

    // Upload to Supabase Storage
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return createErrorResponse({
          code: 'STORAGE_UPLOAD_ERROR',
          message: 'Failed to upload file to storage',
          details: uploadError.message,
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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

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
    console.error('Unexpected error in DELETE /api/configuration/upload-logo-v2:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
