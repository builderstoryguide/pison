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
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useClassManagement } from '@/lib/class-management-context'
import type { 
  FeeStructure, 
  FeeStructureFormData,
  FeeStructuresResponse 
} from '@/lib/registration-types'

// Mock data for development
const mockFeeStructures: FeeStructure[] = [
  {
    id: 'FS001',
    class: 'Form 5A',
    academic_year: '2024-2025',
    term: 'Term 1',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 200000,
    installments: 'first',
    installmentAmount: 100000,
    total_fee: 265000,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'FS002',
    class: 'Form 4B',
    academic_year: '2024-2025',
    term: 'Term 1',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 180000,
    installments: 'second',
    installmentAmount: 90000,
    total_fee: 245000,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'FS003',
    class: 'Form 3A',
    academic_year: '2024-2025',
    term: 'Term 1',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 160000,
    installments: 'first',
    installmentAmount: 80000,
    total_fee: 225000,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'FS004',
    class: 'Form 2B',
    academic_year: '2024-2025',
    term: 'Term 1',
    registration_fee: 45000,
    pta_fee: 12000,
    tuition_fee: 140000,
    installments: 'second',
    installmentAmount: 70000,
    total_fee: 197000,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'FS005',
    class: 'Form 1A',
    academic_year: '2024-2025',
    term: 'Term 1',
    registration_fee: 40000,
    pta_fee: 10000,
    tuition_fee: 120000,
    installments: 'first',
    installmentAmount: 60000,
    total_fee: 170000,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  }
]

// Fee Structure Form Component
interface FeeStructureFormProps {
  feeStructure?: FeeStructure
  onSave: (feeStructure: FeeStructureFormData) => void
  onCancel: () => void
  classes: any[]
  classesLoading: boolean
}

function FeeStructureForm({ feeStructure, onSave, onCancel, classes, classesLoading }: FeeStructureFormProps) {
  const [formData, setFormData] = useState<FeeStructureFormData>({
    class: feeStructure?.class || '',
    academic_year: feeStructure?.academic_year || '2024-2025',
    term: feeStructure?.term || 'Term 1',
    registration_fee: feeStructure?.registration_fee || 50000,
    pta_fee: feeStructure?.pta_fee || 15000,
    tuition_fee: feeStructure?.tuition_fee || 200000,
    installments: feeStructure?.installments || '',
    installmentAmount: feeStructure?.installmentAmount || 0
  })

  const handleSave = () => {
    if (!formData.class) {
      return
    }
    onSave(formData)
  }

  const totalFee = formData.registration_fee + formData.pta_fee + formData.tuition_fee

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class">Class *</Label>
          <Select value={formData.class} onValueChange={(value) => setFormData({...formData, class: value})}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classesLoading ? (
                <SelectItem value="" disabled>Loading classes...</SelectItem>
              ) : classes.length > 0 ? (
                classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.name}>
                    {classItem.name} ({classItem.level} - {classItem.subsystem})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No classes available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="academicYear">Academic Year *</Label>
          <Select value={formData.academic_year} onValueChange={(value) => setFormData({...formData, academic_year: value})}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2025-2026">2025-2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="term">Term *</Label>
        <Select value={formData.term} onValueChange={(value) => setFormData({...formData, term: value})}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Term 1">Term 1</SelectItem>
            <SelectItem value="Term 2">Term 2</SelectItem>
            <SelectItem value="Term 3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registrationFee">Reg. Fee (XOF)</Label>
          <Input
            id="registrationFee"
            type="number"
            min="0"
            value={formData.registration_fee}
            onChange={(e) => setFormData({...formData, registration_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ptaFee">PTA Fee (XOF)</Label>
          <Input
            id="ptaFee"
            type="number"
            min="0"
            value={formData.pta_fee}
            onChange={(e) => setFormData({...formData, pta_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tuitionFee">School Fees (XOF)</Label>
          <Input
            id="tuitionFee"
            type="number"
            min="0"
            value={formData.tuition_fee}
            onChange={(e) => setFormData({...formData, tuition_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installments">Installments</Label>
          <Select value={formData.installments || ''} onValueChange={(value) => setFormData({...formData, installments: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select installment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first">First Installment</SelectItem>
              <SelectItem value="second">Second Installment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="installmentAmount">Amount (XOF)</Label>
          <Input
            id="installmentAmount"
            type="number"
            min="0"
            value={formData.installmentAmount || ''}
            onChange={(e) => setFormData({...formData, installmentAmount: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium">
          Total Fee: {totalFee.toLocaleString()} XOF
        </p>
        <p className="text-xs text-muted-foreground">
          Registration: {formData.registration_fee.toLocaleString()} XOF • 
          PTA: {formData.pta_fee.toLocaleString()} XOF • 
          Tuition: {formData.tuition_fee.toLocaleString()} XOF
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {feeStructure ? 'Update Fee Structure' : 'Create Fee Structure'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function FeeStructureManagement() {
  const { toast } = useToast()
  const { classes, isLoading: classesLoading } = useClassManagement()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(mockFeeStructures)
  const [isAddFeeStructureOpen, setIsAddFeeStructureOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    academic_year: 'all',
    term: 'all',
    class: 'all',
    is_active: 'all'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Quick actions state
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [feeStructureToDelete, setFeeStructureToDelete] = useState<FeeStructure | null>(null)

  // Filter fee structures based on search and filters
  const filteredFeeStructures = feeStructures.filter(feeStructure => {
    const matchesSearch = feeStructure.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feeStructure.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAcademicYear = filters.academic_year === 'all' || feeStructure.academic_year === filters.academic_year
    const matchesTerm = filters.term === 'all' || feeStructure.term === filters.term
    const matchesClass = filters.class === 'all' || feeStructure.class === filters.class
    const matchesActive = filters.is_active === 'all' || 
                         (filters.is_active === 'active' && feeStructure.is_active) ||
                         (filters.is_active === 'inactive' && !feeStructure.is_active)
    
    return matchesSearch && matchesAcademicYear && matchesTerm && matchesClass && matchesActive
  })

  // Handle adding new fee structure
  const handleAddFeeStructure = async (formData: FeeStructureFormData) => {
    try {
      const newFeeStructure: FeeStructure = {
        id: `FS${String(Date.now()).slice(-6)}`,
        class: formData.class,
        academic_year: formData.academic_year,
        term: formData.term,
        registration_fee: formData.registration_fee,
        pta_fee: formData.pta_fee,
        tuition_fee: formData.tuition_fee,
        installments: formData.installments,
        installmentAmount: formData.installmentAmount,
        total_fee: formData.registration_fee + formData.pta_fee + formData.tuition_fee,
        is_active: true,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setFeeStructures(prev => [newFeeStructure, ...prev])
      setIsAddFeeStructureOpen(false)
      
      toast({
        title: "Fee Structure Created Successfully! 🎉",
        description: `Fee structure for ${formData.class} has been created`,
      })
    } catch (error) {
      console.error('Error creating fee structure:', error)
      toast({
        title: "Failed to create fee structure",
        description: "An error occurred while creating the fee structure",
        variant: "destructive"
      })
    }
  }

  // Handle updating fee structure
  const handleUpdateFeeStructure = async (formData: FeeStructureFormData) => {
    if (selectedFeeStructure) {
      try {
        const updatedFeeStructure = {
          ...selectedFeeStructure,
          class: formData.class,
          academic_year: formData.academic_year,
          term: formData.term,
          registration_fee: formData.registration_fee,
          pta_fee: formData.pta_fee,
          tuition_fee: formData.tuition_fee,
          installments: formData.installments,
          installmentAmount: formData.installmentAmount,
          total_fee: formData.registration_fee + formData.pta_fee + formData.tuition_fee,
          updated_at: new Date().toISOString()
        }

        setFeeStructures(prev => prev.map(fs => fs.id === selectedFeeStructure.id ? updatedFeeStructure : fs))
        setShowEditDialog(false)
        setSelectedFeeStructure(null)
        
        toast({
          title: "Fee Structure Updated",
          description: `Fee structure for ${formData.class} has been updated`,
        })
      } catch (error) {
        console.error('Error updating fee structure:', error)
        toast({
          title: "Failed to update fee structure",
          description: "An error occurred while updating the fee structure",
          variant: "destructive"
        })
      }
    }
  }

  // Quick action handlers
  const handleViewFeeStructure = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure)
    setShowViewDialog(true)
  }

  const handleEditFeeStructure = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure)
    setShowEditDialog(true)
  }

  const handleCopyFeeStructure = (feeStructure: FeeStructure) => {
    const newFeeStructure: FeeStructure = {
      ...feeStructure,
      id: `FS${String(Date.now()).slice(-6)}`,
      class: `${feeStructure.class} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setFeeStructures(prev => [newFeeStructure, ...prev])
    
    toast({
      title: "Fee Structure Copied",
      description: `Fee structure for ${feeStructure.class} has been copied`,
    })
  }

  const handleDeleteFeeStructure = (feeStructure: FeeStructure) => {
    setFeeStructureToDelete(feeStructure)
    setShowDeleteDialog(true)
  }

  const confirmDeleteFeeStructure = async () => {
    if (feeStructureToDelete) {
      setFeeStructures(prev => prev.filter(fs => fs.id !== feeStructureToDelete.id))
      setShowDeleteDialog(false)
      setFeeStructureToDelete(null)
      
      toast({
        title: "Fee Structure Deleted",
        description: `Fee structure ${feeStructureToDelete.id} has been successfully deleted.`,
      })
    }
  }

  const handleToggleActive = (feeStructure: FeeStructure) => {
    const updatedFeeStructure = {
      ...feeStructure,
      is_active: !feeStructure.is_active,
      updated_at: new Date().toISOString()
    }

    setFeeStructures(prev => prev.map(fs => fs.id === feeStructure.id ? updatedFeeStructure : fs))
    
    toast({
      title: "Fee Structure Updated",
      description: `Fee structure for ${feeStructure.class} has been ${updatedFeeStructure.is_active ? 'activated' : 'deactivated'}`,
    })
  }

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  // Calculate statistics
  const stats = {
    total_structures: feeStructures.length,
    active_structures: feeStructures.filter(fs => fs.is_active).length,
    total_revenue_potential: feeStructures.reduce((sum, fs) => sum + fs.total_fee, 0),
    average_fee: feeStructures.length > 0 ? feeStructures.reduce((sum, fs) => sum + fs.total_fee, 0) / feeStructures.length : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structure Management</h1>
          <p className="text-muted-foreground">Manage fee structures for different classes and terms</p>
        </div>
        <Dialog open={isAddFeeStructureOpen} onOpenChange={setIsAddFeeStructureOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Fee Structure</DialogTitle>
              <DialogDescription>
                Set up fee structure for a specific class, academic year, and term
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <FeeStructureForm 
                onSave={handleAddFeeStructure}
                onCancel={() => setIsAddFeeStructureOpen(false)}
                classes={classes}
                classesLoading={classesLoading}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_structures}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_structures} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_revenue_potential.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              If all students pay
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.average_fee).toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              Per student
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_structures > 0 ? Math.round((stats.active_structures / stats.total_structures) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Structures active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>
            View and manage all fee structures for different classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fee structures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
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
            <Select value={filters.term} onValueChange={(value) => setFilters({...filters, term: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.is_active} onValueChange={(value) => setFilters({...filters, is_active: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Reg. Fee</TableHead>
                  <TableHead>PTA Fee</TableHead>
                  <TableHead>School Fees</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeStructures.map((feeStructure) => (
                  <TableRow key={feeStructure.id}>
                    <TableCell className="font-medium">{feeStructure.id}</TableCell>
                    <TableCell className="font-medium">{feeStructure.class}</TableCell>
                    <TableCell>{feeStructure.academic_year}</TableCell>
                    <TableCell>{feeStructure.term}</TableCell>
                    <TableCell>{feeStructure.registration_fee.toLocaleString()} XOF</TableCell>
                    <TableCell>{feeStructure.pta_fee.toLocaleString()} XOF</TableCell>
                    <TableCell>{feeStructure.tuition_fee.toLocaleString()} XOF</TableCell>
                    <TableCell>{feeStructure.installments ? feeStructure.installments.charAt(0).toUpperCase() + feeStructure.installments.slice(1) : '-'}</TableCell>
                    <TableCell>{feeStructure.installmentAmount ? feeStructure.installmentAmount.toLocaleString() + ' XOF' : '-'}</TableCell>
                    <TableCell className="font-medium">{feeStructure.total_fee.toLocaleString()} XOF</TableCell>
                    <TableCell>{getStatusBadge(feeStructure.is_active)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewFeeStructure(feeStructure)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditFeeStructure(feeStructure)}
                          title="Edit Fee Structure"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyFeeStructure(feeStructure)}
                          title="Copy Fee Structure"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleActive(feeStructure)}
                          title={feeStructure.is_active ? "Deactivate" : "Activate"}
                          className={feeStructure.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                        >
                          {feeStructure.is_active ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteFeeStructure(feeStructure)}
                          title="Delete Fee Structure"
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

          {filteredFeeStructures.length === 0 && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fee structures found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filters.academic_year !== 'all' || filters.term !== 'all' || filters.is_active !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by creating your first fee structure'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Fee Structure Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Fee Structure Details</DialogTitle>
            <DialogDescription>
              View detailed information about this fee structure
            </DialogDescription>
          </DialogHeader>
          {selectedFeeStructure && (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fee Structure ID</Label>
                    <p className="text-sm">{selectedFeeStructure.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedFeeStructure.is_active)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                    <p className="text-sm font-medium">{selectedFeeStructure.class}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                    <p className="text-sm">{selectedFeeStructure.academic_year}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Term</Label>
                    <p className="text-sm">{selectedFeeStructure.term}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                    <p className="text-sm">{selectedFeeStructure.created_by}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reg. Fee</Label>
                    <p className="text-sm">{selectedFeeStructure.registration_fee.toLocaleString()} XOF</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">PTA Fee</Label>
                    <p className="text-sm">{selectedFeeStructure.pta_fee.toLocaleString()} XOF</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">School Fees</Label>
                    <p className="text-sm">{selectedFeeStructure.tuition_fee.toLocaleString()} XOF</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Installment</Label>
                    <p className="text-sm">{selectedFeeStructure.installments ? selectedFeeStructure.installments.charAt(0).toUpperCase() + selectedFeeStructure.installments.slice(1) : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <p className="text-sm">{selectedFeeStructure.installmentAmount ? selectedFeeStructure.installmentAmount.toLocaleString() + ' XOF' : 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Total Fee</Label>
                  <p className="text-lg font-bold">{selectedFeeStructure.total_fee.toLocaleString()} XOF</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p className="text-sm">{new Date(selectedFeeStructure.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                    <p className="text-sm">{new Date(selectedFeeStructure.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Structure Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              Update the details of this fee structure
            </DialogDescription>
          </DialogHeader>
          {selectedFeeStructure && (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <FeeStructureForm 
                feeStructure={selectedFeeStructure}
                onSave={handleUpdateFeeStructure}
                onCancel={() => setShowEditDialog(false)}
                classes={classes}
                classesLoading={classesLoading}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Structure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee structure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {feeStructureToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">Fee Structure Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>ID:</strong> {feeStructureToDelete.id}<br/>
                  <strong>Class:</strong> {feeStructureToDelete.class}<br/>
                  <strong>Academic Year:</strong> {feeStructureToDelete.academic_year}<br/>
                  <strong>Total Fee:</strong> {feeStructureToDelete.total_fee.toLocaleString()} XOF
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFeeStructure}>
              Delete Fee Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
