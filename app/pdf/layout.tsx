import type { ReactNode } from 'react'

/** Minimal shell for Puppeteer PDF routes — white background, no dashboard chrome */
export default function PdfLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black antialiased">{children}</div>
  )
}
