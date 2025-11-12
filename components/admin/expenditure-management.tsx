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

// Mock data for development
const mockExpenditures: Expenditure[] = [
  {
    id: 'EXP001',
    title: 'Classroom Furniture Purchase',
    description: 'Purchase of 30 new desks and chairs for Form 5A classroom',
    category: 'equipment',
    amount: 450000,
    currency: 'XOF',
    payment_method: 'bank_transfer',
    payment_date: '2024-09-15',
    vendor: 'Office Supplies Ltd',
    vendor_contact: '+237 123 456 789',
    receipt_number: 'RCP-EXP-001',
    invoice_number: 'INV-2024-001',
    status: 'paid',
    approved_by: 'admin',
    approved_at: '2024-09-10T10:00:00Z',
    academic_year: '2024-2025',
    term: 'Term 1',
    department: 'Academic',
    budget_category: 'capital',
    notes: 'Urgent replacement needed for damaged furniture',
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-15T10:00:00Z'
  },
  {
    id: 'EXP002',
    title: 'Monthly Electricity Bill',
    description: 'September 2024 electricity bill for school premises',
    category: 'utilities',
    amount: 125000,
    currency: 'XOF',
    payment_method: 'bank_transfer',
    payment_date: '2024-09-20',
    vendor: 'ENEO Cameroon',
    vendor_contact: '+237 800 123 456',
    receipt_number: 'RCP-EXP-002',
    status: 'paid',
    approved_by: 'admin',
    approved_at: '2024-09-18T10:00:00Z',
    academic_year: '2024-2025',
    term: 'Term 1',
    department: 'Administrative',
    budget_category: 'operational',
    created_by: 'admin',
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2024-09-20T10:00:00Z'
  },
  {
    id: 'EXP003',
    title: 'Teacher Training Workshop',
    description: 'Professional development workshop for mathematics teachers',
    category: 'training',
    amount: 200000,
    currency: 'XOF',
    payment_method: 'cash',
    payment_date: '2024-09-25',
    vendor: 'Education Excellence Center',
    vendor_contact: '+237 987 654 321',
    receipt_number: 'RCP-EXP-003',
    status: 'approved',
    approved_by: 'admin',
    approved_at: '2024-09-22T10:00:00Z',
    academic_year: '2024-2025',
    term: 'Term 1',
    department: 'Academic',
    budget_category: 'development',
    notes: 'Two-day intensive training program',
    created_by: 'admin',
    created_at: '2024-09-20T10:00:00Z',
    updated_at: '2024-09-22T10:00:00Z'
  }
]

const mockStats: ExpenditureStats = {
  total_expenditures: 3,
  total_amount: 775000,
  pending_expenditures: 0,
  approved_expenditures: 1,
  paid_expenditures: 2,
  rejected_expenditures: 0,
  monthly_expenditure: 775000,
  category_breakdown: [
    { category: 'equipment', count: 1, amount: 450000, percentage: 58.1 },
    { category: 'utilities', count: 1, amount: 125000, percentage: 16.1 },
    { category: 'training', count: 1, amount: 200000, percentage: 25.8 }
  ],
  department_breakdown: [
    { department: 'Academic', count: 2, amount: 650000, percentage: 83.9 },
    { department: 'Administrative', count: 1, amount: 125000, percentage: 16.1 }
  ]
}

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
  const { toast } = useToast()
  const [expenditures, setExpenditures] = useState<Expenditure[]>(mockExpenditures)
  const [stats] = useState<ExpenditureStats>(mockStats)
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

  // Form state for new expenditure
  const [newExpenditure, setNewExpenditure] = useState<ExpenditureFormData>({
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

  // Quick actions state
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [, setShowEditDialog] = useState(false)
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
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive"
      })
      return
    }

    try {
      const newExp: Expenditure = {
        id: `EXP${String(Date.now()).slice(-6)}`,
        ...newExpenditure,
        status: 'pending',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setExpenditures(prev => [newExp, ...prev])
      setIsAddExpenditureOpen(false)
      
      toast({
        title: "Expenditure Created Successfully! 🎉",
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
    } catch (error) {
      console.error('Error creating expenditure:', error)
      toast({
        title: "Failed to create expenditure",
        description: "An error occurred while creating the expenditure",
        variant: "destructive"
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
      setExpenditures(prev => prev.filter(exp => exp.id !== expenditureToDelete.id))
      setShowDeleteDialog(false)
      setExpenditureToDelete(null)
      
      toast({
        title: "Expenditure Deleted",
        description: `Expenditure "${expenditureToDelete.title}" has been successfully deleted.`,
      })
    }
  }

  const handleStatusChange = (expenditure: Expenditure, newStatus: Expenditure['status']) => {
    const updatedExpenditure = {
      ...expenditure,
      status: newStatus,
      approved_by: newStatus === 'approved' || newStatus === 'paid' ? 'admin' : undefined,
      approved_at: newStatus === 'approved' || newStatus === 'paid' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    }

    setExpenditures(prev => prev.map(exp => exp.id === expenditure.id ? updatedExpenditure : exp))
    
    toast({
      title: "Status Updated",
      description: `Expenditure status has been updated to ${newStatus}`,
    })
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
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={newExpenditure.currency} onValueChange={(value) => setNewExpenditure({...newExpenditure, currency: value as Expenditure['currency']})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label} ({currency.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            <div className="text-2xl font-bold">{stats.total_amount.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthly_expenditure.toLocaleString()} XOF this month
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
                  <TableHead>ID</TableHead>
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
                    <TableCell className="font-medium">{expenditure.id}</TableCell>
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
                      {expenditure.amount.toLocaleString()} {expenditure.currency}
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
                  <p className="text-lg font-bold">{selectedExpenditure.amount.toLocaleString()} {selectedExpenditure.currency}</p>
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
                  <strong>Amount:</strong> {expenditureToDelete.amount.toLocaleString()} {expenditureToDelete.currency}
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
