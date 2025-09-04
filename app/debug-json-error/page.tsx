"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AlertTriangle, CheckCircle, XCircle, Play, RefreshCcw } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api-utils'

interface TestResult {
  testName: string
  success: boolean
  error?: string
  details?: any
  responseText?: string
  timestamp: string
}

export default function DebugJsonErrorPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addTestResult = (testName: string, success: boolean, error?: string, details?: any, responseText?: string) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      error,
      details,
      responseText,
      timestamp: new Date().toISOString()
    }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runComprehensiveTest = async () => {
    setIsRunning(true)
    setTestResults([])

    console.log('🔍 Starting JSON Parse Error Debugging...')

    // Test 1: Basic API endpoint connectivity
    try {
      console.log('1️⃣ Testing basic API endpoint...')
      const result = await apiGet('/api/auth/login')
      
      if (result.success) {
        addTestResult('API Endpoint Basic Test', true, undefined, result.data)
      } else {
        addTestResult('API Endpoint Basic Test', false, result.error, result, result.responseText)
      }
    } catch (error) {
      addTestResult('API Endpoint Basic Test', false, error instanceof Error ? error.message : String(error))
    }

    // Test 2: POST with valid data structure
    try {
      console.log('2️⃣ Testing POST with valid data...')
      const result = await apiPost('/api/auth/login', {
        identifier: 'test@example.com',
        password: 'testpassword',
        role: 'admin'
      })
      
      addTestResult('POST Valid Data Test', result.success, result.error, result.data, result.responseText)
    } catch (error) {
      addTestResult('POST Valid Data Test', false, error instanceof Error ? error.message : String(error))
    }

    // Test 3: POST with invalid/missing data
    try {
      console.log('3️⃣ Testing POST with invalid data...')
      const result = await apiPost('/api/auth/login', {})
      
      addTestResult('POST Invalid Data Test', !result.success, result.error, result.data, result.responseText)
    } catch (error) {
      addTestResult('POST Invalid Data Test', false, error instanceof Error ? error.message : String(error))
    }

    // Test 4: Test known good endpoints
    const endpointsToTest = [
      '/api/users/test',
      '/api/timetable/classes',
      '/api/activity-logs',
    ]

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`4️⃣ Testing endpoint: ${endpoint}`)
        const result = await apiGet(endpoint)
        
        addTestResult(`Endpoint ${endpoint}`, result.success, result.error, result.data, result.responseText)
      } catch (error) {
        addTestResult(`Endpoint ${endpoint}`, false, error instanceof Error ? error.message : String(error))
      }
    }

    // Test 5: Legacy fetch for comparison
    try {
      console.log('5️⃣ Testing legacy fetch method...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'test@example.com',
          password: 'test',
          role: 'admin'
        })
      })
      
      const responseText = await response.text()
      console.log('Legacy response text:', responseText.slice(0, 200))
      
      let data
      try {
        data = JSON.parse(responseText)
        addTestResult('Legacy Fetch JSON Parse', true, undefined, data, responseText)
      } catch (parseError) {
        addTestResult('Legacy Fetch JSON Parse', false, 
          `JSON Parse Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          { status: response.status, responseText: responseText.slice(0, 500) },
          responseText
        )
      }
    } catch (error) {
      addTestResult('Legacy Fetch', false, error instanceof Error ? error.message : String(error))
    }

    // Test 6: Environment check
    try {
      console.log('6️⃣ Testing environment configuration...')
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      
      addTestResult('Environment Variables', hasSupabaseUrl && hasServiceKey, 
        hasSupabaseUrl && hasServiceKey ? undefined : 'Missing required environment variables',
        {
          NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl ? 'Set' : 'Missing',
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? 'Set' : 'Missing'
        }
      )
    } catch (error) {
      addTestResult('Environment Variables', false, error instanceof Error ? error.message : String(error))
    }

    setIsRunning(false)
    console.log('✅ JSON Parse Error Debugging Complete')
  }

  const getTestIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const isJsonParseError = (error?: string) => {
    if (!error) return false
    return error.toLowerCase().includes('json') || error.toLowerCase().includes('parse')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">JSON Parse Error Debugger</h1>
        <p className="text-muted-foreground">
          Comprehensive testing to identify and debug JSON parsing errors in API calls
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={runComprehensiveTest} disabled={isRunning}>
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
        </Button>
        <Button variant="outline" onClick={clearResults}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Clear Results
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Results</h2>
          
          <div className="grid gap-3">
            {testResults.map((result, index) => (
              <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getTestIcon(result.success)}
                      {result.testName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? 'PASS' : 'FAIL'}
                      </Badge>
                      {isJsonParseError(result.error) && (
                        <Badge variant="destructive">JSON Parse Error</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                
                {!result.success && result.error && (
                  <CardContent className="pt-0">
                    <Alert className={isJsonParseError(result.error) ? 'border-red-200' : ''}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="font-mono text-sm">
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                )}

                {(result.details || result.responseText) && (
                  <CardContent className="pt-0">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Show Details
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        {result.responseText && (
                          <div className="mb-3">
                            <h4 className="font-semibold text-sm mb-1">Response Text:</h4>
                            <div className="bg-muted p-3 rounded text-xs max-h-32 overflow-auto">
                              <pre className="whitespace-pre-wrap">
                                {result.responseText.slice(0, 1000)}
                                {result.responseText.length > 1000 && '\n... (truncated)'}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {result.details && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Details:</h4>
                            <div className="bg-muted p-3 rounded text-xs max-h-32 overflow-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Use This Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Run Comprehensive Test:</strong> Tests various API endpoints and scenarios</p>
          <p><strong>2. Look for JSON Parse Errors:</strong> These will be highlighted in red badges</p>
          <p><strong>3. Check Response Text:</strong> Expand details to see what the server actually returned</p>
          <p><strong>4. Network Tab:</strong> Also check your browser's Network tab (F12) during tests</p>
          <p><strong>5. Server Logs:</strong> Check your development server console for any errors</p>
        </CardContent>
      </Card>
    </div>
  )
}
