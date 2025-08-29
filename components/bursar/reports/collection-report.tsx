"use client"

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/currency-utils'

interface CollectionReportData {
  monthName: string
  paymentMethod: string
  totalTransactions: number
  totalAmount: number
  averageAmount: number
  uniqueStudents: number
  uniqueCollectors: number
}

interface CollectionReportSummary {
  totalTransactions: number
  totalAmount: number
  averageAmount: number
  uniqueStudents: number
  uniqueCollectors: number
}

export function CollectionReport() {
  const { toast } = useToast()
  const [reportData, setReportData] = useState<CollectionReportData[]>([])
  const [summary, setSummary] = useState<CollectionReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethodId: 'all'
  })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  useEffect(() => {
    loadPaymentMethods()
    generateReport()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/bursar/payment-methods?isActive=true')
      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      toast.error("Failed to load payment methods")
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.paymentMethodId && filters.paymentMethodId !== 'all') params.append('paymentMethodId', filters.paymentMethodId)

      const response = await fetch(`/api/bursar/reports/collection?${params}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setReportData(data.data || [])
      setSummary(data.summary)
      toast.success("Collection report generated successfully")
    } catch (error) {
      toast.error("Failed to generate collection report")
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.paymentMethodId && filters.paymentMethodId !== 'all') params.append('paymentMethodId', filters.paymentMethodId)
      params.append('format', format)

      const response = await fetch(`/api/bursar/reports/collection?${params}`)
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `collection-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `collection-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error("Failed to export report")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Collection Report
          </h2>
          <p className="text-muted-foreground">Monthly fee collection summary with payment method breakdown</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => exportReport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={filters.paymentMethodId || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, paymentMethodId: value || 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {paymentMethods.filter(method => method.id && method.id.trim() !== '').map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={isLoading} className="w-full">
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payment transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">Total amount collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageAmount)}</div>
              <p className="text-xs text-muted-foreground">Average per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.uniqueStudents}</div>
              <p className="text-xs text-muted-foreground">Students who paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <CardDescription>
            Monthly breakdown by payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Generating report...</p>
              </div>
            </div>
          ) : reportData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Average Amount</TableHead>
                  <TableHead>Unique Students</TableHead>
                  <TableHead>Collectors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.monthName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>{row.totalTransactions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.averageAmount)}</TableCell>
                    <TableCell>{row.uniqueStudents}</TableCell>
                    <TableCell>{row.uniqueCollectors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No data available for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

