"use client"

import React, { useState } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { AppConfigurationProvider, useAppConfiguration, useConfigurationStatus } from "@/lib/app-configuration-context-v2"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  WifiOff, 
  Settings,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react"

function TestBulletproofConfigContent() {
  const { 
    configuration, 
    isLoading, 
    error, 
    isOnline, 
    lastFetched, 
    updateConfiguration, 
    refreshConfiguration, 
    clearError 
  } = useAppConfiguration()
  
  const status = useConfigurationStatus()
  const [testResults, setTestResults] = useState<any[]>([])

  const runTests = async () => {
    const tests = []
    
    // Test 1: Basic Configuration Load
    tests.push({
      name: "Configuration Load",
      status: configuration ? "pass" : "fail",
      details: configuration ? "Configuration loaded successfully" : "Configuration failed to load"
    })

    // Test 2: Network Status
    tests.push({
      name: "Network Status",
      status: isOnline ? "pass" : "warning",
      details: isOnline ? "Online" : "Offline - using cached data"
    })

    // Test 3: Error Handling
    tests.push({
      name: "Error Handling",
      status: error ? "warning" : "pass",
      details: error ? `Error present: ${error}` : "No errors detected"
    })

    // Test 4: Configuration Update
    try {
      const testUpdate = await updateConfiguration({
        school_motto: `Test update at ${new Date().toLocaleTimeString()}`
      })
      tests.push({
        name: "Configuration Update",
        status: testUpdate ? "pass" : "warning",
        details: testUpdate ? "Update successful" : "Update failed - using local storage"
      })
    } catch (err) {
      tests.push({
        name: "Configuration Update",
        status: "fail",
        details: `Update failed: ${err}`
      })
    }

    // Test 5: Refresh Functionality
    try {
      await refreshConfiguration()
      tests.push({
        name: "Refresh Functionality",
        status: "pass",
        details: "Refresh completed successfully"
      })
    } catch (err) {
      tests.push({
        name: "Refresh Functionality",
        status: "fail",
        details: `Refresh failed: ${err}`
      })
    }

    setTestResults(tests)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "fail":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulletproof Configuration Test</h1>
          <p className="text-muted-foreground">
            Testing the ultra-optimized configuration system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline">V2 System</Badge>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Real-time status of the configuration system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(status.status)}>
                {status.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading:</span>
              <Badge variant="outline">
                {isLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Network:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {lastFetched && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Last Fetched:</span>
              <span className="text-sm text-muted-foreground">
                {lastFetched.toLocaleString()}
              </span>
            </div>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={clearError}>
                    Clear Error
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Data */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            The configuration data currently being used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">School Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {configuration.school_name}</div>
                <div><strong>Address:</strong> {configuration.school_address || "Not set"}</div>
                <div><strong>Phone:</strong> {configuration.school_phone || "Not set"}</div>
                <div><strong>Email:</strong> {configuration.school_email || "Not set"}</div>
                <div><strong>Website:</strong> {configuration.school_website || "Not set"}</div>
                <div><strong>Motto:</strong> {configuration.school_motto || "Not set"}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">System Settings</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Academic Year:</strong> {configuration.academic_year}</div>
                <div><strong>Currency:</strong> {configuration.currency}</div>
                <div><strong>Timezone:</strong> {configuration.timezone}</div>
                <div><strong>Language:</strong> {configuration.language}</div>
                <div><strong>Date Format:</strong> {configuration.date_format}</div>
                <div><strong>Time Format:</strong> {configuration.time_format}</div>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h4 className="font-semibold mb-3">Theme Colors</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: configuration.primary_color }}
                />
                <span className="text-sm">Primary: {configuration.primary_color}</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: configuration.secondary_color }}
                />
                <span className="text-sm">Secondary: {configuration.secondary_color}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Tests</span>
            <Button onClick={runTests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Run Tests
            </Button>
          </CardTitle>
          <CardDescription>
            Comprehensive tests of the configuration system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Click "Run Tests" to test the configuration system</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted-foreground">{test.details}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fallback Strategy Info */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Strategy</CardTitle>
          <CardDescription>
            How the system handles failures gracefully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">1</div>
              <div>
                <div className="font-medium">In-Memory Cache</div>
                <div className="text-sm text-muted-foreground">5-minute TTL for fast access</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">2</div>
              <div>
                <div className="font-medium">Database (Supabase)</div>
                <div className="text-sm text-muted-foreground">Primary source with retry logic</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 font-semibold">3</div>
              <div>
                <div className="font-medium">LocalStorage</div>
                <div className="text-sm text-muted-foreground">Browser storage backup</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-semibold">4</div>
              <div>
                <div className="font-medium">Environment Variables</div>
                <div className="text-sm text-muted-foreground">Build-time configuration</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold">5</div>
              <div>
                <div className="font-medium">Hardcoded Defaults</div>
                <div className="text-sm text-muted-foreground">Always works as last resort</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestBulletproofConfigPage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <TestBulletproofConfigContent />
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
