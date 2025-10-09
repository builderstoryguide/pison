"use client"

import React, { useState, useEffect } from 'react'
import { Shield, User as UserIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { useUserManagement, User } from '@/lib/user-management-context'
import { AccessRightsDialog } from '@/components/admin/access-rights-dialog'

export default function TestAccessRightsPage() {
  const { users, getAvailablePermissions, isLoading, error } = useUserManagement()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAccessRightsDialog, setShowAccessRightsDialog] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string[]>>({})
  const [testResults, setTestResults] = useState<{
    apiTest: 'pending' | 'success' | 'error'
    permissionsTest: 'pending' | 'success' | 'error'
    uiTest: 'pending' | 'success' | 'error'
  }>({
    apiTest: 'pending',
    permissionsTest: 'pending',
    uiTest: 'pending'
  })

  // Test API endpoint
  const testAPIEndpoint = async () => {
    try {
      const response = await fetch('/api/users/access-rights?role=teacher')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setTestResults(prev => ({ ...prev, apiTest: 'success' }))
        return true
      } else {
        setTestResults(prev => ({ ...prev, apiTest: 'error' }))
        return false
      }
    } catch (error) {
      console.error('API test failed:', error)
      setTestResults(prev => ({ ...prev, apiTest: 'error' }))
      return false
    }
  }

  // Test permissions loading
  const testPermissionsLoading = async () => {
    try {
      const roles = ['admin', 'teacher', 'student', 'parent', 'bursar']
      const permissions: Record<string, string[]> = {}
      
      for (const role of roles) {
        const rolePermissions = await getAvailablePermissions(role)
        permissions[role] = rolePermissions
      }
      
      setAvailablePermissions(permissions)
      setTestResults(prev => ({ ...prev, permissionsTest: 'success' }))
      return true
    } catch (error) {
      console.error('Permissions test failed:', error)
      setTestResults(prev => ({ ...prev, permissionsTest: 'error' }))
      return false
    }
  }

  // Test UI functionality
  const testUIFunctionality = () => {
    if (users.length > 0) {
      setSelectedUser(users[0])
      setShowAccessRightsDialog(true)
      setTestResults(prev => ({ ...prev, uiTest: 'success' }))
      return true
    } else {
      setTestResults(prev => ({ ...prev, uiTest: 'error' }))
      return false
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setTestResults({
      apiTest: 'pending',
      permissionsTest: 'pending',
      uiTest: 'pending'
    })

    await testAPIEndpoint()
    await testPermissionsLoading()
    testUIFunctionality()
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getTestIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getTestColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Access Rights Management Test</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This page tests the access rights management functionality. It verifies API endpoints, 
          permission loading, and UI components.
        </AlertDescription>
      </Alert>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Status of various functionality tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.apiTest)}
                <span className="font-medium">API Endpoint Test</span>
              </div>
              <Badge variant={testResults.apiTest === 'success' ? 'default' : testResults.apiTest === 'error' ? 'destructive' : 'secondary'}>
                {testResults.apiTest}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.permissionsTest)}
                <span className="font-medium">Permissions Loading Test</span>
              </div>
              <Badge variant={testResults.permissionsTest === 'success' ? 'default' : testResults.permissionsTest === 'error' ? 'destructive' : 'secondary'}>
                {testResults.permissionsTest}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.uiTest)}
                <span className="font-medium">UI Component Test</span>
              </div>
              <Badge variant={testResults.uiTest === 'success' ? 'default' : testResults.uiTest === 'error' ? 'destructive' : 'secondary'}>
                {testResults.uiTest}
              </Badge>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <Button onClick={runAllTests} className="w-full">
            Run All Tests Again
          </Button>
        </CardContent>
      </Card>

      {/* Available Permissions by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Available Permissions by Role</CardTitle>
          <CardDescription>Permissions that can be assigned to each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(availablePermissions).map(([role, permissions]) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-4 w-4" />
                  <span className="font-medium capitalize">{role}</span>
                  <Badge variant="outline">{permissions.length} permissions</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {permissions.map(permission => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Test Users</CardTitle>
          <CardDescription>Click on a user to test access rights management</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No users found. Create some users first to test access rights management.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowAccessRightsDialog(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Test Access Rights
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Rights Dialog */}
      {selectedUser && (
        <AccessRightsDialog
          user={selectedUser}
          open={showAccessRightsDialog}
          onOpenChange={setShowAccessRightsDialog}
        />
      )}
    </div>
  )
}
