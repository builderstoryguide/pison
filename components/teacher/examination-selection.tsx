"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Calendar, BookOpen, Users, Filter, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTeacherExamination } from "@/lib/teacher-examination-context"
import type { Examination } from "@/lib/examination-context"
import { format } from "date-fns"

interface ExaminationSelectionProps {
  onSelectExamination: (examination: Examination) => void
  selectedExaminationId?: string
}

export function ExaminationSelection({ onSelectExamination, selectedExaminationId }: ExaminationSelectionProps) {
  const { examinations, isLoading, error, refreshExaminations } = useTeacherExamination()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    refreshExaminations()
  }, [refreshExaminations])

  // Get unique subjects and levels for filters
  const allSubjects = Array.from(new Set(examinations.flatMap(exam => exam.subjects))).sort()
  const allLevels = Array.from(new Set(examinations.map(exam => exam.level))).sort()

  // Filter examinations
  const filteredExaminations = examinations.filter((exam) => {
    const matchesSearch = searchTerm === "" || 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subjects.some(subj => subj.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSubject = filterSubject === "all" || exam.subjects.includes(filterSubject)
    const matchesLevel = filterLevel === "all" || exam.level === filterLevel
    const matchesStatus = filterStatus === "all" || exam.status === filterStatus

    return matchesSearch && matchesSubject && matchesLevel && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "default" as const, label: "Scheduled" },
      ongoing: { variant: "default" as const, label: "Ongoing" },
      draft: { variant: "secondary" as const, label: "Draft" },
      completed: { variant: "outline" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading examinations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading examinations: {error}</p>
            <Button onClick={() => refreshExaminations()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Examination
        </h2>
        <p className="text-muted-foreground">Choose an examination to enter marks for your classes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search examinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {allLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Examinations List */}
      {filteredExaminations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No examinations found</p>
              <p className="text-sm mt-2">
                {examinations.length === 0 
                  ? "No examinations are available for your subjects and classes."
                  : "No examinations match your current filters."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExaminations.map((exam) => (
            <Card 
              key={exam.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedExaminationId === exam.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectExamination(exam)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {exam.type.charAt(0).toUpperCase() + exam.type.slice(1).replace('_', ' ')} Examination
                    </CardDescription>
                  </div>
                  {getStatusBadge(exam.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(exam.startDate), "MMM dd, yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Level</p>
                      <p className="font-medium">{exam.level}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Subjects</p>
                      <p className="font-medium">{exam.subjects.length} subject{exam.subjects.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Total Marks</p>
                    <p className="font-medium">{exam.totalMarks} marks</p>
                  </div>
                </div>

                {exam.subjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {exam.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

