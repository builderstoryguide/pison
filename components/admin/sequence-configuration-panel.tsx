"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ListOrdered, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSequenceConfiguration } from "@/hooks/use-sequence-configuration"
import {
  TERM_KEYS,
  type TermKey,
  type TermSequenceCounts,
  DEFAULT_TERM_COUNTS,
  PRESET_5_TERM_COUNTS,
  buildGlobalSlotMap,
  adjustTermCountsForTotal,
  validateSequenceConfig,
  type GlobalSequenceSlot,
} from "@/lib/sequence-term-mapping"

export interface SequenceConfigurationPanelProps {
  academicYear: string
  defaultMaxMarks: number
  onDefaultMaxMarksChange: (value: number) => void
  totalSequences: 5 | 6
  onTotalSequencesChange: (value: 5 | 6) => void
  termSequenceCounts: TermSequenceCounts
  onTermSequenceCountsChange: (counts: TermSequenceCounts) => void
}

export function SequenceConfigurationPanel({
  academicYear,
  defaultMaxMarks,
  onDefaultMaxMarksChange,
  totalSequences,
  onTotalSequencesChange,
  termSequenceCounts,
  onTermSequenceCountsChange,
}: SequenceConfigurationPanelProps) {
  const {
    data: seqConfigData,
    isLoading: loadingSeqConfig,
    isError: seqConfigIsError,
    error: seqConfigError,
  } = useSequenceConfiguration(academicYear)
  const lastLoadedKey = useRef("")
  const [maxMarksInput, setMaxMarksInput] = useState(String(defaultMaxMarks))

  useEffect(() => {
    lastLoadedKey.current = ""
  }, [academicYear])

  useEffect(() => {
    if (loadingSeqConfig || !seqConfigData) return
    const key = JSON.stringify({
      total: seqConfigData.totalSequences,
      counts: seqConfigData.termSequenceCounts,
    })
    if (key === lastLoadedKey.current) return
    lastLoadedKey.current = key

    if (seqConfigData.totalSequences === 5 || seqConfigData.totalSequences === 6) {
      onTotalSequencesChange(seqConfigData.totalSequences)
    }
    if (seqConfigData.termSequenceCounts) {
      onTermSequenceCountsChange(seqConfigData.termSequenceCounts)
    }
    if (seqConfigData.configuration?.default_max_marks) {
      onDefaultMaxMarksChange(seqConfigData.configuration.default_max_marks)
      setMaxMarksInput(String(seqConfigData.configuration.default_max_marks))
    }
  }, [
    seqConfigData,
    loadingSeqConfig,
    onTotalSequencesChange,
    onTermSequenceCountsChange,
    onDefaultMaxMarksChange,
  ])

  const assignedSum = useMemo(
    () => TERM_KEYS.reduce((s, k) => s + termSequenceCounts[k], 0),
    [termSequenceCounts]
  )

  const validation = validateSequenceConfig(totalSequences, termSequenceCounts)
  const seq6Grades = seqConfigData?.sequence6Usage?.gradeCount ?? 0
  const showSeq6Warning = totalSequences === 5 && seq6Grades > 0
  const slots = useMemo(
    () => buildGlobalSlotMap(totalSequences, termSequenceCounts),
    [totalSequences, termSequenceCounts]
  )

  const handleTotalChange = (value: string) => {
    const newTotal = parseInt(value, 10) as 5 | 6
    onTotalSequencesChange(newTotal)
    onTermSequenceCountsChange(adjustTermCountsForTotal(termSequenceCounts, newTotal))
  }

  const handleTermCountChange = (term: TermKey, value: string) => {
    const n = parseInt(value, 10)
    onTermSequenceCountsChange({
      ...termSequenceCounts,
      [term]: Number.isFinite(n) && n >= 0 ? n : 0,
    })
  }

  const applyPreset = (total: 5 | 6, counts: TermSequenceCounts) => {
    onTotalSequencesChange(total)
    onTermSequenceCountsChange(counts)
  }

  const maxForTerm = (term: TermKey) => {
    const others = TERM_KEYS.filter((k) => k !== term).reduce((s, k) => s + termSequenceCounts[k], 0)
    return Math.max(0, totalSequences - others)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" />
          Sequence Configuration
        </CardTitle>
        <CardDescription>
          Set how many sequences run this academic year (5 or 6) and how they are split across terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Academic year:</span> {academicYear}
            <span className="ml-2 text-xs">(from System Settings)</span>
          </p>
        </div>

        {loadingSeqConfig ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading sequence configuration...</span>
          </div>
        ) : seqConfigIsError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load sequence configuration for {academicYear}.{" "}
              {seqConfigError instanceof Error ? seqConfigError.message : "Please try again."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Total sequences per academic year</label>
                <Select value={String(totalSequences)} onValueChange={handleTotalChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 sequences</SelectItem>
                    <SelectItem value="5">5 sequences</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(6, { ...DEFAULT_TERM_COUNTS })}
                >
                  Preset: 6 (2 per term)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(5, { ...PRESET_5_TERM_COUNTS })}
                >
                  Preset: 5 (2, 2, 1)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default max marks</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={maxMarksInput}
                onChange={(e) => {
                  const raw = e.target.value
                  setMaxMarksInput(raw)
                  if (raw === "") return
                  const n = parseInt(raw, 10)
                  if (Number.isFinite(n) && n >= 1 && n <= 100) {
                    onDefaultMaxMarksChange(n)
                  }
                }}
                onBlur={() => {
                  const n = parseInt(maxMarksInput, 10)
                  if (!Number.isFinite(n) || n < 1 || n > 100) {
                    const fallback = defaultMaxMarks >= 1 && defaultMaxMarks <= 100 ? defaultMaxMarks : 20
                    onDefaultMaxMarksChange(fallback)
                    setMaxMarksInput(String(fallback))
                  }
                }}
              />
            </div>

            <DistributionSummary
              assigned={assignedSum}
              total={totalSequences}
              valid={validation.valid}
              error={validation.valid ? undefined : validation.error}
            />

            {showSeq6Warning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {seq6Grades} grade row(s) across{" "}
                  {seqConfigData?.sequence6Usage?.assessmentCount ?? 0} assessment(s) still use the{" "}
                  <strong>6th sequence</strong>. Saving with 5 sequences will deactivate sequence 6; those
                  marks stay in the database and may still appear on some reports until you remove or
                  reassign them.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TERM_KEYS.map((term) => (
                <TermCountCard
                  key={term}
                  term={term}
                  count={termSequenceCounts[term]}
                  maxSelectable={maxForTerm(term)}
                  slots={slots.filter((s) => s.term === term)}
                  onCountChange={(v) => handleTermCountChange(term, v)}
                />
              ))}
            </div>

            <GlobalPreview slots={slots} showInvalidHint={!validation.valid} />

            {seqConfigData && !seqConfigData.sequences?.length && (
              <p className="text-sm text-muted-foreground">
                No sequences saved for this year yet. Click Save Configuration below to create them.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function DistributionSummary({
  assigned,
  total,
  valid,
  error,
}: {
  assigned: number
  total: number
  valid: boolean
  error?: string
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${valid ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-destructive bg-destructive/10"}`}
    >
      <span className="font-medium">
        {assigned} / {total} sequences assigned
      </span>
      {!valid && error && <p className="text-destructive mt-1">{error}</p>}
    </div>
  )
}

function TermCountCard({
  term,
  count,
  maxSelectable,
  slots,
  onCountChange,
}: {
  term: TermKey
  count: number
  maxSelectable: number
  slots: GlobalSequenceSlot[]
  onCountChange: (value: string) => void
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{term}</h4>
        <Badge variant="outline">{count} sequences</Badge>
      </div>
      <Select value={String(count)} onValueChange={onCountChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: maxSelectable + 1 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>
              {i} {i === 1 ? "sequence" : "sequences"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ul className="text-xs text-muted-foreground space-y-1 min-h-[48px]">
        {slots.length > 0 ? (
          slots.map((s) => (
            <li key={s.globalNumber}>
              {s.sequenceName} <span className="opacity-70">(global #{s.globalNumber})</span>
            </li>
          ))
        ) : (
          <li>No sequences in this term</li>
        )}
      </ul>
    </div>
  )
}

function GlobalPreview({
  slots,
  showInvalidHint,
}: {
  slots: GlobalSequenceSlot[]
  showInvalidHint?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Full year layout</label>
      {showInvalidHint ? (
        <p className="text-xs text-muted-foreground">
          Assign all sequences across terms (see summary above) to preview the layout.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <Badge key={s.globalNumber} variant="secondary">
              #{s.globalNumber} → {s.term}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
