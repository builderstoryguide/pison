"use client"

import { PaymentRecording } from '@/components/bursar/payment-recording'

export default function TestPaymentReceiptsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Payment Receipts Test Page</h1>
        <p className="text-muted-foreground">
          Test the enhanced payment recording component with receipt viewing capabilities
        </p>
      </div>
      
      <PaymentRecording />
    </div>
  )
}
