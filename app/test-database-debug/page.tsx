"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Database, Activity } from 'lucide-react'

export default function TestDatabaseDebugPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDatabaseTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResults(null)

    try {
      const response = await fetch('/api/test-database')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Test failed')
      }

      setTestResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const testActivityLogs = async (endpoint: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/activity-logs/${endpoint}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to test ${endpoint}`)
      }

      setTestResults({
        success: true,
        endpoint,
        message: `Successfully tested ${endpoint}`,
        data: data
      })
    } catch (err) {
      setError(`${endpoint}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Database Debug Test</h1>
        <p className="text-muted-foreground">
          This page helps debug database connectivity and table issues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDatabaseTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Database Connection'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Logs API Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => testActivityLogs('simple')} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test Simple API
            </Button>
            <Button 
              onClick={() => testActivityLogs('optimized')} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test Optimized API
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Run Database Test</strong> - Check if tables and functions exist</p>
          <p>2. <strong>Test Simple API</strong> - Test basic activity logs without database functions</p>
          <p>3. <strong>Test Optimized API</strong> - Test with database optimization functions</p>
          <p>4. <strong>Check Results</strong> - Look for specific error messages</p>
          <p className="text-muted-foreground">
            If you see table or function errors, you may need to run the database setup scripts in Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
