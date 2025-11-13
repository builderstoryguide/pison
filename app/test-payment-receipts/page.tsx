"use client"

// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

import { PaymentRecording } from '@/components/bursar/payment-recording'
import { AppConfigurationProvider } from '@/lib/app-configuration-context-v2'
import { FinancialProvider } from '@/lib/financial-context'
import { AuthProvider } from '@/lib/auth-context'

export default function TestPaymentReceiptsPage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <FinancialProvider>
          <div className="container mx-auto py-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Payment Receipts Test Page</h1>
              <p className="text-muted-foreground">
                Test the enhanced payment recording component with receipt viewing capabilities
              </p>
            </div>
            
            <PaymentRecording />
          </div>
        </FinancialProvider>
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
