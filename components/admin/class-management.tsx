"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useClassManagement, type ClassData, type ClassFormData } from "@/lib/class-management-context"
import { ClassForm } from "./class-form"
import { LevelForm } from "./level-form"
import { ClassDetailsDialog } from "./class-details-dialog"
import { ClassStudentManagement } from "./class-student-management"
import { ShimmerStatsCards } from "@/components/ui/shimmer-loading"
import { useToast } from "@/hooks/use-toast"

export function ClassManagement() {
  const { isLoading, deleteClass, getClassesPaginated, totalClassesCount } = useClassManagement()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateLevelForm, setShowCreateLevelForm] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showStudentManagement, setShowStudentManagement] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [successMessage, setSuccessMessage] = useState<{
    type: 'create' | 'update'
    classId: string
    classData: ClassFormData
  } | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [paginatedClasses, setPaginatedClasses] = useState<ClassData[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [activeTab, setActiveTab] = useState("classes")
  const [levels, setLevels] = useState<Array<{ id: string; name: string; subsystem: string; branch: string; created_at: string }>>([])
  const [isLoadingLevels, setIsLoadingLevels] = useState(false)

  // Load classes with pagination and filters
  const loadPaginatedClasses = React.useCallback(async () => {
    try {
      const result = await getClassesPaginated({
        page: currentPage,
        pageSize: itemsPerPage,
        filters: {
          searchTerm: searchTerm,
          subsystem: subsystemFilter,
          branch: branchFilter,
          status: statusFilter
        }
      })
      
      setPaginatedClasses(result.classes)
      setTotalItems(result.totalCount)
      setTotalPages(result.totalPages)
      
      // Clear selected classes when page changes
      setSelectedClasses([])
    } catch (error) {
      console.error("Error loading paginated classes:", error)
    }
  }, [currentPage, itemsPerPage, searchTerm, subsystemFilter, branchFilter, statusFilter, getClassesPaginated])
  
  // Load classes when component mounts or filters/pagination changes
  React.useEffect(() => {
    loadPaginatedClasses()
  }, [loadPaginatedClasses])

  // Load levels when component mounts or when levels tab is active
  const loadLevels = React.useCallback(async () => {
    setIsLoadingLevels(true)
    try {
      const response = await fetch('/api/levels')
      if (response.ok) {
        const data = await response.json()
        setLevels(data || [])
      } else {
        console.error("Error loading levels:", response.statusText)
        setLevels([])
      }
    } catch (error) {
      console.error("Error loading levels:", error)
      setLevels([])
    } finally {
      setIsLoadingLevels(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === "levels") {
      loadLevels()
    }
  }, [activeTab, loadLevels])
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, subsystemFilter, branchFilter, statusFilter])
  
  // Calculate statistics based on the total counts from the database
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  
  // These statistics will now come from separate API calls or be calculated from the paginated data
  // For now, we'll use the totalClassesCount from context and calculate others from current page
  const totalClasses = totalClassesCount
  const activeClasses = paginatedClasses.filter((cls) => cls.status === "active").length
  const totalEnrollment = paginatedClasses.reduce((sum, cls) => sum + cls.currentEnrollment, 0)
  const totalCapacity = paginatedClasses.reduce((sum, cls) => sum + cls.capacity, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalEnrollment / totalCapacity) * 100) : 0

  const handleFormSuccess = (result: { classId: string; classData: ClassFormData } | { classIds: string[]; classData: ClassFormData[] }) => {
    if ('classIds' in result) {
      // Multiple classes created
      const type = 'create'
      setSuccessMessage({ 
        type, 
        classId: result.classIds[0], // Use first ID for display
        classData: result.classData[0] // Use first class data for display
      })
      setShowCreateForm(false)
      setSelectedClass(null)
    } else {
      // Single class created/updated
      const type = selectedClass ? 'update' : 'create'
      setSuccessMessage({ type, ...result })
      setShowCreateForm(false)
      setSelectedClass(null)
    }
  }

  const handleViewClass = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowDetailsDialog(true)
  }

  const handleEditClass = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowCreateForm(true)
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      await deleteClass(classId)
    }
  }

  const handleManageStudents = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowStudentManagement(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes, assignments, and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setSelectedClass(null)
            setShowCreateForm(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
          <Button variant="outline" onClick={() => setShowCreateLevelForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Level
          </Button>
          <Button onClick={() => {
            setSelectedClass(null)
            setShowCreateForm(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading && paginatedClasses.length === 0 ? (
          <ShimmerStatsCards />
        ) : (
          // Actual statistics cards
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClasses}</div>
                <p className="text-xs text-muted-foreground">{activeClasses} active classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrollment}</div>
                <p className="text-xs text-muted-foreground">Students across all classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCapacity}</div>
                <p className="text-xs text-muted-foreground">Maximum student capacity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{utilizationRate}%</div>
                <p className="text-xs text-muted-foreground">Current capacity usage</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Classes & Levels</CardTitle>
          <CardDescription>View and manage all classes and levels in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="w-auto">
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="levels">Levels</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search classes, levels, or teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Subsystem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsystems</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions and Pagination Controls */}
          <div className="flex items-center justify-between mb-4">
            {selectedClasses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedClasses.length} class(es) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedClasses.length} class(es)?`)) {
                      selectedClasses.forEach(classId => deleteClass(classId))
                      setSelectedClasses([])
                    }
                  }}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClasses([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries per page</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} classes
            </div>
          </div>

          {/* Classes Table */}
          <div className="rounded-md border overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/30 border-b-2">
                  <TableHead className="w-[60px] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedClasses.length === paginatedClasses.length && paginatedClasses.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses(paginatedClasses.map(cls => cls.id))
                        } else {
                          setSelectedClasses([])
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Class Name</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Level</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">System</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Branch</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Class Teacher</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Enrollment</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Subjects</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="w-[80px] px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loading UI for better user experience
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      <TableCell className="px-4 py-3">
                        <div className="h-4 w-4 bg-muted rounded"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-32"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-20"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-24"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-24"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-40"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-28"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-20"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-5 bg-muted rounded w-16"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="h-8 w-8 bg-muted rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No classes found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClasses.map((cls) => (
                    <TableRow key={cls.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                      <TableCell className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses(prev => [...prev, cls.id])
                            } else {
                              setSelectedClasses(prev => prev.filter(id => id !== cls.id))
                            }
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium">{cls.name}</TableCell>
                      <TableCell className="px-4 py-3">{cls.level}</TableCell>
                      <TableCell className="px-4 py-3 capitalize">{cls.subsystem}</TableCell>
                      <TableCell className="px-4 py-3 capitalize">{cls.branch}</TableCell>
                      <TableCell className="px-4 py-3 max-w-[200px] truncate" title={cls.classTeacher}>
                        {cls.classTeacher}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {cls.currentEnrollment}/{cls.capacity}
                          </span>
                          <div className="w-20 h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((cls.currentEnrollment / cls.capacity) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge variant="outline" className="font-medium">
                          {cls.subjects.length} subjects
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={cls.status === "active" ? "default" : "secondary"}>{cls.status}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-9 w-9 p-0 hover:bg-muted/50 transition-colors"
                              aria-label="Open actions menu"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-56 p-2 space-y-1"
                            sideOffset={8}
                          >
                            <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => handleViewClass(cls)}
                              className="px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-3 text-blue-600" />
                              <span className="font-medium">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEditClass(cls)}
                              className="px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-3 text-green-600" />
                              <span className="font-medium">Edit Class</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleManageStudents(cls)}
                              className="px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md transition-colors"
                            >
                              <UserPlus className="h-4 w-4 mr-3 text-purple-600" />
                              <span className="font-medium">Manage Students</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClass(cls.id)} 
                              className="px-3 py-2.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              <span className="font-medium">Delete Class</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
            </TabsContent>

            <TabsContent value="levels" className="mt-6">
              <div className="space-y-4">
                {isLoadingLevels ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading levels...</p>
                  </div>
                ) : levels.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No levels found. Create a level to get started.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/30 border-b-2">
                          <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Level Name</TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Subsystem</TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Branch</TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Created At</TableHead>
                          <TableHead className="w-[80px] px-4 py-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {levels.map((level) => (
                          <TableRow key={level.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                            <TableCell className="px-4 py-3 font-medium">{level.name}</TableCell>
                            <TableCell className="px-4 py-3 capitalize">{level.subsystem}</TableCell>
                            <TableCell className="px-4 py-3 capitalize">{level.branch}</TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">
                              {new Date(level.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete level "${level.name}"?`)) {
                                        fetch(`/api/levels/${level.id}`, {
                                          method: 'DELETE',
                                        })
                                          .then((response) => {
                                            if (response.ok) {
                                              toast.success("Level deleted successfully", {
                                                description: `Level "${level.name}" has been deleted.`
                                              })
                                              loadLevels()
                                            } else {
                                              toast.error("Failed to delete level", {
                                                description: "An error occurred while deleting the level."
                                              })
                                            }
                                          })
                                          .catch((error) => {
                                            console.error('Error deleting level:', error)
                                            toast.error("Error deleting level", {
                                              description: error instanceof Error ? error.message : "An unexpected error occurred."
                                            })
                                          })
                                      }
                                    }}
                                    className="text-red-600"
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
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Class Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => {
        setShowCreateForm(open)
        if (!open) {
          setSelectedClass(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? "Edit Class" : "Create New Class"}
            </DialogTitle>
          </DialogHeader>
          <ClassForm 
            onSuccess={handleFormSuccess} 
            onCancel={() => {
              setShowCreateForm(false)
              setSelectedClass(null)
            }}
            editClass={selectedClass}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateLevelForm} onOpenChange={setShowCreateLevelForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Level</DialogTitle>
          </DialogHeader>
          <LevelForm 
            onSuccess={() => {
              setShowCreateLevelForm(false)
              loadLevels()
            }} 
            onCancel={() => setShowCreateLevelForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Class Details Dialog */}
      {selectedClass && (
        <ClassDetailsDialog
          classData={selectedClass}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
        />
      )}

      {/* Student Management Dialog */}
      {selectedClass && (
        <ClassStudentManagement
          classData={selectedClass}
          open={showStudentManagement}
          onOpenChange={setShowStudentManagement}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <Dialog open={!!successMessage} onOpenChange={() => setSuccessMessage(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
            <DialogHeader>
                          <DialogTitle>
              {successMessage.type === 'create' ? 'Class(es) Created Successfully!' : 'Class Updated Successfully!'}
            </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {successMessage.classData.name} has been {successMessage.type === 'create' ? 'created' : 'updated'} with ID: {successMessage.classId}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSuccessMessage(null)}>
                  Close
                </Button>
                {successMessage.type === 'create' && (
                  <Button
                    onClick={() => {
                      setSuccessMessage(null)
                      setSelectedClass(null)
                      setShowCreateForm(true)
                    }}
                  >
                    Create Another
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
