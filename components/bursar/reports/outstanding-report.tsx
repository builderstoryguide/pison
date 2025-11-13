"use client"

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Download, 
  Filter, 
  Users,
  DollarSign,
  Clock,
  Calendar,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

interface OutstandingReportData {
  studentName: string
  studentNumber: string
  className: string
  feeStructureName: string
  academicYear: string
  term: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: string
  daysOverdue: number
}

interface OutstandingReportSummary {
  totalStudents: number
  totalOutstanding: number
  overdueStudents: number
  overdueAmount: number
  averageOutstanding: number
}

export function OutstandingReport() {
  const { toast } = useToast()
  const { formatCurrency } = useCurrencyFormatter()
  const [reportData, setReportData] = useState<OutstandingReportData[]>([])
  const [summary, setSummary] = useState<OutstandingReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    classId: 'all',
    academicYear: '',
    term: 'all',
    statusFilter: 'all'
  })
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    loadClasses()
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

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.classId && filters.classId !== 'all') params.append('classId', filters.classId)
      if (filters.academicYear) params.append('academicYear', filters.academicYear)
      if (filters.term && filters.term !== 'all') params.append('term', filters.term)
      if (filters.statusFilter && filters.statusFilter !== 'all') params.append('status', filters.statusFilter)

      const response = await fetch(`/api/bursar/reports/outstanding?${params}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setReportData(data.data || [])
      setSummary(data.summary)
      toast.success("Outstanding report generated successfully")
    } catch (error) {
      toast.error("Failed to generate outstanding report")
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams()
      if (filters.classId) params.append('classId', filters.classId)
      if (filters.academicYear) params.append('academicYear', filters.academicYear)
      if (filters.term) params.append('term', filters.term)
      if (filters.statusFilter) params.append('status', filters.statusFilter)
      params.append('format', format)

      const response = await fetch(`/api/bursar/reports/outstanding?${params}`)
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `outstanding-report-${new Date().toISOString().split('T')[0]}.csv`
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
        link.download = `outstanding-report-${new Date().toISOString().split('T')[0]}.json`
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

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Overdue ({daysOverdue} days)
        </Badge>
      case 'outstanding':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Outstanding
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Outstanding Balances Report
          </h2>
          <p className="text-muted-foreground">Students with outstanding fee balances</p>
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
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                placeholder="e.g., 2024-2025"
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="term">Term</Label>
              <Select 
                value={filters.term || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, term: value || 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All terms</SelectItem>
                  <SelectItem value="first">First Term</SelectItem>
                  <SelectItem value="second">Second Term</SelectItem>
                  <SelectItem value="third">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.statusFilter || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, statusFilter: value || 'all' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalStudents}</div>
              <p className="text-xs text-muted-foreground">With outstanding balances</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">Total amount outstanding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Students</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overdueStudents}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Outstanding</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageOutstanding)}</div>
              <p className="text-xs text-muted-foreground">Per student</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balances</CardTitle>
          <CardDescription>
            Detailed list of students with outstanding balances
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
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Structure</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.studentName}</div>
                        <div className="text-sm text-muted-foreground">{row.studentNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.feeStructureName}</div>
                        <div className="text-sm text-muted-foreground">
                          {row.academicYear} • {row.term}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.paidAmount)}</TableCell>
                    <TableCell className="font-medium text-red-600">{formatCurrency(row.balanceAmount)}</TableCell>
                    <TableCell>{getStatusBadge(row.paymentStatus, row.daysOverdue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No outstanding balances found for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

