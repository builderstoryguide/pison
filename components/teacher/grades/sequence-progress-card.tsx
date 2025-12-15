"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, ChevronRight } from "lucide-react"
import { ClassSubjectStatus, SequenceStatus } from "@/hooks/use-grade-entry-status"

interface SequenceProgressCardProps {
  status: ClassSubjectStatus
  onEnterGrades?: (classId: string, subjectId: string, sequenceId?: string) => void
}

export function SequenceProgressCard({ status, onEnterGrades }: SequenceProgressCardProps) {
  const { classId, className, subjectId, subjectName, sequences } = status

  const completedCount = sequences.filter(s => s.isCompleted).length
  const totalCount = sequences.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const pendingSequences = sequences.filter(s => !s.isCompleted)
  const nextPendingSequence = pendingSequences[0]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{className}</CardTitle>
            <CardDescription className="mt-1">{subjectName}</CardDescription>
          </div>
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Sequence Status List */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Sequences</div>
          <div className="grid grid-cols-2 gap-2">
            {sequences.slice(0, 6).map((sequence) => (
              <SequenceStatusItem
                key={sequence.sequenceId}
                sequence={sequence}
                onClick={() => onEnterGrades?.(classId, subjectId, sequence.sequenceId)}
              />
            ))}
          </div>
          {sequences.length > 6 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{sequences.length - 6} more sequences
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {nextPendingSequence ? (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onEnterGrades?.(classId, subjectId, nextPendingSequence.sequenceId)}
            >
              Enter {nextPendingSequence.sequenceName}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              All Sequences Complete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnterGrades?.(classId, subjectId)}
          >
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface SequenceStatusItemProps {
  sequence: SequenceStatus
  onClick?: () => void
}

function SequenceStatusItem({ sequence, onClick }: SequenceStatusItemProps) {
  const { sequenceName, isCompleted, enteredCount, studentCount } = sequence

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
        isCompleted
          ? "bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
          : "bg-muted/50 hover:bg-muted"
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}    >
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{sequenceName}</div>
        {isCompleted && (
          <div className="text-xs text-muted-foreground">
            {enteredCount}/{studentCount} students
          </div>
        )}
      </div>
    </div>
  )
}
