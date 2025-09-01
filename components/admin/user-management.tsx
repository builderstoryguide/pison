"use client"

import React, { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserX, UserCheck, RotateCcw, Eye, Download, Users, UserPlus, Activity, RefreshCw, AlertCircle, Users2, CheckSquare, Square, Trash2 as TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

import { useUserManagement, User, UserFilters } from '@/lib/user-management-context'
import { useStudentManagement } from '@/lib/student-management-context'
import { useTeacherManagement } from '@/lib/teacher-management-context'
import { DynamicUserForm } from './dynamic-user-form'
import { EditUserForm } from './edit-user-form'
import { UserDetailsDialog } from './user-details-dialog'
import { ActivityLogsView } from './activity-logs-view'

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  teacher: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
  parent: 'bg-purple-100 text-purple-800',
  bursar: 'bg-orange-100 text-orange-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800'
}

export function UserManagement() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
  const {
    users,
    searchUsers,
    filterUsers,
    toggleUserStatus,
    deleteUser,
    bulkDeleteUsers,
    resetUserPassword,
    isLoading,
    error,
    refreshUsers
  } = useUserManagement()

  // Get students from student management context to ensure consistency
  const { students: studentManagementStudents } = useStudentManagement()
  
  // Get teachers from teacher management context to ensure consistency
  const { teachers: teacherManagementTeachers } = useTeacherManagement()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Get filtered and searched users
  const filteredUsers = filterUsers(filters)
  const displayUsers = searchQuery ? searchUsers(searchQuery) : filteredUsers

  // Reset selection when filters or search change
  React.useEffect(() => {
    setSelectedUsers(new Set())
    setSelectAll(false)
  }, [filters, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(displayUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = displayUsers.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)))
      setSelectAll(true)
    } else {
      setSelectedUsers(new Set())
      setSelectAll(false)
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === paginatedUsers.length)
  }

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      setIsBulkDeleteDialogOpen(false)
      return
    }

    const result = await bulkDeleteUsers(Array.from(selectedUsers))
    
    if (result.success) {
      // Clear selection after successful deletion
      setSelectedUsers(new Set())
      setSelectAll(false)
      
      // Toast notifications
      if (result.errors.length > 0) {
        toastWarning('Bulk delete completed with issues', `Deleted ${result.deletedCount} users. ${result.errors.length} errors occurred.`)
      } else {
        toastSuccess('Bulk delete successful', `Deleted ${result.deletedCount} users.`)
      }
    } else {
      toastError('Bulk delete failed', result.errors?.[0] || 'Failed to delete users. Please try again.')
    }
    setIsBulkDeleteDialogOpen(false)
  }

  const handleStatusChange = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    await toggleUserStatus(userId, status)
  }

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId)
  }

  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; password?: string; userName?: string }>({ open: false })

  const handleResetPassword = async (userId: string) => {
    const result = await resetUserPassword(userId)
    if (result.success && result.password) {
      const user = users.find(u => u.id === userId)
      setResetPasswordDialog({ 
        open: true, 
        password: result.password, 
        userName: user?.name 
      })
    }
  }

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'ID/Code', 'Created At'].join(','),
      ...displayUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.studentId || user.teacherRegNo || user.parentCode || 'N/A',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    // Use teacher management data for consistency with Teacher Management dashboard
    teachers: teacherManagementTeachers.length,
    // Use student management data for consistency with Student Management dashboard
    students: studentManagementStudents.length,
    parents: users.filter(u => u.role === 'parent').length,
    admins: users.filter(u => u.role === 'admin').length,
    bursars: users.filter(u => u.role === 'bursar').length
  }

  // Empty state component
  const EmptyState = ({ message, description }: { message: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users2 className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add First User
      </Button>
    </div>
  )

  // Loading state component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Loading users...</p>
    </div>
  )

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load users</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button onClick={refreshUsers} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportUsers} disabled={users.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the school management system
                </DialogDescription>
              </DialogHeader>
              <DynamicUserForm onSuccess={() => setShowCreateDialog(false)} />
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

      {/* Data Consistency Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Consistency:</strong> 
          Students: {users.filter(u => u.role === 'student').length} vs {studentManagementStudents.length} | 
          Teachers: {users.filter(u => u.role === 'teacher').length} vs {teacherManagementTeachers.length} | 
          {users.filter(u => u.role === 'student').length === studentManagementStudents.length && 
           users.filter(u => u.role === 'teacher').length === teacherManagementTeachers.length ? '✅ All Consistent' : '⚠️ Some Inconsistent'}
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.active} active, {userStats.inactive} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>
                          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Teachers</CardTitle>
             <UserPlus className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{userStats.teachers}</div>
             <p className="text-xs text-muted-foreground">
               {teacherManagementTeachers.filter(t => t.status === 'active').length} active, {teacherManagementTeachers.filter(t => t.status === 'inactive').length} inactive
             </p>
           </CardContent>
         </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.students}</div>
            <p className="text-xs text-muted-foreground">
              {studentManagementStudents.filter(s => s.status === 'active').length} active, {studentManagementStudents.filter(s => s.status === 'inactive').length} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.parents}</div>
            <p className="text-xs text-muted-foreground">
              Parent accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bursar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.bursars}</div>
            <p className="text-xs text-muted-foreground">
              Financial staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.role || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="bursar">Bursar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.subsystem || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, subsystem: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Subsystem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Systems</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({displayUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts and permissions. 
                {filters.role === 'student' && (
                  <span className="text-blue-600 font-medium">
                    {' '}Note: Student data is synchronized with Student Management dashboard for consistency.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Bulk Actions Toolbar */}
              {selectedUsers.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isLoading}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Selected ({selectedUsers.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleConfirmBulkDelete}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUsers(new Set())
                          setSelectAll(false)
                        }}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} />
              ) : users.length === 0 ? (
                <EmptyState 
                  message="No users found" 
                  description="Get started by creating the first user account in your school management system."
                />
              ) : displayUsers.length === 0 ? (
                <EmptyState 
                  message="No users match your search" 
                  description="Try adjusting your search terms or filters to find the users you're looking for."
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all users"
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>ID/Code</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                              aria-label={`Select ${user.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleColors[user.role]}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[user.status]}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {user.studentId || user.teacherRegNo || user.parentCode || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? (
                              <span className="text-sm">
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
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
                                    setSelectedUser(user)
                                    setShowDetailsDialog(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowEditDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleResetPassword(user.id)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                {user.status === 'active' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(user.id, 'inactive')}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(user.id, 'active')}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {displayUsers.length > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={displayUsers.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      startIndex={startIndex}
                      endIndex={endIndex}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogsView />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSuccess={() => {
                setShowEditDialog(false)
                setSelectedUser(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user information and activity
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
              <UserDetailsDialog user={selectedUser} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              A new temporary password has been generated for {resetPasswordDialog.userName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Temporary Password</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="reset-password"
                  type="text"
                  value={resetPasswordDialog.password || ''}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (resetPasswordDialog.password) {
                      navigator.clipboard.writeText(resetPasswordDialog.password)
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                <strong>Important:</strong> This temporary password will expire in 7 days. The user should change their password upon next login.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetPasswordDialog({ open: false })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
