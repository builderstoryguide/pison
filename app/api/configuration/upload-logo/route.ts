import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

// POST - Upload school logo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `school-logo-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(`logos/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('school-assets')
      .getPublicUrl(`logos/${fileName}`)

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logoUrl: urlData.publicUrl,
      fileName: fileName
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/configuration/upload-logo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete school logo
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('school-assets')
      .remove([`logos/${fileName}`])

    if (deleteError) {
      console.error('Error deleting logo:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete logo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Logo deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/configuration/upload-logo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
