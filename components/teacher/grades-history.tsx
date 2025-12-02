"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradeViewEdit } from "./grade-view-edit"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface HistoryEntry {
  id: string
  date: string
  class: string
  classId: string
  subject: string
  sequence: string
  count: number
}

export function GradesHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  
  // View/Edit state
  const [selectedGrade, setSelectedGrade] = useState<HistoryEntry | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<HistoryEntry | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [sequenceFilter, setSequenceFilter] = useState<string>("all")

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        const res = await fetch(`/api/grades/history?teacherId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setHistory(data.history)
            setFilteredHistory(data.history)
          }
        }
      } catch (e) {
        console.error("Error fetching history:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user?.id])

  // Apply filters
  useEffect(() => {
    let filtered = [...history]

    // Search filter (searches across class, subject, sequence)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        entry =>
          entry.class.toLowerCase().includes(term) ||
          entry.subject.toLowerCase().includes(term) ||
          entry.sequence.toLowerCase().includes(term)
      )
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(entry => entry.class === classFilter)
    }

    // Subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(entry => entry.subject === subjectFilter)
    }

    // Sequence filter
    if (sequenceFilter !== "all") {
      filtered = filtered.filter(entry => entry.sequence === sequenceFilter)
    }

    setFilteredHistory(filtered)
  }, [searchTerm, classFilter, subjectFilter, sequenceFilter, history])

  // Get unique values for filters
  const uniqueClasses = Array.from(new Set(history.map(h => h.class))).sort()
  const uniqueSubjects = Array.from(new Set(history.map(h => h.subject))).sort()
  const uniqueSequences = Array.from(new Set(history.map(h => h.sequence))).sort()

  const handleResetFilters = () => {
    setSearchTerm("")
    setClassFilter("all")
    setSubjectFilter("all")
    setSequenceFilter("all")
  }

  const handleViewGrades = (entry: HistoryEntry) => {
    setSelectedGrade(entry)
    setViewMode('view')
  }

  const handleEditGrades = (entry: HistoryEntry) => {
    setSelectedGrade(entry)
    setViewMode('edit')
  }

  const handleBack = () => {
    setSelectedGrade(null)
    setViewMode(null)
    // Refresh history when coming back
    fetchHistory()
  }

  const handleDeleteClick = (entry: HistoryEntry) => {
    setGradeToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!gradeToDelete) return

    try {
      const res = await fetch(`/api/grades/history?id=${gradeToDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success("Grade entry deleted successfully")
        fetchHistory() // Refresh list
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete grade entry")
      }
    } catch (error) {
      console.error("Error deleting grade:", error)
      toast.error("An error occurred while deleting")
    } finally {
      setDeleteDialogOpen(false)
      setGradeToDelete(null)
    }
  }

  const fetchHistory = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/grades/history?teacherId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setHistory(data.history)
          setFilteredHistory(data.history)
        }
      }
    } catch (e) {
      console.error("Error fetching history:", e)
    } finally {
      setLoading(false)
    }
  }

  // If viewing/editing a specific grade, show that view
  if (selectedGrade && viewMode) {
    return (
      <GradeViewEdit
        assessmentId={selectedGrade.id}
        classId={selectedGrade.classId}
        subject={selectedGrade.subject}
        sequence={selectedGrade.sequence}
        className={selectedGrade.class}
        onBack={handleBack}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading grades history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grades History</h1>
        <p className="text-muted-foreground">View and filter past grade entries</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search class, subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sequence Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sequence</label>
              <Select value={sequenceFilter} onValueChange={setSequenceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sequences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sequences</SelectItem>
                  {uniqueSequences.map((seq) => (
                    <SelectItem key={seq} value={seq}>
                      {seq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Button */}
          {(searchTerm || classFilter !== "all" || subjectFilter !== "all" || sequenceFilter !== "all") && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredHistory.length} of {history.length} entries
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Students Graded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.class}</TableCell>
                      <TableCell>{entry.subject}</TableCell>
                      <TableCell>{entry.sequence}</TableCell>
                      <TableCell>{entry.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Submitted
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewGrades(entry)}
                            title="View Grades"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditGrades(entry)}
                            title="Edit Grades"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(entry)}
                            title="Delete Entry"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {history.length === 0 
                        ? "No grade entries found." 
                        : "No entries match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the grade entry for 
              <span className="font-medium"> {gradeToDelete?.class} - {gradeToDelete?.subject} ({gradeToDelete?.sequence})</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
