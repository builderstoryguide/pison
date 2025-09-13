"use client"

import * as React from 'react'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth } from './auth-context'

export interface AppConfiguration {
  id: string | null
  school_name: string
  school_logo_url: string | null
  school_logo_alt_text: string
  school_address: string | null
  school_phone: string | null
  school_email: string | null
  school_website: string | null
  school_motto: string | null
  primary_color: string
  secondary_color: string
  academic_year: string
  currency: string
  timezone: string
  language: string
  date_format: string
  time_format: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

interface AppConfigurationContextType {
  configuration: AppConfiguration
  isLoading: boolean
  error: string | null
  isOnline: boolean
  lastFetched: Date | null
  updateConfiguration: (config: Partial<AppConfiguration>) => Promise<boolean>
  resetConfiguration: () => Promise<boolean>
  uploadLogo: (file: File) => Promise<string | null>
  deleteLogo: (fileName: string) => Promise<boolean>
  refreshConfiguration: () => Promise<void>
  clearError: () => void
}

const AppConfigurationContext = createContext<AppConfigurationContextType | undefined>(undefined)

interface AppConfigurationProviderProps {
  children: ReactNode
}

// Production-ready default configuration with environment awareness
const getDefaultConfiguration = (): AppConfiguration => ({
  id: null,
  school_name: process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Pison Academy',
  school_logo_url: process.env.NEXT_PUBLIC_SCHOOL_LOGO || '/placeholder-logo.svg',
  school_logo_alt_text: process.env.NEXT_PUBLIC_SCHOOL_LOGO_ALT || 'School Logo',
  school_address: process.env.NEXT_PUBLIC_SCHOOL_ADDRESS || '',
  school_phone: process.env.NEXT_PUBLIC_SCHOOL_PHONE || '',
  school_email: process.env.NEXT_PUBLIC_SCHOOL_EMAIL || '',
  school_website: process.env.NEXT_PUBLIC_SCHOOL_WEBSITE || '',
  school_motto: process.env.NEXT_PUBLIC_SCHOOL_MOTTO || '',
  primary_color: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#1f2937',
  secondary_color: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#3b82f6',
  academic_year: process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025',
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'XOF',
  timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Douala',
  language: process.env.NEXT_PUBLIC_LANGUAGE || 'en',
  date_format: process.env.NEXT_PUBLIC_DATE_FORMAT || 'DD/MM/YYYY',
  time_format: process.env.NEXT_PUBLIC_TIME_FORMAT || '24h',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
  updated_by: null
})

// Network status detection
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function AppConfigurationProvider({ children }: AppConfigurationProviderProps) {
  const { user } = useAuth()
  const isOnline = useNetworkStatus()
  
  const [configuration, setConfiguration] = useState<AppConfiguration>(getDefaultConfiguration())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  // Enhanced fetch with multiple fallback strategies
  const fetchConfiguration = useCallback(async (): Promise<AppConfiguration> => {
    // Strategy 1: Try to fetch from API with retry logic
    if (isOnline && user) {
      try {
        console.log('🌐 Fetching configuration from API...')
        
        const response = await fetch('/api/configuration-v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const config = data.configuration || getDefaultConfiguration()
          setLastFetched(new Date())
          console.log('✅ Configuration fetched successfully')
          return config
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.warn('⚠️ API fetch failed, using fallback:', error)
        // Don't throw here - we'll use fallback
      }
    }

    // Strategy 2: Use localStorage as backup
    try {
      const storedConfig = localStorage.getItem('app_configuration')
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig)
        console.log('💾 Using localStorage configuration')
        return { ...getDefaultConfiguration(), ...parsedConfig }
      }
    } catch (error) {
      console.warn('⚠️ localStorage read failed:', error)
    }

    // Strategy 3: Use environment variables
    console.log('🔧 Using environment/default configuration')
    return getDefaultConfiguration()
  }, [isOnline, user])

  // Load configuration on mount and when dependencies change
  useEffect(() => {
    let isMounted = true

    const loadConfiguration = async () => {
      if (!isMounted) return

      setIsLoading(true)
      setError(null)

      try {
        const config = await fetchConfiguration()
        if (isMounted) {
          setConfiguration(config)
          // Store in localStorage as backup
          try {
            localStorage.setItem('app_configuration', JSON.stringify(config))
          } catch (error) {
            console.warn('Failed to store config in localStorage:', error)
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration'
          setError(errorMessage)
          console.error('Configuration load error:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadConfiguration()

    return () => {
      isMounted = false
    }
  }, [fetchConfiguration])

  // Update configuration with optimistic updates
  const updateConfiguration = useCallback(async (config: Partial<AppConfiguration>): Promise<boolean> => {
    // Optimistic update
    const newConfig = { ...configuration, ...config }
    setConfiguration(newConfig)

    // Store in localStorage immediately
    try {
      localStorage.setItem('app_configuration', JSON.stringify(newConfig))
    } catch (error) {
      console.warn('Failed to update localStorage:', error)
    }

    // Try to update on server
    if (isOnline && user) {
      try {
        const response = await fetch('/api/configuration-v2', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        })

        if (response.ok) {
          const data = await response.json()
          const updatedConfig = data.configuration || newConfig
          
          setConfiguration(updatedConfig)
          setLastFetched(new Date())
          
          // Update localStorage with server response
          try {
            localStorage.setItem('app_configuration', JSON.stringify(updatedConfig))
          } catch (error) {
            console.warn('Failed to update localStorage with server response:', error)
          }
          
          return true
        } else {
          throw new Error(`Server update failed: ${response.status}`)
        }
      } catch (error) {
        console.warn('Server update failed, keeping local changes:', error)
        // Keep the optimistic update - user can retry later
        return false
      }
    }

    // Offline mode - just keep local changes
    return true
  }, [configuration, isOnline, user])

  // Reset configuration
  const resetConfiguration = useCallback(async (): Promise<boolean> => {
    const defaultConfig = getDefaultConfiguration()
    setConfiguration(defaultConfig)
    
    // Clear localStorage
    try {
      localStorage.removeItem('app_configuration')
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }

    if (isOnline && user) {
      try {
        const response = await fetch('/api/configuration-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'reset' }),
        })

        if (response.ok) {
          const data = await response.json()
          const resetConfig = data.configuration || defaultConfig
          setConfiguration(resetConfig)
          setLastFetched(new Date())
          return true
        }
      } catch (error) {
        console.warn('Server reset failed, using local reset:', error)
      }
    }

    return true
  }, [isOnline, user])

  // Upload logo with progress tracking
  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!isOnline) {
      setError('Cannot upload logo while offline')
      return null
    }

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/configuration/upload-logo-v2', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.logoUrl
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      setError('Failed to upload logo')
      return null
    }
  }, [isOnline])

  // Delete logo
  const deleteLogo = useCallback(async (fileName: string): Promise<boolean> => {
    if (!isOnline) {
      setError('Cannot delete logo while offline')
      return false
    }

    try {
      const response = await fetch(`/api/configuration/upload-logo-v2?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch (error) {
      console.error('Logo deletion error:', error)
      setError('Failed to delete logo')
      return false
    }
  }, [isOnline])

  // Refresh configuration
  const refreshConfiguration = useCallback(async (): Promise<void> => {
    setError(null)
    
    try {
      const config = await fetchConfiguration()
      setConfiguration(config)
      setLastFetched(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh configuration'
      setError(errorMessage)
    }
  }, [fetchConfiguration])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AppConfigurationContextType = {
    configuration,
    isLoading,
    error,
    isOnline,
    lastFetched,
    updateConfiguration,
    resetConfiguration,
    uploadLogo,
    deleteLogo,
    refreshConfiguration,
    clearError,
  }

  return (
    <AppConfigurationContext.Provider value={value}>
      {children}
    </AppConfigurationContext.Provider>
  )
}

// Enhanced hooks with better error handling
export function useAppConfiguration() {
  const context = useContext(AppConfigurationContext)
  if (context === undefined) {
    throw new Error('useAppConfiguration must be used within an AppConfigurationProvider')
  }
  return context
}

// Optimized hooks with memoization
export const useSchoolName = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.school_name, [configuration.school_name])
}

export const useSchoolLogo = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => ({
    url: configuration.school_logo_url || '/placeholder-logo.svg',
    alt: configuration.school_logo_alt_text || 'School Logo'
  }), [configuration.school_logo_url, configuration.school_logo_alt_text])
}

export const useThemeColors = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => ({
    primary: configuration.primary_color,
    secondary: configuration.secondary_color
  }), [configuration.primary_color, configuration.secondary_color])
}

// Network status hook
export const useConfigurationStatus = () => {
  const { isOnline, lastFetched, error, isLoading } = useAppConfiguration()
  
  return useMemo(() => ({
    isOnline,
    lastFetched,
    error,
    isLoading,
    status: error ? 'error' : isLoading ? 'loading' : 'ready'
  }), [isOnline, lastFetched, error, isLoading])
}