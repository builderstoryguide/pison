"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeacherGrades, TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { AuthProvider } from "@/lib/auth-context"
import { testConnection, getConnectionError } from "@/lib/supabase"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TestAssessmentCreationContent() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const { createAssessment, error, loading } = useTeacherGrades()

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDatabaseConnection = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult("Testing database connection...")
      const connectionError = getConnectionError()
      
      if (connectionError) {
        addResult(`❌ Connection error: ${connectionError}`)
        return
      }
      
      addResult("✅ Environment variables are set")
      
      const isConnected = await testConnection()
      if (isConnected) {
        addResult("✅ Database connection successful")
      } else {
        addResult("❌ Database connection failed")
      }
    } catch (error) {
      addResult(`❌ Connection test error: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  const testAssessmentCreation = async () => {
    setIsTesting(true)
    addResult("Testing assessment creation...")
    
    try {
      await createAssessment({
        title: "Test Assessment",
        type: "quiz",
        subject: "Mathematics",
        classId: "test-class-id",
        className: "Test Class",
        totalMarks: 100,
        date: new Date().toISOString().split('T')[0],
      })
      
      if (error) {
        addResult(`❌ Assessment creation failed: ${error}`)
      } else {
        addResult("✅ Assessment creation successful")
      }
    } catch (error) {
      addResult(`❌ Assessment creation error: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  const testTableStructure = async () => {
    setIsTesting(true)
    addResult("Testing table structure...")
    
    try {
      const { supabase } = await import("@/lib/supabase")
      
      if (!supabase) {
        addResult("❌ Supabase client not available")
        return
      }

      // Test if assessments table exists and get its structure
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .limit(1)

      if (error) {
        addResult(`❌ Table access error: ${error.message}`)
        addResult(`Error code: ${error.code}`)
        addResult(`Error details: ${error.details}`)
      } else {
        addResult("✅ Assessments table is accessible")
        addResult(`Table has ${data?.length || 0} records`)
      }
    } catch (error) {
      addResult(`❌ Table structure test error: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Creation Debug Tool</CardTitle>
          <CardDescription>
            Test database connection and assessment creation functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testDatabaseConnection}
              disabled={isTesting}
              variant="outline"
            >
              Test Database Connection
            </Button>
            
            <Button 
              onClick={testTableStructure}
              disabled={isTesting}
              variant="outline"
            >
              Test Table Structure
            </Button>
            
            <Button 
              onClick={testAssessmentCreation}
              disabled={isTesting}
              variant="outline"
            >
              Test Assessment Creation
            </Button>
          </div>

          {loading && (
            <div className="text-blue-600">Loading...</div>
          )}

          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {testResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestAssessmentCreation() {
  return (
    <AuthProvider>
      <TeacherGradesProvider>
        <TestAssessmentCreationContent />
      </TeacherGradesProvider>
    </AuthProvider>
  )
}
