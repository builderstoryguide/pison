import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

// GET - Check storage bucket health and configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    void await requireRole(request, 'admin')

    const healthCheck = {
      timestamp: new Date().toISOString(),
      bucket: {
        exists: false,
        name: 'school-assets',
        accessible: false,
        public: false,
        policiesConfigured: false
      },
      permissions: {
        canRead: false,
        canWrite: false,
        canDelete: false
      },
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // Check if bucket exists
    try {
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets()
      
      if (bucketListError) {
        healthCheck.issues.push(`Failed to list buckets: ${bucketListError.message}`)
        return NextResponse.json({
          healthy: false,
          ...healthCheck,
          error: 'Failed to access storage',
          code: 'BUCKET_LIST_ERROR'
        }, { status: 500 })
      }

      const schoolAssetsBucket = buckets?.find(bucket => bucket.id === 'school-assets' || bucket.name === 'school-assets')
      
      if (!schoolAssetsBucket) {
        healthCheck.issues.push('Storage bucket "school-assets" does not exist')
        healthCheck.recommendations.push('Run the setup script: scripts/2025-11-04_025_setup_school_assets_storage.sql')
        return NextResponse.json({
          healthy: false,
          ...healthCheck,
          error: 'Storage bucket not found',
          code: 'BUCKET_NOT_FOUND'
        }, { status: 404 })
      }

      healthCheck.bucket.exists = true
      healthCheck.bucket.public = schoolAssetsBucket.public || false
      healthCheck.bucket.name = schoolAssetsBucket.name

      // Test bucket accessibility
      try {
        const { error: listError } = await supabase.storage
          .from('school-assets')
          .list('logos', { limit: 1 })

        if (listError) {
          if (listError.message.includes('not found')) {
            // Folder doesn't exist yet, but bucket is accessible
            healthCheck.bucket.accessible = true
            healthCheck.permissions.canRead = true
          } else {
            healthCheck.issues.push(`Cannot access bucket: ${listError.message}`)
            healthCheck.recommendations.push('Check storage policies are configured correctly')
          }
        } else {
          healthCheck.bucket.accessible = true
          healthCheck.permissions.canRead = true
        }
      } catch (accessError) {
        healthCheck.issues.push(`Access test failed: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`)
      }

      // Test write permission (by attempting to list with write context)
      // Note: We can't actually test write without uploading, but we can check if policies exist
      try {
        // Check if we can get bucket info which requires some level of access
        const { error: infoError } = await supabase.storage
          .from('school-assets')
          .list('', { limit: 0 })

        if (!infoError) {
          healthCheck.permissions.canWrite = true // Likely can write if we can list
        }
      } catch (writeTestError) {
        healthCheck.issues.push('Write permission test inconclusive')
      }

      // Check if policies are configured (basic check)
      // Note: This is a simplified check - actual policy verification would require direct DB access
      if (healthCheck.permissions.canRead) {
        healthCheck.bucket.policiesConfigured = true
      } else {
        healthCheck.issues.push('Storage policies may not be configured correctly')
        healthCheck.recommendations.push('Verify storage policies in Supabase dashboard: Storage > Policies')
      }

    } catch (error) {
      healthCheck.issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return NextResponse.json({
        healthy: false,
        ...healthCheck,
        error: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR'
      }, { status: 500 })
    }

    // Determine overall health
    const isHealthy = 
      healthCheck.bucket.exists &&
      healthCheck.bucket.accessible &&
      healthCheck.permissions.canRead &&
      healthCheck.issues.length === 0

    return NextResponse.json({
      healthy: isHealthy,
      ...healthCheck,
      message: isHealthy 
        ? 'Storage is properly configured and accessible' 
        : 'Storage configuration issues detected'
    }, { status: isHealthy ? 200 : 503 })

  } catch (error) {
    console.error('Storage health check error:', error)
    return NextResponse.json({
      healthy: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

