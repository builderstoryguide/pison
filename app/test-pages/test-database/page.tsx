"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { supabase, isSupabaseAvailable, testConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, Table } from "lucide-react"

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Check if Supabase is available
      results.supabaseAvailable = isSupabaseAvailable()
      console.log("Supabase available:", results.supabaseAvailable)

      // Test 2: Test connection
      results.connectionTest = await testConnection()
      console.log("Connection test:", results.connectionTest)

      // Test 3: Check if examinations table exists
      if (supabase && results.connectionTest) {
        try {
          const { data, error } = await supabase
            .from("examinations")
            .select("count", { count: "exact", head: true })

          if (error) {
            results.tableExists = false
            results.tableError = error.message
          } else {
            results.tableExists = true
            results.tableCount = data
          }
        } catch (error) {
          results.tableExists = false
          results.tableError = error
        }
      }

      // Test 4: Try to insert a test record
      if (supabase && results.tableExists) {
        try {
          const testData = {
            title: "Test Examination",
            type: "internal",
            exam_board: "Test Board",
            subsystem: "english",
            branch: "grammar",
            level: "Test Level",
            subjects: ["Test Subject"],
            start_date: "2024-01-01",
            end_date: "2024-01-02",
            duration: 120,
            total_marks: 100,
            passing_marks: 50,
            venue: "Test Venue",
            instructions: "Test instructions",
            status: "draft",
            enrolled_students: 0,
            completed_students: 0,
          }

          const { data, error } = await supabase
            .from("examinations")
            .insert([testData])
            .select()
            .single()

          if (error) {
            results.insertTest = false
            results.insertError = error.message
          } else {
            results.insertTest = true
            results.insertedId = data.id

            // Clean up - delete the test record
            await supabase
              .from("examinations")
              .delete()
              .eq("id", data.id)
          }
        } catch (error) {
          results.insertTest = false
          results.insertError = error
        }
      }

    } catch (error) {
      console.error("Test error:", error)
      results.generalError = error
    }

    setTestResults(results)
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-muted-foreground">
          This page tests the database connection and table setup for the examination system.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Tests
            </CardTitle>
            <CardDescription>
              Click the button below to run comprehensive database tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? "Running Tests..." : "Run Database Tests"}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supabase Availability */}
              <div className="flex items-center gap-2">
                {testResults.supabaseAvailable ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Supabase Client Available: {testResults.supabaseAvailable ? "Yes" : "No"}</span>
              </div>

              {/* Connection Test */}
              <div className="flex items-center gap-2">
                {testResults.connectionTest ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Database Connection: {testResults.connectionTest ? "Success" : "Failed"}</span>
              </div>

              {/* Table Existence */}
              <div className="flex items-center gap-2">
                {testResults.tableExists ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Examinations Table Exists: {testResults.tableExists ? "Yes" : "No"}</span>
              </div>

              {/* Insert Test */}
              {testResults.tableExists && (
                <div className="flex items-center gap-2">
                  {testResults.insertTest ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Insert Test: {testResults.insertTest ? "Success" : "Failed"}</span>
                </div>
              )}

              {/* Error Messages */}
              {testResults.tableError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Table Error:</strong> {testResults.tableError instanceof Error ? testResults.tableError.message : String(testResults.tableError)}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.insertError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Insert Error:</strong> {testResults.insertError instanceof Error ? testResults.insertError.message : String(testResults.insertError)}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.generalError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>General Error:</strong> {testResults.generalError instanceof Error ? testResults.generalError.message : String(testResults.generalError)}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {testResults.supabaseAvailable && 
               testResults.connectionTest && 
               testResults.tableExists && 
               testResults.insertTest && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All tests passed! The database is properly configured and ready to use.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}</span>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
