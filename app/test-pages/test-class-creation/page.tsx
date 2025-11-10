"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { ClassManagementProvider, useClassManagement } from "@/lib/class-management-context"
import { ClassCreationForm } from "@/components/admin/class-creation-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { School, Database, AlertCircle, CheckCircle } from "lucide-react"

function TestClassCreation() {
  const { 
    classes, 
    isLoading, 
    error, 
    isUsingDatabase, 
    testDatabaseConnection,
    refreshClasses 
  } = useClassManagement()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    classId?: string
  } | null>(null)

  const handleCreateSuccess = (result: { classId: string; classData: any }) => {
    setTestResult({
      success: true,
      message: `Class "${result.classData.name}" created successfully with ID: ${result.classId}`,
      classId: result.classId
    })
    setShowCreateForm(false)
  }

  const handleTestConnection = async () => {
    const connected = await testDatabaseConnection()
    setTestResult({
      success: connected,
      message: connected 
        ? "Database connection successful! You can create classes." 
        : "Database connection failed. Please check your configuration."
    })
  }

  const handleRefresh = async () => {
    await refreshClasses()
    setTestResult({
      success: true,
      message: "Classes refreshed successfully!"
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Class Creation Test</h1>
        <p className="text-muted-foreground">
          Test the class creation functionality with database integration
        </p>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Check if the database connection is working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={isUsingDatabase ? "default" : "destructive"}>
              {isUsingDatabase ? "Connected" : "Not Connected"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isUsingDatabase 
                ? "Database is available for class management" 
                : "Database connection required for class management"
              }
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleTestConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              Refresh Classes
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class Creation Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Create Class Test
          </CardTitle>
          <CardDescription>
            Test creating a new class and saving it to the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowCreateForm(true)}
            disabled={!isUsingDatabase}
            className="w-full"
          >
            Create New Class
          </Button>
          {!isUsingDatabase && (
            <p className="text-sm text-red-600 mt-2">
              Database connection required to create classes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Existing Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Classes ({classes.length})</CardTitle>
          <CardDescription>
            Classes currently in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes found</p>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{cls.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cls.level} • {cls.subsystem} • {cls.branch}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {cls.currentEnrollment}/{cls.capacity}
                    </p>
                    <Badge variant={cls.status === "active" ? "default" : "secondary"}>
                      {cls.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Class Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>
          <ClassCreationForm 
            onSuccess={handleCreateSuccess} 
            onCancel={() => setShowCreateForm(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TestClassCreationPage() {
  return (
    <ClassManagementProvider>
      <TestClassCreation />
    </ClassManagementProvider>
  )
}
