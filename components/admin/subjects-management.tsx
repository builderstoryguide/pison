'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { ShimmerSubjectsManagement } from '@/components/ui/shimmer-loading'
import { useSubjects, useCreateSubject, useDeleteSubject, usePrefetchSubject } from '@/hooks/use-subjects'
import { Plus, Edit, Trash2, Users, BookOpen, GraduationCap, Calculator, Settings } from 'lucide-react'
import SubjectBranchesManagementOptimized from './subject-branches-management-optimized'

interface Subject {
  id: string
  subject_name: string
  subject_code: string
  subsystem: string
  class_levels: string[]
  description: string | null
  is_core: boolean
  status: string
  created_at: string
  updated_at: string
}

interface CreateSubjectRequest {
  subject_name: string
  subject_code: string
  subsystem: string
  class_levels: string[]
  description?: string
  is_core?: boolean
}

export default function SubjectsManagement() {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  
  // React Query hooks
  const { data: subjects = [], isLoading, error } = useSubjects()
  const createSubjectMutation = useCreateSubject()
  const deleteSubjectMutation = useDeleteSubject()
  const prefetchSubject = usePrefetchSubject()
  
  // UI state
  const [activeTab, setActiveTab] = useState('subjects')
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)
  
  // Form state
  const [subjectForm, setSubjectForm] = useState<CreateSubjectRequest>({
    subject_name: '',
    subject_code: '',
    subsystem: 'english',
    class_levels: [],
    description: '',
    is_core: false
  })

  // Handle error from React Query
  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load subjects',
      variant: 'destructive'
    })
  }

  const handleCreateSubject = async () => {
    createSubjectMutation.mutate(subjectForm, {
      onSuccess: () => {
        setCreateSubjectOpen(false)
        setSubjectForm({
          subject_name: '',
          subject_code: '',
          subsystem: 'english',
          class_levels: [],
          description: '',
          is_core: false
        })
      }
    })
  }

  const handleDeleteSubject = (subject: Subject) => {
    setSubjectToDelete(subject)
    setShowDeleteDialog(true)
  }

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return

    deleteSubjectMutation.mutate(subjectToDelete.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        setSubjectToDelete(null)
      }
    })
  }

  if (isLoading) {
    return <ShimmerSubjectsManagement />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subjects Management</h1>
          <p className="text-muted-foreground">
            Create and manage subjects with their branches
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="branches">Subject Branches</TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Subjects</CardTitle>
                    <CardDescription>
                      Manage subjects in your school
                    </CardDescription>
                  </div>
                  <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-8 w-8 p-0" aria-label="Create subject">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Subject</DialogTitle>
                      <DialogDescription>
                        Create a new subject for your school
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjectName">Subject Name</Label>
                        <Input
                          id="subjectName"
                          value={subjectForm.subject_name}
                          onChange={(e) => setSubjectForm({...subjectForm, subject_name: e.target.value})}
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subjectCode">Subject Code</Label>
                        <Input
                          id="subjectCode"
                          value={subjectForm.subject_code}
                          onChange={(e) => setSubjectForm({...subjectForm, subject_code: e.target.value})}
                          placeholder="e.g., MATH"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subsystem">Subsystem</Label>
                        <Select 
                          value={subjectForm.subsystem} 
                          onValueChange={(value) => setSubjectForm({...subjectForm, subsystem: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={subjectForm.description}
                          onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                          placeholder="Subject description..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isCore"
                            checked={subjectForm.is_core}
                            onChange={(e) => setSubjectForm({...subjectForm, is_core: e.target.checked})}
                          />
                          <Label htmlFor="isCore">Core Subject</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setCreateSubjectOpen(false)}
                        disabled={createSubjectMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateSubject}
                        disabled={createSubjectMutation.isPending}
                      >
                        {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No subjects found. Create a new subject to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Subsystem</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow 
                        key={subject.id}
                        onMouseEnter={() => prefetchSubject(subject.id)}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{subject.subject_name}</div>
                            {subject.description && (
                              <div className="text-sm text-muted-foreground">
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subject.subject_code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {subject.subsystem.charAt(0).toUpperCase() + subject.subsystem.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subject.is_core ? "default" : "outline"}>
                            {subject.is_core ? "Core" : "Elective"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subject.status === 'active' ? "default" : "secondary"}>
                            {subject.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(subject.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveTab('branches')
                                // You could pass the subject ID to the branches component
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSubject(subject)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <SubjectBranchesManagementOptimized />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the subject "{subjectToDelete?.subject_name}"? 
              This action cannot be undone and will also delete all associated branches and assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSubjectToDelete(null)
              }}
              disabled={deleteSubjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSubject}
              disabled={deleteSubjectMutation.isPending}
            >
              {deleteSubjectMutation.isPending ? 'Deleting...' : 'Delete Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
