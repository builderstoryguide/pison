"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinancial, FinancialProvider } from "@/lib/financial-context"
import { usePDFExport } from "@/hooks/use-pdf-export"
import { Download, FileText, Receipt, Users, CreditCard } from "lucide-react"

function TestPDFExportContent() {
  const { 
    payments, 
    feeStructures, 
    studentFeeAssignments, 
    getFinancialSummary 
  } = useFinancial()
  
  const { 
    isGenerating,
    exportPaymentReport,
    exportFeeStructureReport,
    exportOutstandingFeesReport,
    exportComprehensiveReport
  } = usePDFExport()

  const financialSummary = getFinancialSummary()

  const handleExportPaymentReport = async () => {
    await exportPaymentReport(payments)
  }

  const handleExportFeeStructureReport = async () => {
    await exportFeeStructureReport(feeStructures)
  }

  const handleExportOutstandingFeesReport = async () => {
    const outstandingAssignments = studentFeeAssignments.filter(a => a.balance > 0)
    await exportOutstandingFeesReport(outstandingAssignments)
  }

  const handleExportComprehensiveReport = async () => {
    const comprehensiveData = {
      title: 'Comprehensive Financial Report',
      generatedAt: new Date().toISOString(),
      generatedBy: 'Admin',
      summary: {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amountPaid, 0),
        outstandingAmount: studentFeeAssignments.reduce((sum, a) => sum + a.balance, 0),
        paymentMethods: payments.reduce((acc, p) => {
          acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amountPaid
          return acc
        }, {} as Record<string, number>)
      },
      payments: payments,
      feeStructures: feeStructures,
      studentFeeAssignments: studentFeeAssignments
    }
    await exportComprehensiveReport(comprehensiveData)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Export Test Page</h1>
        <p className="text-muted-foreground">
          Test the PDF export functionality for financial records
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Payment records available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Structures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStructures.length}</div>
            <p className="text-xs text-muted-foreground">
              Fee structures available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentFeeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Fee assignments available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialSummary.totalCollections.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Report
            </CardTitle>
            <CardDescription>
              Export all payment records with detailed information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Total payments: {payments.length}</p>
              <p>• Total amount: {payments.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()} FCFA</p>
              <p>• Payment methods: {Object.keys(payments.reduce((acc, p) => {
                acc[p.paymentMethod] = true
                return acc
              }, {} as Record<string, boolean>)).length}</p>
            </div>
            <Button 
              onClick={handleExportPaymentReport}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Export Payment Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Fee Structure Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fee Structure Report
            </CardTitle>
            <CardDescription>
              Export all fee structures and their details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Total structures: {feeStructures.length}</p>
              <p>• Total amount: {feeStructures.reduce((sum, f) => sum + f.amount, 0).toLocaleString()} FCFA</p>
              <p>• Active structures: {feeStructures.filter(f => f.isActive).length}</p>
            </div>
            <Button 
              onClick={handleExportFeeStructureReport}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Export Fee Structure Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Outstanding Fees Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Outstanding Fees Report
            </CardTitle>
            <CardDescription>
              Export outstanding fee assignments and balances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Outstanding assignments: {studentFeeAssignments.filter(a => a.balance > 0).length}</p>
              <p>• Total outstanding: {studentFeeAssignments.reduce((sum, a) => sum + a.balance, 0).toLocaleString()} FCFA</p>
              <p>• Overdue assignments: {studentFeeAssignments.filter(a => a.status === 'overdue').length}</p>
            </div>
            <Button 
              onClick={handleExportOutstandingFeesReport}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Export Outstanding Fees Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Comprehensive Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Comprehensive Report
            </CardTitle>
            <CardDescription>
              Export all financial data in one comprehensive report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• All payments, fee structures, and assignments</p>
              <p>• Financial summary and analytics</p>
              <p>• Payment method breakdown</p>
            </div>
            <Button 
              onClick={handleExportComprehensiveReport}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Export Comprehensive Report"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use PDF Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Before Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Ensure you have financial data in the system</li>
                <li>Make sure the API route is working: <code>/api/financial-reports</code></li>
                <li>Check that Puppeteer is properly installed</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Testing Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click any of the export buttons above</li>
                <li>Wait for the PDF to generate (may take a few seconds)</li>
                <li>The PDF will automatically download to your device</li>
                <li>Open the PDF to verify the content and formatting</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Expected Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>PDF files should be generated with proper formatting</li>
                <li>Reports should include all relevant financial data</li>
                <li>PDFs should have professional styling and layout</li>
                <li>File names should include the report type and date</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Report Types:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Payment Report:</strong> All payment records with details</li>
                <li><strong>Fee Structure Report:</strong> All fee structures and amounts</li>
                <li><strong>Outstanding Fees Report:</strong> Students with outstanding balances</li>
                <li><strong>Comprehensive Report:</strong> Complete financial overview</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestPDFExportPage() {
  return (
    <FinancialProvider>
      <TestPDFExportContent />
    </FinancialProvider>
  )
}
