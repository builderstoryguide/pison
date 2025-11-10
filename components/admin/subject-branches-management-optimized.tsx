'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useClassManagement } from '@/lib/class-management-context'
import { ShimmerSubjectBranchesManagement } from '@/components/ui/shimmer-loading'
import { SimpleTable } from '@/components/ui/simple-table'
import { 
  useSubjectBranchesOptimized, 
  usePrefetchSubjectBranches,
  useCreateSubjectBranchOptimized,
  useDeleteSubjectBranchOptimized
} from '@/hooks/use-subject-branches-optimized'
import { useSubjects } from '@/hooks/use-subjects'
import { Plus, Edit, Trash2, Users, BookOpen, GraduationCap, Calculator, Loader2 } from 'lucide-react'
import type { 
  SubjectBranchWithDetails, 
  CreateSubjectBranchRequest
} from '@/lib/subject-branches-types'

interface Teacher {
  id: string
  teacher_id: string
  first_name: string
  last_name: string
  email: string
}

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
}

export default function SubjectBranchesManagementOptimized() {
  const { toast } = useToast()
  const { classes: contextClasses, isLoading: classesLoading } = useClassManagement()
  
  // React Query hooks - Performance monitor removed
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects()
  const { prefetchBranches } = usePrefetchSubjectBranches()
  const createBranchMutation = useCreateSubjectBranchOptimized()
  const deleteBranchMutation = useDeleteSubjectBranchOptimized()
  
  // State management
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [term, setTerm] = useState('Term 1')
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Dialog states
  const [createBranchOpen, setCreateBranchOpen] = useState(false)
  
  // Form state
  const [branchForm, setBranchForm] = useState<CreateSubjectBranchRequest>({
    subject_id: '',
    branch_name: '',
    branch_code: '',
    description: '',
    weight_percentage: 100,
    is_optional: false,
    academic_year: '2024-2025',
    term: 'Term 1'
  })

  // Use optimized query with pagination
  const branchesQuery = useSubjectBranchesOptimized({
    subjectId: selectedSubject === 'all' ? undefined : selectedSubject,
    academicYear,
    term,
    isActive,
    page: currentPage,
    pageSize
  })
  
  const branchesData = branchesQuery.data
  const branchesLoading = branchesQuery.isLoading
  const branchesError = branchesQuery.error
  const refetchBranches = branchesQuery.refetch


  // Prefetch next page for better UX
  useEffect(() => {
    if (branchesData?.hasMore) {
      prefetchBranches({
        subjectId: selectedSubject === 'all' ? undefined : selectedSubject,
        academicYear,
        term,
        isActive,
        page: currentPage + 1,
        pageSize
      })
    }
  }, [branchesData?.hasMore, currentPage, selectedSubject, academicYear, term, isActive, pageSize, prefetchBranches])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSubject, academicYear, term, isActive])

  // Handle form submission
  const handleCreateBranch = useCallback(async () => {
    if (!branchForm.subject_id || !branchForm.branch_name || !branchForm.branch_code) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    createBranchMutation.mutate(branchForm, {
      onSuccess: () => {
        setCreateBranchOpen(false)
        setBranchForm({
          subject_id: '',
          branch_name: '',
          branch_code: '',
          description: '',
          weight_percentage: 100,
          is_optional: false,
          academic_year: '2024-2025',
          term: 'Term 1'
        })
      }
    })
  }, [branchForm, createBranchMutation, toast])

  // Handle branch deletion
  const handleDeleteBranch = useCallback((branchId: string) => {
    deleteBranchMutation.mutate(branchId)
  }, [deleteBranchMutation])

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'branch_name' as keyof SubjectBranchWithDetails,
      label: 'Branch Name',
      width: 200,
      sortable: true,
      filterable: true,
      render: (value: string, item: SubjectBranchWithDetails) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
          {item.is_optional && (
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          )}
        </div>
      )
    },
    {
      key: 'branch_code' as keyof SubjectBranchWithDetails,
      label: 'Code',
      width: 100,
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'subject' as keyof SubjectBranchWithDetails,
      label: 'Subject',
      width: 150,
      sortable: true,
      filterable: true,
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span>{value?.subject_name}</span>
        </div>
      )
    },
    {
      key: 'weight_percentage' as keyof SubjectBranchWithDetails,
      label: 'Weight',
      width: 100,
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span>{value}%</span>
        </div>
      )
    },
    {
      key: 'teachers' as keyof SubjectBranchWithDetails,
      label: 'Teachers',
      width: 120,
      sortable: false,
      render: (value: any[]) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'enrolled_students_count' as keyof SubjectBranchWithDetails,
      label: 'Students',
      width: 100,
      sortable: true,
      render: (value: number) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: 'is_active' as keyof SubjectBranchWithDetails,
      label: 'Status',
      width: 100,
      sortable: true,
      filterable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions' as keyof SubjectBranchWithDetails,
      label: 'Actions',
      width: 120,
      sortable: false,
      render: (_: any, item: SubjectBranchWithDetails) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Handle edit
              console.log('Edit branch:', item.id)
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBranch(item.id)}
            disabled={deleteBranchMutation.isPending}
            className="h-8 w-8 p-0"
          >
            {deleteBranchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )
    }
  ], [handleDeleteBranch, deleteBranchMutation.isPending])

  // Loading state
  if (subjectsLoading || branchesLoading) {
    return <ShimmerSubjectBranchesManagement />
  }

  // Error state
  if (branchesError) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load subject branches. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const branches = branchesData?.branches || []
  const totalCount = branchesData?.total || 0
  const hasMore = branchesData?.hasMore || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subject Branches Management</h2>
          <p className="text-muted-foreground">
            Manage subject branches with optimized performance
          </p>
        </div>
        <div className="flex items-center justify-end gap-4">
          <Dialog open={createBranchOpen} onOpenChange={setCreateBranchOpen}>
            <DialogTrigger asChild>
            <Button className="h-8 w-8 p-0" aria-label="Create branch">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subject Branch</DialogTitle>
              <DialogDescription>
                Add a new branch to an existing subject
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={branchForm.subject_id}
                    onValueChange={(value) => setBranchForm(prev => ({ ...prev, subject_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_code">Branch Code *</Label>
                  <Input
                    id="branch_code"
                    value={branchForm.branch_code}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, branch_code: e.target.value }))}
                    placeholder="e.g., PURE, MECH, STAT"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_name">Branch Name *</Label>
                <Input
                  id="branch_name"
                  value={branchForm.branch_name}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, branch_name: e.target.value }))}
                  placeholder="e.g., Pure Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={branchForm.description}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this branch..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight %</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    value={branchForm.weight_percentage}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, weight_percentage: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={branchForm.academic_year}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    value={branchForm.term}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, term: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateBranchOpen(false)}
                disabled={createBranchMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBranch}
                disabled={createBranchMutation.isPending}
              >
                {createBranchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Branch'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024-2025"
              />
            </div>
            <div>
              <Label>Term</Label>
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Term 1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={isActive === undefined ? 'all' : isActive.toString()} 
                onValueChange={(value) => setIsActive(value === 'all' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {branches.length} of {totalCount} branches
        </div>
        <div className="flex items-center gap-2">
          <Label>Page size:</Label>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Virtualized Table */}
      <Card>
        <CardContent className="p-0">
          <SimpleTable
            data={branches}
            columns={columns}
            height={600}
            searchable={true}
            filterable={true}
            sortable={true}
            emptyMessage="No subject branches found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
