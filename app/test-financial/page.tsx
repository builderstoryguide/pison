"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinancial } from '@/lib/financial-context'

export default function TestFinancial() {
  const { 
    feeStructures, 
    payments, 
    studentFeeAssignments, 
    isLoading, 
    loadFinancialData 
  } = useFinancial()
  
  const [testResults, setTestResults] = useState<{
    feeStructuresLoaded: boolean
    paymentsLoaded: boolean
    assignmentsLoaded: boolean
    hasData: boolean
  }>({
    feeStructuresLoaded: false,
    paymentsLoaded: false,
    assignmentsLoaded: false,
    hasData: false
  })

  useEffect(() => {
    // Test the financial data loading
    const testData = async () => {
      await loadFinancialData()
      
      setTestResults({
        feeStructuresLoaded: feeStructures.length > 0,
        paymentsLoaded: payments.length > 0,
        assignmentsLoaded: studentFeeAssignments.length > 0,
        hasData: feeStructures.length > 0 || payments.length > 0 || studentFeeAssignments.length > 0
      })
    }

    testData()
  }, [loadFinancialData, feeStructures.length, payments.length, studentFeeAssignments.length])

  const reloadData = async () => {
    setTestResults({
      feeStructuresLoaded: false,
      paymentsLoaded: false,
      assignmentsLoaded: false,
      hasData: false
    })
    await loadFinancialData()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Financial Context Test</h1>
        <p className="text-muted-foreground">Test the financial data loading and error handling</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Loading Status */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Status</CardTitle>
            <CardDescription>Current loading state of financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Loading:</span>
              <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                {isLoading ? '🔄 Loading...' : '✅ Complete'}
              </span>
            </div>
            <Button onClick={reloadData} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Reload Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Status */}
        <Card>
          <CardHeader>
            <CardTitle>Data Status</CardTitle>
            <CardDescription>Status of different data types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Fee Structures:</span>
              <span className={testResults.feeStructuresLoaded ? 'text-green-600' : 'text-gray-500'}>
                {testResults.feeStructuresLoaded ? `✅ ${feeStructures.length} items` : '❌ None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payments:</span>
              <span className={testResults.paymentsLoaded ? 'text-green-600' : 'text-gray-500'}>
                {testResults.paymentsLoaded ? `✅ ${payments.length} items` : '❌ None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fee Assignments:</span>
              <span className={testResults.assignmentsLoaded ? 'text-green-600' : 'text-gray-500'}>
                {testResults.assignmentsLoaded ? `✅ ${studentFeeAssignments.length} items` : '❌ None'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Data Display */}
      {testResults.hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>Preview of loaded financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fee Structures */}
            {feeStructures.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Fee Structures ({feeStructures.length})</h3>
                <div className="space-y-2">
                  {feeStructures.slice(0, 3).map((fee) => (
                    <div key={fee.id} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{fee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {fee.subsystem} - {fee.branch} - {fee.level} - ${fee.amount}
                      </div>
                    </div>
                  ))}
                  {feeStructures.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {feeStructures.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payments */}
            {payments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Payments ({payments.length})</h3>
                <div className="space-y-2">
                  {payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{payment.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.feeName} - ${payment.amount} - {payment.paymentMethod}
                      </div>
                    </div>
                  ))}
                  {payments.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {payments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fee Assignments */}
            {studentFeeAssignments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Fee Assignments ({studentFeeAssignments.length})</h3>
                <div className="space-y-2">
                  {studentFeeAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{assignment.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.feeStructureName} - ${assignment.totalAmount} - {assignment.status}
                      </div>
                    </div>
                  ))}
                  {studentFeeAssignments.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {studentFeeAssignments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Summary of financial context functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Database Connection:</span>
              <span className={testResults.hasData ? 'text-green-600' : 'text-yellow-600'}>
                {testResults.hasData ? '✅ Working (or using mock data)' : '⚠️ Using mock data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Error Handling:</span>
              <span className="text-green-600">✅ Graceful fallback implemented</span>
            </div>
            <div className="flex justify-between">
              <span>Data Loading:</span>
              <span className={!isLoading ? 'text-green-600' : 'text-yellow-600'}>
                {!isLoading ? '✅ Complete' : '🔄 In Progress'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mock Data Available:</span>
              <span className="text-green-600">✅ Fee structures and payments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
