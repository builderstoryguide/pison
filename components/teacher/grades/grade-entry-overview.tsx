"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ArrowUpDown, Grid3x3, List } from "lucide-react"
import { useGradeEntryStatus, useGradeEntryStats } from "@/hooks/use-grade-entry-status"
import { SequenceProgressCard } from "./sequence-progress-card"
import { useAuth } from "@/lib/auth-context"

interface GradeEntryOverviewProps {
  onEnterGrades?: (classId: string, subjectId: string, sequenceId?: string) => void
}

type SortOption = "completion" | "lastUpdated" | "className" | "subjectName"
type FilterOption = "all" | "completed" | "pending" | "inProgress"

export function GradeEntryOverview({ onEnterGrades }: GradeEntryOverviewProps) {
  const { user } = useAuth()
  const { data, isLoading, error } = useGradeEntryStatus({
    enabled: !!user?.id
  })
  const { stats } = useGradeEntryStats()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterOption>("all")
  const [sortBy, setSortBy] = useState<SortOption>("completion")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Error loading grade entry status: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    )
  }

  const statuses = data?.data || []

  // Filter and sort
  let filtered = statuses.filter(item => {
    const matchesSearch =
      item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === "completed") {
      matchesFilter = item.sequences.every(s => s.isCompleted)
    } else if (filterStatus === "pending") {
      matchesFilter = item.sequences.every(s => !s.isCompleted)
    } else if (filterStatus === "inProgress") {
      const completedCount = item.sequences.filter(s => s.isCompleted).length
      matchesFilter = completedCount > 0 && completedCount < item.sequences.length
    }

    return matchesSearch && matchesFilter
  })

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "completion": {
        const aCompleted = a.sequences.filter(s => s.isCompleted).length
        const bCompleted = b.sequences.filter(s => s.isCompleted).length
        const aTotal = a.sequences.length
        const bTotal = b.sequences.length
        const aPercent = aTotal > 0 ? aCompleted / aTotal : 0
        const bPercent = bTotal > 0 ? bCompleted / bTotal : 0
        return bPercent - aPercent
      }
      case "lastUpdated": {
        const aLast = a.sequences
          .filter(s => s.completedDate)
          .sort((x, y) => (y.completedDate || "").localeCompare(x.completedDate || ""))[0]
        const bLast = b.sequences
          .filter(s => s.completedDate)
          .sort((x, y) => (y.completedDate || "").localeCompare(x.completedDate || ""))[0]
        if (!aLast && !bLast) return 0
        if (!aLast) return 1
        if (!bLast) return -1
        return (bLast.completedDate || "").localeCompare(aLast.completedDate || "")
      }
      case "className":
        return a.className.localeCompare(b.className)
      case "subjectName":
        return a.subjectName.localeCompare(b.subjectName)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <h1 className="text-3xl font-bold">Grade Entry Overview</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress entering grades for all sequences across your assigned classes
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses ?? 0}</div>
            <p className="text-xs text-muted-foreground">Classes assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSequences ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sequences to complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedSequences ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sequences entered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionPercentage ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingSequences ?? 0} remaining
            </p>
          </CardContent>
        </Card>
      </div>      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Class-Subject Assignments</CardTitle>
          <CardDescription>
            {filtered.length} of {statuses.length} assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterOption)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion">Completion %</SelectItem>
                <SelectItem value="lastUpdated">Last Updated</SelectItem>
                <SelectItem value="className">Class Name</SelectItem>
                <SelectItem value="subjectName">Subject Name</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No assignments found matching your filters
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {filtered.map((status) => (
                <SequenceProgressCard
                  key={`${status.classId}-${status.subjectId}`}
                  status={status}
                  onEnterGrades={onEnterGrades}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
