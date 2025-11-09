"use client"

import { useState, useEffect } from 'react'

interface DiagnosticResult {
  ok: boolean
  role?: string
  canSelect?: boolean
  error?: any
}

export default function DatabaseDebugPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastError, setLastError] = useState<any>(null)

  useEffect(() => {
    const checkDiagnostics = async () => {
      try {
        const res = await fetch('/api/diagnostics/supabase')
        const data = await res.json()
        setDiagnostics(data)
      } catch (err) {
        setLastError(err)
        setDiagnostics({ ok: false, error: err })
      } finally {
        setLoading(false)
      }
    }
    checkDiagnostics()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostics</h1>
      
      {loading && <p>Loading diagnostics...</p>}
      
      {diagnostics && (
        <div className="space-y-4">
          <div className={`p-4 rounded ${diagnostics.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="font-semibold mb-2">Connection Status</h2>
            <p>Status: {diagnostics.ok ? '✓ OK' : '✗ Failed'}</p>
            {diagnostics.role && <p>Role: {diagnostics.role}</p>}
            {diagnostics.canSelect !== undefined && (
              <p>Can SELECT: {diagnostics.canSelect ? '✓ Yes' : '✗ No'}</p>
            )}
          </div>
          
          {diagnostics.error && (
            <div className="p-4 rounded bg-red-50 border border-red-200">
              <h2 className="font-semibold mb-2">Error Details</h2>
              <pre className="text-sm overflow-auto">{JSON.stringify(diagnostics.error, null, 2)}</pre>
            </div>
          )}
          
          {lastError && (
            <div className="p-4 rounded bg-yellow-50 border border-yellow-200">
              <h2 className="font-semibold mb-2">Last Exception</h2>
              <pre className="text-sm overflow-auto">{JSON.stringify(lastError, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}








