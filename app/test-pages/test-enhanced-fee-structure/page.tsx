"use client"

export const dynamic = 'force-dynamic'

import { EnhancedFeeStructureManagement } from "@/components/admin/enhanced-fee-structure-management"

export default function TestEnhancedFeeStructurePage() {
  return (
    <div className="container mx-auto py-6">
      <EnhancedFeeStructureManagement />
    </div>
  )
}
