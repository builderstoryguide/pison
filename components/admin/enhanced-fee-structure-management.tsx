"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Calendar, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { EnhancedFeeStructureForm } from "./enhanced-fee-structure-form"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/currency-utils"

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
  const { toast } = useToast()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all")
  const [termFilter, setTermFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null)

  useEffect(() => {
    loadFeeStructures()
  }, [])

  const loadFeeStructures = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bursar/fee-structures')
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load fee structures",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading fee structures:", error)
      toast({
        title: "Error",
        description: "Failed to load fee structures",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Currency formatting is now handled by the centralized utility

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/bursar/fee-structures/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Fee structure deleted successfully"
        })
        loadFeeStructures()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete fee structure",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee structure",
        variant: "destructive"
      })
    }
  }

  const handleFormSuccess = (feeStructureId: string) => {
    setShowCreateForm(false)
    setEditingFeeStructure(null)
    loadFeeStructures()
    toast({
      title: "Success",
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
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Fee Structure
        </Button>
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
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
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
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || academicYearFilter !== "all" || termFilter !== "all" || statusFilter !== "all"
                        ? "No fee structures match your filters"
                        : "No fee structures found. Create your first one!"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeeStructures.map((feeStructure) => (
                  <TableRow key={feeStructure.id}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
