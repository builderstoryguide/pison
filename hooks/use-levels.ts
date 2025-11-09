"use client"

import { useState, useEffect } from "react"

export interface Level {
  id: string
  name: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

interface UseLevelsOptions {
  subsystem?: "english" | "french" | null
  branch?: "grammar" | "technical" | "commercial" | null
  enabled?: boolean
}

interface UseLevelsReturn {
  levels: Level[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLevels(options: UseLevelsOptions = {}): UseLevelsReturn {
  const { subsystem, branch, enabled = true } = options
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLevels = async () => {
    if (!enabled) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (subsystem) {
        params.append("subsystem", subsystem)
      }
      if (branch) {
        params.append("branch", branch)
      }

      const url = `/api/levels${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch levels: ${response.statusText}`)
      }

      const data = await response.json()
      setLevels(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch levels"
      setError(errorMessage)
      console.error("Error fetching levels:", err)
      setLevels([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLevels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsystem, branch, enabled])

  return {
    levels,
    isLoading,
    error,
    refetch: fetchLevels,
  }
}

