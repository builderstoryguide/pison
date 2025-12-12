"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, MoreHorizontal, Calendar, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useGlobalAcademicYear, useCurrencyFormatter } from "@/lib/app-configuration-context-v2"
import { EnhancedFeeStructureForm } from "./enhanced-fee-structure-form"
import { format } from "date-fns"
import { Pagination } from "@/components/ui/pagination"

interface FeeStructure {
  id: string
  name: string
  classId: string
  className: string
  subsystem: string
  branch: string
  academicYear: string
  term: string
  dueDate: string
  totalAmount: number
  numberOfInstallments?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function EnhancedFeeStructureManagement() {
  const { success: toastSuccess, error: toastError } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const { formatCurrency } = useCurrencyFormatter()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all")
  const [termFilter, setTermFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null)
  
  // Pagination state
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter fee structures
  const filteredFeeStructures = feeStructures.filter((structure) => {
    const matchesSearch = structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         structure.className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAcademicYear = academicYearFilter === "all" || structure.academicYear === academicYearFilter
    const matchesTerm = termFilter === "all" || structure.term === termFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && structure.isActive) ||
                         (statusFilter === "inactive" && !structure.isActive)

    return matchesSearch && matchesAcademicYear && matchesTerm && matchesStatus
  })

  // Reset pagination and selection when filters change
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
  }, [searchTerm, academicYearFilter, termFilter, statusFilter])

  // Pagination calculations
  const totalItems = filteredFeeStructures.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFeeStructures = filteredFeeStructures.slice(startIndex, endIndex)

  // Generate academic year options dynamically
  const getAcademicYearOptions = () => {
    const currentYear = parseInt(globalAcademicYear.split('-')[0])
    const years = []
    for (let i = -1; i <= 1; i++) {
      const year = currentYear + i
      years.push(`${year}-${year + 1}`)
    }
    return years
  }

  const loadFeeStructures = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bursar/fee-structures')
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data)
      } else {
        toastError("Error loading fee structures", {
          description: "Failed to load fee structures"
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading fee structures:", error)
      toastError("Error loading fee structures", {
        description: "Failed to load fee structures"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeeStructures()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/bursar/fee-structures/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toastSuccess("Fee structure deleted", {
          description: "Fee structure deleted successfully"
        })
        loadFeeStructures()
        setSelectedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      } else {
        toastError("Error deleting fee structure", {
          description: result.error || "Failed to delete fee structure"
        })
      }
    } catch (_error) {
      toastError("Error deleting fee structure", {
        description: "Failed to delete fee structure"
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} fee structures? This action cannot be undone.`)) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/bursar/fee-structures/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const result = await response.json()

      if (result.success) {
        toastSuccess("Fee structures deleted", {
          description: result.deletedCount ? `${result.deletedCount} fee structures deleted successfully` : "Fee structures deleted successfully"
        })
        loadFeeStructures()
        setSelectedIds(new Set())
      } else {
        toastError("Error deleting fee structures", {
          description: result.error || "Failed to delete fee structures"
        })
      }
    } catch (error) {
      console.error("Error bulk deleting fee structures:", error)
      toastError("Error deleting fee structures", {
        description: "Failed to delete fee structures"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedIds)
      paginatedFeeStructures.forEach(fs => newSelected.add(fs.id))
      setSelectedIds(newSelected)
    } else {
      const newSelected = new Set(selectedIds)
      paginatedFeeStructures.forEach(fs => newSelected.delete(fs.id))
      setSelectedIds(newSelected)
    }
  }

  const isAllPaginatedSelected = paginatedFeeStructures.length > 0 && paginatedFeeStructures.every(fs => selectedIds.has(fs.id))

  const handleFormSuccess = (_feeStructureId: string) => {
    setShowCreateForm(false)
    setEditingFeeStructure(null)
    loadFeeStructures()
    toastSuccess("Fee structure created", {
      description: "Fee structure created successfully"
    })
  }

  const handleFormCancel = () => {
    setShowCreateForm(false)
    setEditingFeeStructure(null)
  }

  const handleEdit = (feeStructure: FeeStructure) => {
    setEditingFeeStructure(feeStructure)
    setShowCreateForm(true)
  }



  // Calculate statistics
  const totalFeeStructures = feeStructures.length
  const activeFeeStructures = feeStructures.filter(fs => fs.isActive).length
  const totalAmount = feeStructures.reduce((sum, fs) => sum + fs.totalAmount, 0)
  const averageAmount = totalFeeStructures > 0 ? totalAmount / totalFeeStructures : 0

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Fee Structure Management</h1>
          <p className="text-muted-foreground">
            Create and manage fee structures for multiple classes with installment support
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fee Structures</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeeStructures}</div>
            <p className="text-xs text-muted-foreground">
              Across all classes and terms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Structures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFeeStructures}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Combined value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Per structure
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search fee structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getAcademicYearOptions().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="first">First Term</SelectItem>
                  <SelectItem value="second">Second Term</SelectItem>
                  <SelectItem value="third">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>
            {filteredFeeStructures.length} fee structure(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={isAllPaginatedSelected}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeeStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || academicYearFilter !== "all" || termFilter !== "all" || statusFilter !== "all"
                        ? "No fee structures match your filters"
                        : "No fee structures found. Create your first one!"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFeeStructures.map((feeStructure) => (
                  <TableRow key={feeStructure.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(feeStructure.id)}
                        onCheckedChange={() => toggleSelection(feeStructure.id)}
                        aria-label={`Select ${feeStructure.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{feeStructure.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {feeStructure.subsystem} • {feeStructure.branch}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{feeStructure.className}</TableCell>
                    <TableCell>{feeStructure.academicYear}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {feeStructure.term} Term
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(feeStructure.totalAmount)}</div>
                      {feeStructure.numberOfInstallments && feeStructure.numberOfInstallments > 1 && (
                        <div className="text-xs text-muted-foreground">
                          {feeStructure.numberOfInstallments} installments
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(feeStructure.dueDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={feeStructure.isActive ? "default" : "secondary"}>
                        {feeStructure.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(feeStructure)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(feeStructure.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage) => {
          setItemsPerPage(newPerPage)
          setCurrentPage(1)
        }}
        startIndex={startIndex}
        endIndex={endIndex}
        itemLabel="fee structures"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFeeStructure ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
          </DialogHeader>
          <EnhancedFeeStructureForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editData={editingFeeStructure}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
