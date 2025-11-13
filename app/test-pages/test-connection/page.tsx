'use client'

import { useEffect, useState } from 'react'
import { testDatabaseConnection, getConnectionStatus } from '@/lib/connection-test'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, Database, Key, Globe } from 'lucide-react'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)

  useEffect(() => {
    setConnectionStatus(getConnectionStatus())
  }, [])

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const result = await testDatabaseConnection()
      setTestResult(result)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult(false)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-muted-foreground">
          Test your Supabase database connection and verify your setup
        </p>
      </div>

      <div className="grid gap-6">
        {/* Environment Variables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Check if your Supabase credentials are properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Project URL</span>
                  </div>
                  <Badge variant={connectionStatus.url === 'Set' ? 'default' : 'destructive'}>
                    {connectionStatus.url}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span>Anon Key</span>
                  </div>
                  <Badge variant={connectionStatus.key === 'Set' ? 'default' : 'destructive'}>
                    {connectionStatus.key}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Overall Status</span>
                  </div>
                  <Badge variant={connectionStatus.isAvailable ? 'default' : 'destructive'}>
                    {connectionStatus.isAvailable ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Test
            </CardTitle>
            <CardDescription>
              Test the actual database connection and verify tables exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={isTesting || !connectionStatus?.isAvailable}
                className="w-full"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>

              {testResult !== null && (
                <Alert variant={testResult ? 'default' : 'destructive'}>
                  {testResult ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {testResult 
                      ? 'Connection successful! Your database is properly configured.'
                      : 'Connection failed. Check the console for detailed error messages.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {connectionStatus?.isAvailable === false && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Setup Instructions
              </CardTitle>
              <CardDescription>
                Follow these steps to connect your app to Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">1. Create a .env.local file</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create a file named <code>.env.local</code> in your project root directory
                  </p>
                  <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here`}
                  </pre>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">2. Get your Supabase credentials</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
                    <li>• Create a new project or select an existing one</li>
                    <li>• Go to Settings → API</li>
                    <li>• Copy the Project URL and anon public key</li>
                    <li>• Replace the placeholder values in your .env.local file</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">3. Set up your database</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Go to your Supabase dashboard</li>
                    <li>• Navigate to SQL Editor</li>
                    <li>• Copy and paste the contents of <code>scripts/create-tables.sql</code></li>
                    <li>• Execute the script to create all required tables</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">4. Restart your development server</h4>
                  <p className="text-sm text-muted-foreground">
                    After setting up the environment variables, restart your Next.js development server:
                  </p>
                  <pre className="bg-background p-3 rounded text-sm mt-2">
{`npm run dev
# or
yarn dev
# or
pnpm dev`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
