"use client"

import { AuthProvider } from "@/lib/auth-context"
import { AppConfigurationProvider } from '@/lib/app-configuration-context-v2'
import { EnhancedFeeStructureManagement } from "@/components/admin/enhanced-fee-structure-management"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestEnhancedFeeStructurePage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <div className="container mx-auto py-6">
          <EnhancedFeeStructureManagement />
        </div>
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
