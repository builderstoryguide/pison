/**
 * Client-side report card PDF: same endpoint as TermReportCard / AnnualReportCard "Download PDF".
 */

export function buildReportCardPdfFilename(options: {
  studentName: string
  year: string | number
  /** API term query: 'annual' | '1' | '2' | '3' */
  term: string | number
}): string {
  const safe = options.studentName.replace(/[^a-zA-Z0-9]/g, '_')
  const y = String(options.year)
  const termStr = String(options.term)
  if (termStr === 'annual') {
    return `ReportCard_${safe}_${y}_Annual.pdf`
  }
  return `ReportCard_${safe}_${y}_Term${termStr}.pdf`
}

export async function fetchReportCardPdfBlob(options: {
  studentId: string
  term: string
  classId?: string
  signal?: AbortSignal
}): Promise<Blob> {
  const qs = new URLSearchParams({
    studentId: options.studentId,
    term: options.term,
  })
  if (options.classId) qs.set('classId', options.classId)

  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : ''
  let res: Response
  try {
    res = await fetch(`${base}/api/report-cards/pdf?${qs.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
      signal: options.signal,
    })
  } catch (e) {
    // fetch() rejects with TypeError on connection drops (common if the dev server deadlocks or restarts during Puppeteer).
    if (e instanceof TypeError) {
      throw new Error(
        'Could not download the PDF (connection failed). Try again. If this persists in dev, check the terminal running `next dev` for Puppeteer errors.'
      )
    }
    throw e
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const j = (await res.json()) as { error?: string }
      if (typeof j?.error === 'string') detail = j.error
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  return res.blob()
}

export function savePdfBlobToDownloads(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
