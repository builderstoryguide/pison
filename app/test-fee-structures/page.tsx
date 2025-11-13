"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestFeeStructuresPage() {
  const { toast } = useToast()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testFeeStructuresAPI = async () => {
    setIsLoading(true)
    setError(null)
    setApiResponse(null)

    try {
      const response = await fetch('/api/bursar/fee-structures')
      const data = await response.json()
      
      console.log('Raw API Response:', data)
      console.log('Response type:', typeof data)
      console.log('Is Array:', Array.isArray(data))
      console.log('Response keys:', data ? Object.keys(data) : 'No data')
      
      setApiResponse(data)
      
      if (data.error) {
        setError(data.error)
        toast.error(data.error)
      } else if (Array.isArray(data)) {
        toast.success(`Successfully loaded ${data.length} fee structures`)
      } else {
        setError('Unexpected data format received')
        toast.error('Invalid data format received')
      }
    } catch (error) {
      console.error('API Test Error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to test API')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Fee Structures API Test</h1>
        <p className="text-muted-foreground">
          Test the fee structures API to debug data loading issues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
          <CardDescription>
            Click the button below to test the fee structures API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testFeeStructuresAPI} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing API...' : 'Test Fee Structures API'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {apiResponse && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
            <CardDescription>
              Raw response from the fee structures API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
