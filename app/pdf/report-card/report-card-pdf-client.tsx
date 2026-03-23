"use client"

import { useEffect, useState } from 'react'
import { TermReportCard } from '@/components/admin/reports/TermReportCard'
import { AnnualReportCard } from '@/components/admin/reports/AnnualReportCard'
import type { ReportCardData } from '@/components/admin/reports/report-card-types'

export interface ReportCardPdfClientProps {
  studentId: string
  term: string
  classId: string
  /** When set, skip client fetch (data loaded on server for Puppeteer — avoids dev deadlocks / timer throttling). */
  initialData?: ReportCardData | null
  initialError?: string | null
}

export default function ReportCardPdfClient({
  studentId,
  term,
  classId,
  initialData = null,
  initialError = null,
}: ReportCardPdfClientProps) {
  const [data] = useState<ReportCardData | null>(initialData)
  const [error] = useState<string | null>(initialError)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (error) {
      setReady(true)
      return
    }
    if (!data) return

    let cancelled = false
    const run = async () => {
      try {
        await Promise.race([
          (async () => {
            await Promise.race([
              document.fonts.ready,
              new Promise<void>((r) => setTimeout(r, 5000)),
            ])
            await Promise.race([
              new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
              new Promise<void>((r) => setTimeout(r, 2000)),
            ])
            await new Promise((r) => setTimeout(r, 400))
          })(),
          new Promise<void>((r) => setTimeout(r, 15_000)),
        ])
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [studentId, data, error])

  if (!studentId) {
    return (
      <div id="report-card-pdf-error" className="p-4 text-sm">
        Missing studentId
      </div>
    )
  }

  if (error) {
    return (
      <div id="report-card-pdf-error" className="p-4 text-sm">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="p-4 text-sm text-muted-foreground">Loading report card…</div>
  }

  const isAnnual = term === 'annual'
  const termNumber: 1 | 2 | 3 =
    term === '1' ? 1 : term === '2' ? 2 : term === '3' ? 3 : typeof data.academic.term === 'number' ? (data.academic.term as 1 | 2 | 3) : 1

  return (
    <>
      {isAnnual ? (
        <AnnualReportCard data={data} variant="pdfRender" />
      ) : (
        <TermReportCard
          variant="pdfRender"
          data={{
            ...data,
            academic: {
              ...data.academic,
              term: termNumber,
            },
          }}
          classId={classId || undefined}
        />
      )}
      {ready && !error ? (
        <div
          id="report-card-pdf-ready"
          data-pdf-ready="true"
          aria-hidden
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        />
      ) : null}
    </>
  )
}
