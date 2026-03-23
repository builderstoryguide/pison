import type { Browser } from 'puppeteer'

const DEFAULT_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
] as const

/**
 * Renders a Next.js report-card PDF page with the caller's session cookies.
 * Uses Chromium print to PDF so output matches on-screen layout (hairline borders).
 */
export async function generateReportCardPdfFromUrl(options: {
  targetUrl: string
  cookieHeader: string
}): Promise<Buffer> {
  const puppeteer = await import('puppeteer')

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined

  let browser: Browser | null = null
  try {
    browser = await puppeteer.default.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: [...DEFAULT_LAUNCH_ARGS],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 })

    await page.setExtraHTTPHeaders({
      Cookie: options.cookieHeader,
    })

    // Let the Next.js dev server accept nested requests from Chromium (same machine). Without a yield,
    // some dev setups deadlock or drop the outer /api/report-cards/pdf request (browser sees "Failed to fetch").
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => setImmediate(resolve))
    }

    // Avoid networkidle0: Next.js dev (Turbopack/HMR) keeps connections open, so "idle" may never occur.
    // Use `load` only: dev (Turbopack/HMR) often never reaches networkidle*.
    await page.goto(options.targetUrl, {
      waitUntil: 'load',
      timeout: 120_000,
    })

    // Brief yield so the client bundle can start (load fires before React paints).
    await new Promise((r) => setTimeout(r, 300))

    // Poll instead of waitForSelector: some Chromium builds are flaky on attribute selectors for
    // hidden nodes; the PDF client always ends in #report-card-pdf-error or [data-pdf-ready].
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pdf-ready="true"]') !== null ||
        document.querySelector('#report-card-pdf-error') !== null,
      { timeout: 100_000, polling: 100 }
    )

    const errorEl = await page.$('#report-card-pdf-error')
    if (errorEl) {
      const message = await errorEl.evaluate(
        (el) => el.textContent?.trim() || 'Report card render failed'
      )
      throw new Error(message)
    }

    const pdfResult = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
