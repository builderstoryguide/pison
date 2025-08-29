"use client"

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Download, 
  Filter, 
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  Target
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

interface RevenueReportData {
  monthName: string
  className: string
  feeCategory: string
  totalPayments: number
  totalRevenue: number
  averagePayment: number
  uniqueStudents: number
}

interface RevenueReportSummary {
  totalRevenue: number
  totalPayments: number
  averageRevenue: number
  uniqueStudents: number
  topClass: string
  topCategory: string
}

export function RevenueReport() {
  const { toast } = useToast()
  const [reportData, setReportData] = useState<RevenueReportData[]>([])
  const [summary, setSummary] = useState<RevenueReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: 'all',
    feeCategoryId: 'all'
  })
  const [classes, setClasses] = useState<any[]>([])
  const [feeCategories, setFeeCategories] = useState<any[]>([])

  useEffect(() => {
    loadClasses()
    loadFeeCategories()
    generateReport()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      setClasses(data)
    } catch (error) {
      toast.error("Failed to load classes")
    }
  }

  const loadFeeCategories = async () => {
    try {
      const response = await fetch('/api/bursar/fee-categories?isActive=true')
      const data = await response.json()
      setFeeCategories(data)
    } catch (error) {
      toast.error("Failed to load fee categories")
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.classId && filters.classId !== 'all') params.append('classId', filters.classId)
      if (filters.feeCategoryId && filters.feeCategoryId !== 'all') params.append('feeCategoryId', filters.feeCategoryId)

      const response = await fetch(`/api/bursar/reports/revenue?${params}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setReportData(data.data || [])
      setSummary(data.summary)
      toast.success("Revenue report generated successfully")
    } catch (error) {
      toast.error("Failed to generate revenue report")
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.classId && filters.classId !== 'all') params.append('classId', filters.classId)
      if (filters.feeCategoryId && filters.feeCategoryId !== 'all') params.append('feeCategoryId', filters.feeCategoryId)
      params.append('format', format)

      const response = await fetch(`/api/bursar/reports/revenue?${params}`)
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
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
        link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`
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
            <TrendingUp className="h-6 w-6" />
            Revenue Trends Report
          </h2>
          <p className="text-muted-foreground">Revenue trends and analysis by period, class, and fee category</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Label htmlFor="class">Class</Label>
              <Select 
                value={filters.classId || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, classId: value || 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.filter(cls => cls.id && cls.id.trim() !== '').map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feeCategory">Fee Category</Label>
              <Select 
                value={filters.feeCategoryId || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, feeCategoryId: value || 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {feeCategories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total revenue generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payment transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageRevenue)}</div>
              <p className="text-xs text-muted-foreground">Average per period</p>
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

      {/* Top Performers */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topClass}</div>
              <p className="text-sm text-muted-foreground">Highest revenue generating class</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Top Fee Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topCategory}</div>
              <p className="text-sm text-muted-foreground">Highest revenue generating category</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Details</CardTitle>
          <CardDescription>
            Monthly breakdown by class and fee category
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
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Category</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Average Payment</TableHead>
                  <TableHead>Unique Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.monthName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.className}</Badge>
                    </TableCell>
                    <TableCell>{row.feeCategory}</TableCell>
                    <TableCell>{row.totalPayments.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell>{formatCurrency(row.averagePayment)}</TableCell>
                    <TableCell>{row.uniqueStudents}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No revenue data available for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

