"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  X,
  Building,
  BookOpen,
  Zap,
  Wrench,
  Truck,
  Utensils,
  Monitor,
  Package,
  Users,
  Megaphone,
  GraduationCap,
  MoreHorizontal
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrencyFormatter, useGlobalCurrency } from '@/lib/app-configuration-context-v2'
import { useAuth } from '@/lib/auth-context'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-utils'
import type { 
  Expenditure, 
  ExpenditureFormData,
  ExpenditureStats,
  ExpenditureFilters,
  ExpenditureCategory,
  BudgetCategory
} from '@/lib/expenditure-types'
import { 
  EXPENDITURE_CATEGORIES,
  BUDGET_CATEGORIES,
  PAYMENT_METHODS,
  CURRENCIES,
  EXPENDITURE_STATUSES
} from '@/lib/expenditure-types'



// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Get category icon
const getCategoryIcon = (category: ExpenditureCategory) => {
  const categoryConfig = EXPENDITURE_CATEGORIES.find(c => c.value === category)
  switch (categoryConfig?.icon) {
    case 'Building': return <Building className="h-4 w-4" />
    case 'BookOpen': return <BookOpen className="h-4 w-4" />
    case 'Zap': return <Zap className="h-4 w-4" />
    case 'Wrench': return <Wrench className="h-4 w-4" />
    case 'Truck': return <Truck className="h-4 w-4" />
    case 'Utensils': return <Utensils className="h-4 w-4" />
    case 'Monitor': return <Monitor className="h-4 w-4" />
    case 'Package': return <Package className="h-4 w-4" />
    case 'Users': return <Users className="h-4 w-4" />
    case 'Megaphone': return <Megaphone className="h-4 w-4" />
    case 'GraduationCap': return <GraduationCap className="h-4 w-4" />
    default: return <MoreHorizontal className="h-4 w-4" />
  }
}

// Get status badge
const getStatusBadge = (status: Expenditure['status']) => {
  const statusConfig = EXPENDITURE_STATUSES.find(s => s.value === status)
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800'
  }
  
  const iconMap = {
    pending: <Clock className="h-3 w-3 mr-1" />,
    approved: <CheckCircle className="h-3 w-3 mr-1" />,
    paid: <CheckCircle className="h-3 w-3 mr-1" />,
    rejected: <X className="h-3 w-3 mr-1" />
  }

  return (
    <Badge variant="secondary" className={colorClasses[statusConfig?.color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}>
      {iconMap[status]}
      {statusConfig?.label}
    </Badge>
  )
}

export function ExpenditureManagement() {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const { formatCurrency } = useCurrencyFormatter()
  const globalCurrency = useGlobalCurrency()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const [expenditures, setExpenditures] = useState<Expenditure[]>([])
  const [stats, setStats] = useState<ExpenditureStats>({
    total_expenditures: 0,
    total_amount: 0,
    pending_expenditures: 0,
    approved_expenditures: 0,
    paid_expenditures: 0,
    rejected_expenditures: 0,
    monthly_expenditure: 0,
    category_breakdown: [],
    department_breakdown: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAddExpenditureOpen, setIsAddExpenditureOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ExpenditureFilters>({
    category: 'all',
    status: 'all',
    academic_year: 'all',
    term: 'all',
    department: 'all',
    budget_category: 'all',
    date_range: 'all'
  })

  const fetchExpenditures = async () => {
    setIsLoading(true)
    try {
      const result = await apiGet<{ expenditures: Expenditure[] }>('/api/finances/expenditures')
      if (result.success && result.data) {
        setExpenditures(result.data.expenditures)
        // Calculate stats locally for now
        const exps = result.data.expenditures
        const totalAmount = exps.reduce((sum, e) => sum + e.amount, 0)
        setStats({
          total_expenditures: exps.length,
          total_amount: totalAmount,
          pending_expenditures: exps.filter(e => e.status === 'pending').length,
          approved_expenditures: exps.filter(e => e.status === 'approved').length,
          paid_expenditures: exps.filter(e => e.status === 'paid').length,
          rejected_expenditures: exps.filter(e => e.status === 'rejected').length,
          monthly_expenditure: totalAmount, // Simplified
          category_breakdown: [],
          department_breakdown: []
        })
      }
    } catch (error) {
      console.error('Error fetching expenditures:', error)
      toastError("Failed to fetch expenditures")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchExpenditures()
  }, [])

  // Form state for new expenditure
  const [newExpenditure, setNewExpenditure] = useState<ExpenditureFormData>({
    title: '',
    description: '',
    category: 'other',
    amount: 0,
    currency: globalCurrency as 'XOF' | 'USD' | 'EUR',
    payment_method: 'cash',
    payment_date: getTodayDate(),
    vendor: '',
    vendor_contact: '',
    receipt_number: '',
    invoice_number: '',
    academic_year: '2024-2025',
    term: 'Term 1',
    department: '',
    budget_category: 'operational',
    notes: ''
  })

  // Quick actions state
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [expenditureToDelete, setExpenditureToDelete] = useState<Expenditure | null>(null)

  // Filter expenditures based on search and filters
  const filteredExpenditures = expenditures.filter(expenditure => {
    const matchesSearch = expenditure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expenditure.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expenditure.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filters.category === 'all' || expenditure.category === filters.category
    const matchesStatus = filters.status === 'all' || expenditure.status === filters.status
    const matchesAcademicYear = filters.academic_year === 'all' || expenditure.academic_year === filters.academic_year
    const matchesTerm = filters.term === 'all' || expenditure.term === filters.term
    const matchesDepartment = filters.department === 'all' || expenditure.department === filters.department
    const matchesBudgetCategory = filters.budget_category === 'all' || expenditure.budget_category === filters.budget_category
    
    return matchesSearch && matchesCategory && matchesStatus && matchesAcademicYear && matchesTerm && matchesDepartment && matchesBudgetCategory
  })

  // Handle adding new expenditure
  const handleAddExpenditure = async () => {
    if (!newExpenditure.title || !newExpenditure.vendor || newExpenditure.amount <= 0) {
      toastError("Validation Error", {
        description: "Please fill in all required fields with valid values"
      })
      return
    }

    try {
      const result = await apiPost('/api/finances/expenditures', newExpenditure)

      if (result.success) {
        fetchExpenditures()
        setIsAddExpenditureOpen(false)
        
        toastSuccess("Expenditure Created Successfully! 🎉", {
          description: `Expenditure "${newExpenditure.title}" has been created`,
        })
        
        // Reset form
        setNewExpenditure({
          title: '',
          description: '',
          category: 'other',
          amount: 0,
          currency: 'XOF',
          payment_method: 'cash',
          payment_date: getTodayDate(),
          vendor: '',
          vendor_contact: '',
          receipt_number: '',
          invoice_number: '',
          academic_year: '2024-2025',
          term: 'Term 1',
          department: '',
          budget_category: 'operational',
          notes: ''
        })
      } else {
        toastError("Failed to create expenditure", {
          description: result.error || "Unknown error"
        })
      }
    } catch (error) {
      console.error('Error creating expenditure:', error)
      toastError("Failed to create expenditure", {
        description: "An error occurred while creating the expenditure"
      })
    }
  }

  // Quick action handlers
  const handleViewExpenditure = (expenditure: Expenditure) => {
    setSelectedExpenditure(expenditure)
    setShowViewDialog(true)
  }

  const handleEditExpenditure = (expenditure: Expenditure) => {
    setSelectedExpenditure(expenditure)
    setShowEditDialog(true)
  }

  const handleDeleteExpenditure = (expenditure: Expenditure) => {
    setExpenditureToDelete(expenditure)
    setShowDeleteDialog(true)
  }

  const confirmDeleteExpenditure = async () => {
    if (expenditureToDelete) {
      try {
        const result = await apiDelete(`/api/finances/expenditures?id=${expenditureToDelete.id}`)
        
        if (result.success) {
          fetchExpenditures()
          setShowDeleteDialog(false)
          setExpenditureToDelete(null)
          
          toastSuccess("Expenditure Deleted", {
            description: `Expenditure "${expenditureToDelete.title}" has been successfully deleted.`,
          })
        } else {
          toastError("Failed to delete expenditure", {
            description: result.error || "Unknown error"
          })
        }
      } catch (error) {
        console.error('Error deleting expenditure:', error)
        toastError("Failed to delete expenditure")
      }
    }
  }

  const handleUpdateExpenditure = async () => {
    if (!selectedExpenditure || !selectedExpenditure.title || !selectedExpenditure.vendor || selectedExpenditure.amount <= 0) {
      toastError("Validation Error", {
        description: "Please fill in all required fields with valid values"
      })
      return
    }

    try {
      const result = await apiPut('/api/finances/expenditures', selectedExpenditure)

      if (result.success) {
        fetchExpenditures()
        setShowEditDialog(false)
        setSelectedExpenditure(null)
        
        toastSuccess("Expenditure Updated", {
          description: `Expenditure "${selectedExpenditure.title}" has been updated successfully`,
        })
      } else {
        toastError("Failed to update expenditure", {
          description: result.error || "Unknown error"
        })
      }
    } catch (error) {
      console.error('Error updating expenditure:', error)
      toastError("Failed to update expenditure")
    }
  }

  const handleStatusChange = async (expenditure: Expenditure, newStatus: Expenditure['status']) => {
    try {
      const result = await apiPut('/api/finances/expenditures', {
        id: expenditure.id,
        status: newStatus
      })

      if (result.success) {
        fetchExpenditures()
        toastSuccess("Status Updated", {
          description: `Expenditure status has been updated to ${newStatus}`,
        })
      } else {
        toastError("Failed to update status")
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toastError("Failed to update status")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenditure Management</h1>
          <p className="text-muted-foreground">Monitor and manage the school's expenses and financial outflows</p>
        </div>
        <Dialog open={isAddExpenditureOpen} onOpenChange={setIsAddExpenditureOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expenditure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Expenditure</DialogTitle>
              <DialogDescription>
                Record a new expenditure for the school
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid gap-4 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newExpenditure.title}
                        onChange={(e) => setNewExpenditure({...newExpenditure, title: e.target.value})}
                        placeholder="Enter expenditure title"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newExpenditure.category} onValueChange={(value) => setNewExpenditure({...newExpenditure, category: value as ExpenditureCategory})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENDITURE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newExpenditure.description}
                      onChange={(e) => setNewExpenditure({...newExpenditure, description: e.target.value})}
                      placeholder="Enter expenditure description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        value={newExpenditure.amount}
                        onChange={(e) => setNewExpenditure({...newExpenditure, amount: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={newExpenditure.payment_method} onValueChange={(value) => setNewExpenditure({...newExpenditure, payment_method: value as Expenditure['payment_method']})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentDate">Payment Date *</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={newExpenditure.payment_date}
                        onChange={(e) => setNewExpenditure({...newExpenditure, payment_date: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgetCategory">Budget Category</Label>
                      <Select value={newExpenditure.budget_category} onValueChange={(value) => setNewExpenditure({...newExpenditure, budget_category: value as BudgetCategory})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select budget category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vendor Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor *</Label>
                      <Input
                        id="vendor"
                        value={newExpenditure.vendor}
                        onChange={(e) => setNewExpenditure({...newExpenditure, vendor: e.target.value})}
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendorContact">Vendor Contact</Label>
                      <Input
                        id="vendorContact"
                        value={newExpenditure.vendor_contact || ''}
                        onChange={(e) => setNewExpenditure({...newExpenditure, vendor_contact: e.target.value})}
                        placeholder="Enter vendor contact"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receiptNumber">Receipt Number</Label>
                      <Input
                        id="receiptNumber"
                        value={newExpenditure.receipt_number || ''}
                        onChange={(e) => setNewExpenditure({...newExpenditure, receipt_number: e.target.value})}
                        placeholder="Enter receipt number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={newExpenditure.invoice_number || ''}
                        onChange={(e) => setNewExpenditure({...newExpenditure, invoice_number: e.target.value})}
                        placeholder="Enter invoice number"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Academic Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Select value={newExpenditure.academic_year} onValueChange={(value) => setNewExpenditure({...newExpenditure, academic_year: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-2025">2024-2025</SelectItem>
                          <SelectItem value="2025-2026">2025-2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="term">Term</Label>
                      <Select value={newExpenditure.term} onValueChange={(value) => setNewExpenditure({...newExpenditure, term: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Term 1">Term 1</SelectItem>
                          <SelectItem value="Term 2">Term 2</SelectItem>
                          <SelectItem value="Term 3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={newExpenditure.department || ''}
                        onChange={(e) => setNewExpenditure({...newExpenditure, department: e.target.value})}
                        placeholder="Enter department"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newExpenditure.notes || ''}
                      onChange={(e) => setNewExpenditure({...newExpenditure, notes: e.target.value})}
                      placeholder="Enter any additional notes"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setIsAddExpenditureOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExpenditure}>
                Add Expenditure
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_expenditures}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paid_expenditures} paid, {stats.pending_expenditures} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.monthly_expenditure)} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_expenditures}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved_expenditures}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenditures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenditure Records</CardTitle>
          <CardDescription>
            View and manage all school expenditures and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenditures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENDITURE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {EXPENDITURE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.academic_year} onValueChange={(value) => setFilters({...filters, academic_year: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>

                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenditures.map((expenditure) => (
                  <TableRow key={expenditure.id}>

                    <TableCell>
                      <div>
                        <div className="font-medium">{expenditure.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {expenditure.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(expenditure.category)}
                        <span className="capitalize">{expenditure.category.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{expenditure.vendor}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(expenditure.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(expenditure.status)}</TableCell>
                    <TableCell>{new Date(expenditure.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewExpenditure(expenditure)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditExpenditure(expenditure)}
                              title="Edit Expenditure"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {expenditure.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleStatusChange(expenditure, 'approved')}
                                title="Approve"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {expenditure.status === 'approved' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleStatusChange(expenditure, 'paid')}
                                title="Mark as Paid"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteExpenditure(expenditure)}
                              title="Delete Expenditure"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExpenditures.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenditures found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filters.category !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first expenditure'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Expenditure Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expenditure Details</DialogTitle>
            <DialogDescription>
              View detailed information about this expenditure
            </DialogDescription>
          </DialogHeader>
          {selectedExpenditure && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Expenditure ID</Label>
                  <p className="text-sm">{selectedExpenditure.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedExpenditure.status)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                <p className="text-sm font-medium">{selectedExpenditure.title}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedExpenditure.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getCategoryIcon(selectedExpenditure.category)}
                    <span className="capitalize">{selectedExpenditure.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Budget Category</Label>
                  <p className="text-sm capitalize">{selectedExpenditure.budget_category.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedExpenditure.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p className="text-sm capitalize">{selectedExpenditure.payment_method.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Vendor</Label>
                  <p className="text-sm font-medium">{selectedExpenditure.vendor}</p>
                  {selectedExpenditure.vendor_contact && (
                    <p className="text-xs text-muted-foreground">{selectedExpenditure.vendor_contact}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Date</Label>
                  <p className="text-sm">{new Date(selectedExpenditure.payment_date).toLocaleDateString()}</p>
                </div>
              </div>

              {(selectedExpenditure.receipt_number || selectedExpenditure.invoice_number) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedExpenditure.receipt_number && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Receipt Number</Label>
                      <p className="text-sm">{selectedExpenditure.receipt_number}</p>
                    </div>
                  )}
                  {selectedExpenditure.invoice_number && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                      <p className="text-sm">{selectedExpenditure.invoice_number}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                  <p className="text-sm">{selectedExpenditure.academic_year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Term</Label>
                  <p className="text-sm">{selectedExpenditure.term}</p>
                </div>
              </div>

              {selectedExpenditure.department && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                  <p className="text-sm">{selectedExpenditure.department}</p>
                </div>
              )}

              {selectedExpenditure.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedExpenditure.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm">{new Date(selectedExpenditure.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                  <p className="text-sm">{new Date(selectedExpenditure.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expenditure Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Expenditure</DialogTitle>
            <DialogDescription>
              Update expenditure details
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpenditure && (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid gap-4 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title *</Label>
                      <Input
                        id="edit-title"
                        value={selectedExpenditure.title}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, title: e.target.value})}
                        placeholder="Enter expenditure title"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select value={selectedExpenditure.category} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, category: value as ExpenditureCategory})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENDITURE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedExpenditure.description}
                      onChange={(e) => setSelectedExpenditure({...selectedExpenditure, description: e.target.value})}
                      placeholder="Enter expenditure description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-amount">Amount *</Label>
                      <Input
                        id="edit-amount"
                        type="number"
                        min="0"
                        value={selectedExpenditure.amount}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, amount: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                      <Select value={selectedExpenditure.payment_method} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, payment_method: value as Expenditure['payment_method']})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={selectedExpenditure.status} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, status: value as Expenditure['status']})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENDITURE_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-paymentDate">Payment Date *</Label>
                      <Input
                        id="edit-paymentDate"
                        type="date"
                        value={selectedExpenditure.payment_date.split('T')[0]}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, payment_date: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-budgetCategory">Budget Category</Label>
                      <Select value={selectedExpenditure.budget_category} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, budget_category: value as BudgetCategory})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select budget category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vendor Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-vendor">Vendor *</Label>
                      <Input
                        id="edit-vendor"
                        value={selectedExpenditure.vendor}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, vendor: e.target.value})}
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-vendorContact">Vendor Contact</Label>
                      <Input
                        id="edit-vendorContact"
                        value={selectedExpenditure.vendor_contact || ''}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, vendor_contact: e.target.value})}
                        placeholder="Enter vendor contact"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-receiptNumber">Receipt Number</Label>
                      <Input
                        id="edit-receiptNumber"
                        value={selectedExpenditure.receipt_number || ''}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, receipt_number: e.target.value})}
                        placeholder="Enter receipt number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-invoiceNumber">Invoice Number</Label>
                      <Input
                        id="edit-invoiceNumber"
                        value={selectedExpenditure.invoice_number || ''}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, invoice_number: e.target.value})}
                        placeholder="Enter invoice number"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Academic Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-academicYear">Academic Year</Label>
                      <Select value={selectedExpenditure.academic_year} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, academic_year: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-2025">2024-2025</SelectItem>
                          <SelectItem value="2025-2026">2025-2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-term">Term</Label>
                      <Select value={selectedExpenditure.term} onValueChange={(value) => setSelectedExpenditure({...selectedExpenditure, term: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Term 1">Term 1</SelectItem>
                          <SelectItem value="Term 2">Term 2</SelectItem>
                          <SelectItem value="Term 3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={selectedExpenditure.department || ''}
                        onChange={(e) => setSelectedExpenditure({...selectedExpenditure, department: e.target.value})}
                        placeholder="Enter department"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={selectedExpenditure.notes || ''}
                      onChange={(e) => setSelectedExpenditure({...selectedExpenditure, notes: e.target.value})}
                      placeholder="Enter any additional notes"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpenditure}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expenditure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expenditure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {expenditureToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">Expenditure Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>ID:</strong> {expenditureToDelete.id}<br/>
                  <strong>Title:</strong> {expenditureToDelete.title}<br/>
                  <strong>Vendor:</strong> {expenditureToDelete.vendor}<br/>
                  <strong>Amount:</strong> {formatCurrency(expenditureToDelete.amount)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteExpenditure}>
              Delete Expenditure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
