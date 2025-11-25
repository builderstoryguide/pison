"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Download, RefreshCw, AlertCircle, BookOpen, X, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

import { useSubjectManagement, Subject, SubBranch, SubjectFilters, SUBJECT_GROUPINGS } from '@/lib/subject-management-context'
import { SubjectForm } from './subject-form'
import { ShimmerDataTable } from '@/components/ui/shimmer-loading'

export function SubjectManagement() {
  const { success: toastSuccess, error: toastError } = useToast()
  const {
    subjects,
    isLoading,
    error,
    loadSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    toggleStatus,
    search,
    filter,
    refreshSubjects,
  } = useSubjectManagement()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SubjectFilters>({})
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Load subjects on mount
  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  // Get filtered and searched subjects
  const filteredSubjects = filter(filters)
  const displaySubjects = searchQuery ? search(searchQuery) : filteredSubjects

  // Pagination logic
  const totalPages = Math.ceil(displaySubjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSubjects = displaySubjects.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleCreateSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>, subBranches?: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>[]) => {
    const result = await createSubject(subjectData, subBranches)
    if (result.success) {
      toastSuccess('Subject created successfully', 'The subject has been added to the system.')
      setShowCreateDialog(false)
    } else {
      toastError('Failed to create subject', error || 'An error occurred while creating the subject.')
    }
  }

  const handleUpdateSubject = async (subjectId: string, subjectData: Partial<Subject>) => {
    const success = await updateSubject(subjectId, subjectData)
    if (success) {
      toastSuccess('Subject updated successfully', 'The subject has been updated.')
      setShowEditDialog(false)
      setSelectedSubject(null)
    } else {
      toastError('Failed to update subject', error || 'An error occurred while updating the subject.')
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    const success = await deleteSubject(subjectId)
    if (success) {
      toastSuccess('Subject deleted successfully', 'The subject has been removed from the system.')
      setShowDeleteDialog(false)
      setSelectedSubject(null)
    } else {
      toastError('Failed to delete subject', error || 'An error occurred while deleting the subject.')
    }
  }

  const handleToggleStatus = async (subjectId: string, isActive: boolean) => {
    const success = await toggleStatus(subjectId, isActive)
    if (success) {
      toastSuccess(
        isActive ? 'Subject activated' : 'Subject deactivated',
        `The subject has been ${isActive ? 'activated' : 'deactivated'}.`
      )
    } else {
      toastError('Failed to update status', error || 'An error occurred while updating the subject status.')
    }
  }

  const exportSubjects = () => {
    const csvContent = [
      ['Name', 'Code', 'Has Sub-Branches', 'Coefficient', 'Sub-Branches', 'Status', 'Created At'].join(','),
      ...displaySubjects.map(subject => [
        subject.name,
        subject.code || 'N/A',
        subject.has_sub_branches ? 'Yes' : 'No',
        subject.has_sub_branches ? 'N/A' : (subject.coefficient || 1.0).toString(),
        subject.has_sub_branches 
          ? (subject.sub_branches || []).map(sb => `${sb.name} (${sb.coefficient})`).join('; ') 
          : 'N/A',
        subject.is_active ? 'Active' : 'Inactive',
        new Date(subject.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subjects.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const subjectStats = {
    total: subjects.length,
    active: subjects.filter(s => s.is_active).length,
    inactive: subjects.filter(s => !s.is_active).length,
    withSubBranches: subjects.filter(s => s.has_sub_branches).length,
    simple: subjects.filter(s => !s.has_sub_branches).length,
  }

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">No subjects found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by creating your first subject. You can add sub-branches later if needed.
      </p>
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Subject
      </Button>
    </div>
  )

  // Loading state component
  const LoadingState = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subject Management</h2>
          <p className="text-muted-foreground">Manage subjects and sub-branches</p>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ShimmerDataTable rows={8} columns={6} />
        </CardContent>
      </Card>
    </div>
  )

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load subjects</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button onClick={refreshSubjects} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  if (isLoading && subjects.length === 0) {
    return <LoadingState />
  }

  if (error && subjects.length === 0) {
    return <ErrorState message={error} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subject Management</h2>
          <p className="text-muted-foreground">
            Manage subjects and sub-branches for the application
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshSubjects}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSubjects} disabled={subjects.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to the system. You can add sub-branches later if needed.
                </DialogDescription>
              </DialogHeader>
              <SubjectForm 
                onSuccess={(subjectData, subBranches) => {
                  handleCreateSubject(subjectData, subBranches)
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {subjectStats.active} active, {subjectStats.inactive} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active subjects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Sub-Branches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.withSubBranches}</div>
            <p className="text-xs text-muted-foreground">
              Subjects with sub-branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simple Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.simple}</div>
            <p className="text-xs text-muted-foreground">
              Subjects without sub-branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Deactivated subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter subjects by status and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => {
                setFilters({
                  ...filters,
                  is_active: value === 'all' ? undefined : value === 'active',
                })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.has_sub_branches === undefined ? 'all' : filters.has_sub_branches ? 'with' : 'without'}
              onValueChange={(value) => {
                setFilters({
                  ...filters,
                  has_sub_branches: value === 'all' ? undefined : value === 'with',
                })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="with">With Sub-Branches</SelectItem>
                <SelectItem value="without">Simple Subjects</SelectItem>
              </SelectContent>
            </Select>
            {(filters.is_active !== undefined || filters.has_sub_branches !== undefined || searchQuery) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({})
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      {displaySubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>
              {displaySubjects.length} subject{displaySubjects.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Groupings</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coefficient</TableHead>
                  <TableHead>Sub-Branches</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.code || '-'}</TableCell>
                    <TableCell>
                      {subject.subject_groupings && subject.subject_groupings.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {subject.subject_groupings.map((grouping) => (
                            <Badge key={grouping} variant="secondary" className="text-xs">
                              {SUBJECT_GROUPINGS[grouping]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.has_sub_branches ? 'default' : 'outline'}>
                        {subject.has_sub_branches ? 'With Sub-Branches' : 'Simple'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subject.has_sub_branches ? (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      ) : (
                        <Badge variant="secondary">
                          {subject.coefficient || 1.0}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.has_sub_branches && subject.sub_branches ? (
                        <div className="flex flex-col gap-1">
                          {subject.sub_branches.slice(0, 2).map((sb) => (
                            <Badge key={sb.id} variant="secondary" className="w-fit">
                              {sb.name} (coeff: {sb.coefficient})
                            </Badge>
                          ))}
                          {subject.sub_branches.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{subject.sub_branches.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSubject(subject)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSubject(subject)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(subject.id, !subject.is_active)}
                          >
                            {subject.is_active ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedSubject(subject)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Items per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {selectedSubject && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>
                Update subject information and sub-branches
              </DialogDescription>
            </DialogHeader>
            <SubjectForm
              subject={selectedSubject}
              onSuccess={(subjectData, subBranches) => {
                handleUpdateSubject(selectedSubject.id, subjectData)
              }}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedSubject(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Details Dialog */}
      {selectedSubject && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSubject.name}</DialogTitle>
              <DialogDescription>Subject details and sub-branches</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Code</Label>
                <p className="text-sm text-muted-foreground">{selectedSubject.code || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground">{selectedSubject.description || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Subject Groupings</Label>
                {selectedSubject.subject_groupings && selectedSubject.subject_groupings.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSubject.subject_groupings.map((grouping) => (
                      <Badge key={grouping} variant="secondary">
                        {SUBJECT_GROUPINGS[grouping]}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No groupings assigned</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Badge variant={selectedSubject.has_sub_branches ? 'default' : 'outline'}>
                  {selectedSubject.has_sub_branches ? 'With Sub-Branches' : 'Simple Subject'}
                </Badge>
              </div>
              {!selectedSubject.has_sub_branches && (
                <div>
                  <Label className="text-sm font-medium">Coefficient</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary">
                      {selectedSubject.coefficient || 1.0}
                    </Badge>
                  </p>
                </div>
              )}
              {selectedSubject.has_sub_branches && selectedSubject.sub_branches && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Sub-Branches</Label>
                  <div className="space-y-2">
                    {selectedSubject.sub_branches.map((sb) => (
                      <Card key={sb.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{sb.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Coefficient: {sb.coefficient}
                              </p>
                              {sb.description && (
                                <p className="text-sm text-muted-foreground mt-1">{sb.description}</p>
                              )}
                            </div>
                            <Badge variant={sb.is_active ? 'default' : 'secondary'}>
                              {sb.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject
              {selectedSubject?.has_sub_branches && selectedSubject?.sub_branches && selectedSubject.sub_branches.length > 0
                ? ` and all its ${selectedSubject.sub_branches.length} sub-branch${selectedSubject.sub_branches.length !== 1 ? 'es' : ''}`
                : ''}
              {selectedSubject && ` "${selectedSubject.name}"`}.
              {selectedSubject && selectedSubject.has_sub_branches && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This subject has sub-branches. Deleting it will also delete all associated sub-branches.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSubject && handleDeleteSubject(selectedSubject.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

