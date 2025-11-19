"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Package,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { StudentSearch } from '@/components/ui/student-search'
import { useToast } from '@/hooks/use-toast'
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

// Types
interface Sale {
  id: string
  studentId: string
  studentName: string
  itemType: 'pullover' | 'sport_wear' | 'uniform' | 't_shirt'
  itemName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate: Date
  status: 'completed' | 'pending' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface SelectedStudent {
  id: string
  studentId: string
  fullName: string
  firstName: string
  lastName: string
  email?: string
  className?: string
  enrollmentStatus?: string
}

interface SalesStats {
  totalSales: number
  totalRevenue: number
  totalItemsSold: number
  averageOrderValue: number
  topSellingItem: string
  salesThisMonth: number
  revenueThisMonth: number
}

// Helper function to convert API sale data to component format
const convertApiSaleToComponent = (apiSale: any): Sale => ({
  id: apiSale.id,
  studentId: apiSale.student_id,
  studentName: apiSale.student_name,
  itemType: apiSale.item_type,
  itemName: apiSale.item_name,
  quantity: apiSale.quantity,
  unitPrice: apiSale.unit_price,
  totalAmount: apiSale.total_amount,
  saleDate: new Date(apiSale.sale_date),
  status: apiSale.status,
  notes: apiSale.notes,
  createdBy: apiSale.created_by,
  createdAt: new Date(apiSale.created_at),
  updatedAt: new Date(apiSale.updated_at)
})

// Helper function to convert API stats to component format
const convertApiStatsToComponent = (apiStats: any): SalesStats => ({
  totalSales: apiStats.total_sales || 0,
  totalRevenue: apiStats.total_revenue || 0,
  totalItemsSold: apiStats.total_items_sold || 0,
  averageOrderValue: apiStats.average_order_value || 0,
  topSellingItem: apiStats.top_selling_item || 'No sales yet',
  salesThisMonth: apiStats.sales_this_month || 0,
  revenueThisMonth: apiStats.revenue_this_month || 0
})

// Helper function to get item name from item type
const getItemNameFromType = (itemType: Sale['itemType']) => {
  switch (itemType) {
    case 'pullover':
      return 'School Pullover'
    case 'sport_wear':
      return 'Sport Wear'
    case 'uniform':
      return 'School Uniform'
    case 't_shirt':
      return 'T-Shirt'
    default:
      return itemType
  }
}

// Edit Sale Form Component
interface EditSaleFormProps {
  sale: Sale
  onSave: (updatedSale: Sale) => void
  onCancel: () => void
  getCurrencySymbol: () => string
  formatCurrency: (amount: number) => string
}

function EditSaleForm({ sale, onSave, onCancel, getCurrencySymbol, formatCurrency }: EditSaleFormProps) {
  const [editForm, setEditForm] = useState({
    itemName: sale.itemName,
    itemType: sale.itemType,
    quantity: sale.quantity,
    unitPrice: sale.unitPrice,
    status: sale.status,
    notes: sale.notes || ''
  })

  const handleSave = () => {
    const updatedSale: Sale = {
      ...sale,
      itemName: editForm.itemName,
      itemType: editForm.itemType,
      quantity: editForm.quantity,
      unitPrice: editForm.unitPrice,
      totalAmount: editForm.quantity * editForm.unitPrice,
      status: editForm.status,
      notes: editForm.notes,
      updatedAt: new Date()
    }
    onSave(updatedSale)
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editItemType">Item Type *</Label>
          <Select value={editForm.itemType} onValueChange={(value) => {
            const itemType = value as Sale['itemType']
            const itemName = getItemNameFromType(itemType)
            setEditForm({...editForm, itemType, itemName})
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select item type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pullover">School Pullover</SelectItem>
              <SelectItem value="sport_wear">Sport Wear</SelectItem>
              <SelectItem value="uniform">School Uniform</SelectItem>
              <SelectItem value="t_shirt">T-Shirt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="editItemName">Item Name *</Label>
          <Input
            id="editItemName"
            value={editForm.itemName}
            onChange={(e) => setEditForm({...editForm, itemName: e.target.value})}
            placeholder="Auto-filled based on item type"
            className={editForm.itemType ? "bg-muted/50" : ""}
          />
          {editForm.itemType && (
            <p className="text-xs text-muted-foreground">
              Auto-filled from item type. You can edit if needed.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editQuantity">Quantity *</Label>
          <Input
            id="editQuantity"
            type="number"
            min="1"
            value={editForm.quantity}
            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editUnitPrice">Unit Price ({getCurrencySymbol()}) *</Label>
          <Input
            id="editUnitPrice"
            type="number"
            min="0"
            step="0.01"
            value={editForm.unitPrice}
            onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="editStatus">Status</Label>
        <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value as Sale['status']})}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="editNotes">Notes</Label>
        <Textarea
          id="editNotes"
          value={editForm.notes}
          onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
          placeholder="Add any additional notes..."
          rows={3}
        />
      </div>

      {editForm.quantity > 0 && editForm.unitPrice > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Total Amount: {formatCurrency(editForm.quantity * editForm.unitPrice)}</p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  )
}

export function SalesManagement() {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter()
  const [sales, setSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    topSellingItem: 'No sales yet',
    salesThisMonth: 0,
    revenueThisMonth: 0
  })
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterItemType, setFilterItemType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch sales data from API
  const fetchSales = async () => {
    try {
      const response = await fetch('/api/finances/sales?limit=100')
      const data = await response.json()
      
      if (response.ok) {
        const convertedSales = data.sales.map(convertApiSaleToComponent)
        setSales(convertedSales)
      } else {
        console.error('Error fetching sales:', data.error)
        toastError("Error loading sales data", {
          description: data.error || "Failed to fetch sales"
        })
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      toastError("Error loading sales data", {
        description: "Failed to connect to server"
      })
    }
  }

  // Fetch sales statistics from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/finances/sales/statistics?type=overview')
      const data = await response.json()
      
      if (response.ok) {
        const convertedStats = convertApiStatsToComponent(data)
        setStats(convertedStats)
      } else {
        console.error('Error fetching stats:', data.error)
        // Don't show error toast for stats, just use default values
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Don't show error toast for stats, just use default values
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchSales(), fetchStats()])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  // Form state for new sale
  const [newSale, setNewSale] = useState({
    studentName: '',
    itemType: '' as Sale['itemType'] | '',
    itemName: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  })

  // Selected student state
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Quick actions state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)

  // Handle student selection
  const handleStudentSelect = (student: SelectedStudent | null) => {
    setSelectedStudent(student)
    if (student) {
      setNewSale(prev => ({
        ...prev,
        studentName: student.fullName
      }))
    } else {
      setNewSale(prev => ({
        ...prev,
        studentName: ''
      }))
    }
  }

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus
    const matchesItemType = filterItemType === 'all' || sale.itemType === filterItemType
    
    return matchesSearch && matchesStatus && matchesItemType
  })

  // Handle adding new sale
  const handleAddSale = async () => {
    if (!selectedStudent || !newSale.itemType || !newSale.itemName || newSale.unitPrice <= 0) {
      toastError("Validation Error", {
        description: "Please fill in all required fields and select a student"
      })
      return
    }

    try {
      const saleData = {
        student_id: selectedStudent.studentId,
        student_name: selectedStudent.fullName,
        item_type: newSale.itemType,
        item_name: newSale.itemName,
        quantity: newSale.quantity,
        unit_price: newSale.unitPrice,
        notes: newSale.notes || undefined,
        created_by: 'admin'
      }


      const response = await fetch('/api/finances/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh data from server
        await Promise.all([fetchSales(), fetchStats()])
        
        // Show success message briefly before closing
        setShowSuccessMessage(true)
        setTimeout(() => {
          setIsAddSaleOpen(false)
          setShowSuccessMessage(false)
        }, 1500)

        // Show success toast
        toastSuccess("Sale Recorded Successfully! 🎉", {
          description: `${newSale.itemName} sold to ${selectedStudent.fullName} for ${formatCurrency(newSale.quantity * newSale.unitPrice)}`
        })
        
        // Reset form
        setNewSale({
          studentName: '',
          itemType: '',
          itemName: '',
          quantity: 1,
          unitPrice: 0,
          notes: ''
        })
        setSelectedStudent(null)
      } else {
        toastError("Failed to record sale", {
          description: data.error || "An unknown error occurred"
        })
      }
    } catch (error) {
      console.error('Error creating sale:', error)
      toastError("Failed to record sale", {
        description: "Failed to connect to server"
      })
    }
  }

  // Quick action handlers
  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowViewDialog(true)
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowEditDialog(true)
  }

  const handleDeleteSale = (sale: Sale) => {
    setSaleToDelete(sale)
    setShowDeleteDialog(true)
  }

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      try {
        const response = await fetch(`/api/finances/sales?id=${saleToDelete.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Refresh data from server
          await Promise.all([fetchSales(), fetchStats()])
          
          setShowDeleteDialog(false)
          setSaleToDelete(null)
          
          toastSuccess("Sale Deleted", {
            description: `Sale ${saleToDelete.id} has been successfully deleted.`
          })
        } else {
          toastError("Failed to delete sale", {
            description: data.error || "An unknown error occurred"
          })
        }
      } catch (error) {
        console.error('Error deleting sale:', error)
        toastError("Failed to delete sale", {
          description: "Failed to connect to server"
        })
      }
    }
  }

  const handleUpdateSale = async (updatedSale: Sale) => {
    try {
      const updateData = {
        id: updatedSale.id,
        student_name: updatedSale.studentName,
        item_type: updatedSale.itemType,
        item_name: updatedSale.itemName,
        quantity: updatedSale.quantity,
        unit_price: updatedSale.unitPrice,
        total_amount: updatedSale.totalAmount,
        status: updatedSale.status,
        notes: updatedSale.notes || undefined
      }

      const response = await fetch('/api/finances/sales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh data from server
        await Promise.all([fetchSales(), fetchStats()])
        
        setShowEditDialog(false)
        setSelectedSale(null)
        
        toastSuccess("Sale Updated", {
          description: `Sale ${updatedSale.id} has been successfully updated.`
        })
      } else {
        toastError("Failed to update sale", {
          description: data.error || "An unknown error occurred"
        })
      }
    } catch (error) {
      console.error('Error updating sale:', error)
      toastError("Failed to update sale", {
        description: "Failed to connect to server"
      })
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get item type display name
  const getItemTypeDisplay = (itemType: Sale['itemType']) => {
    switch (itemType) {
      case 'pullover':
        return 'School Pullover'
      case 'sport_wear':
        return 'Sport Wear'
      case 'uniform':
        return 'School Uniform'
      case 't_shirt':
        return 'T-Shirt'
      default:
        return itemType
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">Manage school merchandise sales and track revenue</p>
        </div>
        <Dialog open={isAddSaleOpen} onOpenChange={setIsAddSaleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Add a new sales transaction for school merchandise
              </DialogDescription>
            </DialogHeader>
            
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Sale Recorded Successfully!
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      The sale has been added to the system. This dialog will close automatically.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`grid gap-4 py-4 ${showSuccessMessage ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <StudentSearch
                  value={selectedStudent}
                  onSelect={handleStudentSelect}
                  placeholder="Search for a student..."
                  disabled={showSuccessMessage}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemType">Item Type *</Label>
                  <Select value={newSale.itemType} onValueChange={(value) => {
                    const itemType = value as Sale['itemType']
                    const itemName = getItemNameFromType(itemType)
                    setNewSale({...newSale, itemType, itemName})
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pullover">School Pullover</SelectItem>
                      <SelectItem value="sport_wear">Sport Wear</SelectItem>
                      <SelectItem value="uniform">School Uniform</SelectItem>
                      <SelectItem value="t_shirt">T-Shirt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={newSale.itemName}
                    onChange={(e) => setNewSale({...newSale, itemName: e.target.value})}
                    placeholder="Auto-filled based on item type"
                    className={newSale.itemType ? "bg-muted/50" : ""}
                  />
                  {newSale.itemType && (
                    <p className="text-xs text-muted-foreground">
                      Auto-filled from item type. You can edit if needed.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ({getCurrencySymbol()}) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSale.unitPrice}
                    onChange={(e) => setNewSale({...newSale, unitPrice: parseFloat(e.target.value) || 0})}
                    placeholder="Enter price per unit"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newSale.notes}
                  onChange={(e) => setNewSale({...newSale, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                />
              </div>
              {newSale.quantity > 0 && newSale.unitPrice > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total Amount: {formatCurrency(newSale.quantity * newSale.unitPrice)}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSaleOpen(false)} disabled={showSuccessMessage}>
                Cancel
              </Button>
              <Button onClick={handleAddSale} disabled={showSuccessMessage}>
                {showSuccessMessage ? 'Processing...' : 'Record Sale'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {stats.salesThisMonth} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.revenueThisMonth)} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">
              Across all sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Top seller: {stats.topSellingItem}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            View and manage all sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterItemType} onValueChange={setFilterItemType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pullover">Pullover</SelectItem>
                <SelectItem value="sport_wear">Sport Wear</SelectItem>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="t_shirt">T-Shirt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.studentName}</div>
                        <div className="text-sm text-muted-foreground">{sale.studentId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.itemName}</TableCell>
                    <TableCell>{getItemTypeDisplay(sale.itemType)}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{formatCurrency(sale.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell>{sale.saleDate.toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                          title="View Sale Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                          title="Edit Sale"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSale(sale)}
                          title="Delete Sale"
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

          {filteredSales.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sales found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' || filterItemType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by recording your first sale'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              View detailed information about this sale
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sale ID</Label>
                  <p className="text-sm">{selectedSale.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                  <p className="text-sm font-medium">{selectedSale.studentName}</p>
                  <p className="text-xs text-muted-foreground">{selectedSale.studentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sale Date</Label>
                  <p className="text-sm">{selectedSale.saleDate.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Item</Label>
                  <p className="text-sm font-medium">{selectedSale.itemName}</p>
                  <p className="text-xs text-muted-foreground">{getItemTypeDisplay(selectedSale.itemType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p className="text-sm">{selectedSale.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                  <p className="text-sm">{formatCurrency(selectedSale.unitPrice)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedSale.totalAmount)}</p>
                </div>
              </div>

              {selectedSale.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedSale.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                  <p className="text-sm">{selectedSale.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm">{selectedSale.createdAt.toLocaleString()}</p>
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

      {/* Edit Sale Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              Update the details of this sale
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <EditSaleForm 
              sale={selectedSale} 
              onSave={handleUpdateSale}
              onCancel={() => setShowEditDialog(false)}
              getCurrencySymbol={getCurrencySymbol}
              formatCurrency={formatCurrency}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {saleToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">Sale Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>ID:</strong> {saleToDelete.id}<br/>
                  <strong>Student:</strong> {saleToDelete.studentName}<br/>
                  <strong>Item:</strong> {saleToDelete.itemName}<br/>
                  <strong>Amount:</strong> {formatCurrency(saleToDelete.totalAmount)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSale}>
              Delete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
