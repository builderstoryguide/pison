"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinancial, FinancialProvider } from "@/lib/financial-context"
import { usePDFExport } from "@/hooks/use-pdf-export"
import { Bug, FileText, AlertCircle } from "lucide-react"

function TestPDFDebugContent() {
  const { payments, feeStructures, studentFeeAssignments } = useFinancial()
  const { isGenerating, exportPaymentReport } = usePDFExport()
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [lastError, setLastError] = useState<string>("")

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearDebugInfo = () => {
    setDebugInfo([])
    setLastError("")
  }

  const testAPIEndpoint = async () => {
    addDebugInfo("Testing API endpoint...")
    try {
      const response = await fetch('/api/financial-reports', { method: 'GET' })
      
      if (!response.ok) {
        const errorText = await response.text()
        const errorMsg = `HTTP ${response.status}: ${errorText}`
        addDebugInfo(`API endpoint test failed: ${errorMsg}`)
        setLastError(errorMsg)
        return
      }
      
      const data = await response.json()
      addDebugInfo(`API endpoint test successful: ${JSON.stringify(data)}`)
      setLastError('') // Clear previous errors on success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addDebugInfo(`API endpoint test failed: ${errorMsg}`)
      setLastError(errorMsg)
    }
  }

  const testPaymentReport = async () => {
    addDebugInfo("Testing payment report generation...")
    addDebugInfo(`Available payments: ${payments.length}`)
    
    if (payments.length === 0) {
      addDebugInfo("No payments available for testing")
      setLastError("No payment data available")
      return
    }

    try {
      const success = await exportPaymentReport(payments)
      if (success) {
        addDebugInfo("Payment report generated successfully")
      } else {
        addDebugInfo("Payment report generation failed")
        setLastError("Report generation returned false")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addDebugInfo(`Payment report test failed: ${errorMsg}`)
      setLastError(errorMsg)
    }
  }

  const testDirectAPI = async () => {
    addDebugInfo("Testing direct API call...")
    
    if (payments.length === 0) {
      addDebugInfo("No payments available for testing")
      return
    }

    try {
      const response = await fetch('/api/financial-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: 'payment-report',
          data: { payments: payments.slice(0, 5) }, // Test with first 5 payments
          options: {}
        }),
      })

      addDebugInfo(`API response status: ${response.status}`)
      addDebugInfo(`API response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

      if (!response.ok) {
        const errorData = await response.json()
        addDebugInfo(`API error: ${JSON.stringify(errorData)}`)
        setLastError(errorData.error || errorData.details || 'API call failed')
      } else {
        const blob = await response.blob()
        addDebugInfo(`API success - blob size: ${blob.size} bytes`)
        addDebugInfo(`Content type: ${blob.type}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addDebugInfo(`Direct API test failed: ${errorMsg}`)
      setLastError(errorMsg)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Generation Debug Page</h1>
        <p className="text-muted-foreground">
          Debug and test PDF generation functionality
        </p>
      </div>

      {/* Data Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for testing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Structures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStructures.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for testing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentFeeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for testing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Tests
            </CardTitle>
            <CardDescription>
              Run diagnostic tests to identify issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testAPIEndpoint}
              variant="outline"
              className="w-full"
            >
              Test API Endpoint
            </Button>
            
            <Button 
              onClick={testDirectAPI}
              variant="outline"
              className="w-full"
            >
              Test Direct API Call
            </Button>
            
            <Button 
              onClick={testPaymentReport}
              variant="outline"
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? "Testing..." : "Test Payment Report"}
            </Button>
            
            <Button 
              onClick={clearDebugInfo}
              variant="outline"
              className="w-full"
            >
              Clear Debug Info
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Last Error
            </CardTitle>
            <CardDescription>
              Most recent error information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm font-medium">Error:</p>
                <p className="text-red-700 text-sm mt-1">{lastError}</p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">No errors detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Log */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Log</CardTitle>
          <CardDescription>
            Detailed logging information from tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500 text-sm">No debug information yet. Run some tests to see logs.</p>
            ) : (
              <div className="space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {info}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Payment Data</CardTitle>
            <CardDescription>
              First payment record for reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(payments[0], null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Check Data Availability</h4>
              <p className="text-sm text-muted-foreground">
                Ensure you have payment data in the system. The tests require at least one payment record.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Test API Endpoint</h4>
              <p className="text-sm text-muted-foreground">
                Click "Test API Endpoint" to verify the API route is accessible and responding correctly.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Test Direct API Call</h4>
              <p className="text-sm text-muted-foreground">
                This tests the actual PDF generation without using the React hook, helping isolate client vs server issues.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Check Console Logs</h4>
              <p className="text-sm text-muted-foreground">
                Open browser developer tools and check the console for additional error information.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">5. Server Logs</h4>
              <p className="text-sm text-muted-foreground">
                Check your Next.js server logs for detailed error information from the API route.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestPDFDebugPage() {
  return (
    <FinancialProvider>
      <TestPDFDebugContent />
    </FinancialProvider>
  )
}
