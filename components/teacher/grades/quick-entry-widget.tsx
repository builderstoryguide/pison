"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ClipboardList, ChevronRight, CheckCircle2 } from "lucide-react"
import { useGradeEntryStatus, useGradeEntryStats } from "@/hooks/use-grade-entry-status"
import { useAuth } from "@/lib/auth-context"
import { useSequenceConfiguration } from "@/hooks/use-sequence-configuration"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"

interface QuickEntryWidgetProps {
  onEnterGrades?: (classId: string, subjectId: string, sequenceId?: string, term?: string) => void
  maxItems?: number
}

export function QuickEntryWidget({ onEnterGrades, maxItems = 3 }: QuickEntryWidgetProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = useGradeEntryStatus({ enabled: !!user?.id })
  const { stats } = useGradeEntryStats()
  
  // State for term and sequence selection
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedSequence, setSelectedSequence] = useState<string>("")
  
  // Fetch sequence configuration
  const globalAcademicYear = useGlobalAcademicYear()
  const { data: sequenceConfig, isLoading: loadingConfig } = useSequenceConfiguration(globalAcademicYear)

  // Prefetch grade entry data when hovering over pending items
  const prefetchGradeEntryData = (classId: string, subjectId: string) => {
    if (!user?.id) return
    queryClient.prefetchQuery({
      queryKey: ['grade-entry-status', user.id, classId, subjectId],
      queryFn: async () => {
        const params = new URLSearchParams({
          teacherId: user.id,
          classId,
          subjectId
        })
        const response = await fetch(`/api/grades/entry-status?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch grade entry status')
        const data = await response.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch grade entry status')
        return data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
    
    // Also prefetch students and subjects
    queryClient.prefetchQuery({
      queryKey: ['class-students', classId],
      queryFn: async () => {
        const response = await fetch(`/api/classes/${classId}/students`)
        if (!response.ok) throw new Error('Failed to fetch students')
        const data = await response.json()
        return data.students || []
      },
      staleTime: 5 * 60 * 1000,
    })
    
    queryClient.prefetchQuery({
      queryKey: ['gradable-items', classId, user.id],
      queryFn: async () => {
        const response = await fetch(`/api/classes/${classId}/subjects?teacherId=${user.id}`)
        if (!response.ok) throw new Error('Failed to fetch subjects')
        const data = await response.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch subjects')
        return data.subjects || []
      },
      staleTime: 5 * 60 * 1000,
    })
  }
  
  // Extract unique terms from configuration
  const terms = sequenceConfig?.sequences 
    ? Array.from(new Set(sequenceConfig.sequences.map(s => s.term))).sort()
    : []
  
  // Filter sequences by selected term
  const filteredSequences = sequenceConfig?.sequences
    ?.filter(s => s.is_active && s.term === selectedTerm)
    .sort((a, b) => a.sequence_number - b.sequence_number) || []
  
  // Reset sequence when term changes
  useEffect(() => {
    setSelectedSequence("")
  }, [selectedTerm])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find next pending sequences
  const pendingItems: Array<{
    classId: string
    className: string
    subjectId: string
    subjectName: string
    sequenceId: string
    sequenceName: string
  }> = []

  data?.data.forEach(item => {
    const pendingSeq = item.sequences.find(s => !s.isCompleted)
    if (pendingSeq) {
      pendingItems.push({
        classId: item.classId,
        className: item.className,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        sequenceId: pendingSeq.sequenceId,
        sequenceName: pendingSeq.sequenceName
      })
    }
  })

  const displayItems = pendingItems.slice(0, maxItems)
  const completionPercentage = stats.completionPercentage || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Entry</CardTitle>
            <CardDescription>Next pending sequences</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionPercentage / 100)}`}
                  className="text-primary"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Term and Sequence Selection */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quick-term" className="text-xs font-medium">Term</Label>
            <Select
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              disabled={loadingConfig || terms.length === 0}
            >
              <SelectTrigger id="quick-term" className="h-9">
                <SelectValue placeholder={loadingConfig ? "Loading..." : "Select term"} />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term, index) => (
                  <SelectItem key={`term-${index}`} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="quick-sequence" className="text-xs font-medium">Sequence</Label>
            <Select
              value={selectedSequence}
              onValueChange={setSelectedSequence}
              disabled={!selectedTerm || filteredSequences.length === 0}
            >
              <SelectTrigger id="quick-sequence" className="h-9">
                <SelectValue placeholder={!selectedTerm ? "Select term first" : "Select sequence"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSequences.map((seq) => (
                  <SelectItem key={seq.id} value={seq.id}>
                    {seq.sequence_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Enter Grades Button - enabled when term and sequence are selected */}
        {selectedTerm && selectedSequence && (
          <Button
            className="w-full"
            onClick={() => onEnterGrades?.("", "", selectedSequence, selectedTerm)}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Enter Grades for {filteredSequences.find(s => s.id === selectedSequence)?.sequence_name}
          </Button>
        )}
        
        {/* Divider */}
        {displayItems.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue pending
              </span>
            </div>
          </div>
        )}
        
        {/* Pending Items List */}
        {displayItems.length === 0 && !selectedTerm ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm">All sequences completed!</p>
          </div>
        ) : displayItems.length > 0 ? (
          <>
            {displayItems.map((item) => (
              <Button
                key={`${item.classId}-${item.subjectId}-${item.sequenceId}`}
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => onEnterGrades?.(item.classId, item.subjectId, item.sequenceId)}
                onMouseEnter={() => prefetchGradeEntryData(item.classId, item.subjectId)}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.sequenceName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.className} • {item.subjectName}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ))}
            {pendingItems.length > maxItems && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onEnterGrades?.("", "")}
              >
                View All ({pendingItems.length} pending)
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
