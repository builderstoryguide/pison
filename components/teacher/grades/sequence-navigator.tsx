"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, ChevronRight, ChevronLeft } from "lucide-react"
import { SequenceStatus } from "@/hooks/use-grade-entry-status"
import { cn } from "@/lib/utils"

interface SequenceNavigatorProps {
  sequences: SequenceStatus[]
  currentSequenceId?: string
  onSequenceSelect: (sequenceId: string) => void
  onNextSequence?: () => void
  onPreviousSequence?: () => void
  showProgress?: boolean
}

export function SequenceNavigator({
  sequences,
  currentSequenceId,
  onSequenceSelect,
  onNextSequence,
  onPreviousSequence,
  showProgress = true
}: SequenceNavigatorProps) {
  const currentIndex = sequences.findIndex(s => s.sequenceId === currentSequenceId)
  const completedCount = sequences.filter(s => s.isCompleted).length
  const totalCount = sequences.length
  const nextPendingIndex = sequences.findIndex(s => !s.isCompleted)

  const handleNext = () => {
    if (onNextSequence) {
      onNextSequence()
    } else if (nextPendingIndex >= 0) {
      onSequenceSelect(sequences[nextPendingIndex].sequenceId)
    } else if (currentIndex < sequences.length - 1) {
      onSequenceSelect(sequences[currentIndex + 1].sequenceId)
    }
  }

  const handlePrevious = () => {
    if (onPreviousSequence) {
      onPreviousSequence()
    } else if (currentIndex > 0) {
      onSequenceSelect(sequences[currentIndex - 1].sequenceId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      {showProgress && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Sequence {currentIndex >= 0 ? currentIndex + 1 : 0} of {totalCount}
            </span>
            <Badge variant="secondary">
              {completedCount}/{totalCount} completed
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              disabled={nextPendingIndex < 0 && currentIndex >= sequences.length - 1}
            >
              Next
              {nextPendingIndex >= 0 && nextPendingIndex !== currentIndex + 1 && (
                <span className="ml-1 text-xs">({sequences[nextPendingIndex]?.sequenceName})</span>
              )}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Sequence Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sequences.map((sequence, index) => {
          const isActive = sequence.sequenceId === currentSequenceId
          const isCompleted = sequence.isCompleted
          const isPending = !isCompleted

          return (
            <button
              key={sequence.sequenceId}
              onClick={() => onSequenceSelect(sequence.sequenceId)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                "border-2 min-w-[140px]",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
                isCompleted && !isActive && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
                isPending && !isActive && "border-muted-foreground/20 bg-muted/30"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{sequence.sequenceName}</span>
              {isActive && (
                <Badge variant="default" className="ml-auto text-xs">
                  Current
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Sequence Details */}
      {currentSequenceId && (
        <div className="text-sm text-muted-foreground">
          {(() => {
            const current = sequences.find(s => s.sequenceId === currentSequenceId)
            if (!current) return null
            if (current.isCompleted) {
              return (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    Completed: {current.enteredCount}/{current.studentCount} students entered
                    {current.completedDate && (
                      <span className="ml-2">
                        on {new Date(current.completedDate).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              )
            }
            return (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>
                  Pending: {current.studentCount - current.enteredCount} students remaining ({current.enteredCount}/{current.studentCount} entered)
                </span>              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
