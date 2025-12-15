"use client"

import * as React from 'react'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth } from './auth-context'
import {
  formatCurrency,
  formatAmount,
  formatCurrencyWithDecimals,
  formatCurrencyRange,
  formatCurrencyForTable,
  formatCurrencyForCard,
  formatCurrencyForForm,
  formatCurrencyForPDF,
  formatCurrencyForReceipt,
  getCurrencySymbol,
  getCurrencyName
} from './currency-utils'

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

interface UploadLogoResult {
  success: boolean
  logoUrl?: string
  error?: string
  errorCode?: string
  errorDetails?: any
}

interface AppConfigurationContextType {
  configuration: AppConfiguration
  isLoading: boolean
  error: string | null
  isOnline: boolean
  lastFetched: Date | null
  updateConfiguration: (config: Partial<AppConfiguration>) => Promise<boolean>
  resetConfiguration: () => Promise<boolean>
  uploadLogo: (file: File) => Promise<UploadLogoResult>
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
  school_logo_url: process.env.NEXT_PUBLIC_SCHOOL_LOGO || '/pison.png',
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:130',message:'fetchConfiguration entry',data:{isOnline,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Strategy 1: Always try to fetch from database first (prioritize database)
    if (isOnline) {
      try {
        console.log('🌐 Fetching configuration from API...')
        
        // Get user ID from localStorage for authentication
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
        const currentUser = storedUser ? JSON.parse(storedUser) : null
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
        
        if (currentUser?.id) {
          headers['X-User-Id'] = currentUser.id
        }
        
        // Add cache-busting timestamp to ensure fresh data
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:151',message:'Before API fetch',data:{hasUserId:!!currentUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const response = await fetch(`/api/configuration-v2?t=${Date.now()}`, {
          method: 'GET',
          headers,
        })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:156',message:'API response received',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});

        if (response.ok) {
          const data = await response.json()
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:158',message:'API response parsed',data:{hasConfiguration:!!data.configuration,source:data.source,configKeys:data.configuration?Object.keys(data.configuration):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          const config = data.configuration || getDefaultConfiguration()
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:159',message:'Config determined',data:{isDefault:!data.configuration,schoolName:config.school_name,academicYear:config.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setLastFetched(new Date())
          console.log('✅ Configuration fetched successfully from database')
          
          // Clear localStorage and update with fresh database data to avoid stale data
          try {
            localStorage.setItem('app_configuration', JSON.stringify(config))
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:164',message:'localStorage updated',data:{schoolName:config.school_name,academicYear:config.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.log('💾 Updated localStorage with fresh database configuration')
          } catch (error) {
            console.warn('⚠️ Failed to update localStorage with fresh config:', error)
          }
          
          return config
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:175',message:'API fetch failed',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('⚠️ API fetch failed, checking localStorage:', error)
        // Don't throw here - we'll use fallback
      }
    }

    // Strategy 2: Use localStorage as backup only if database is unavailable
    try {
      const storedConfig = localStorage.getItem('app_configuration')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:182',message:'Checking localStorage',data:{hasStoredConfig:!!storedConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:185',message:'Using localStorage config',data:{schoolName:parsedConfig.school_name,academicYear:parsedConfig.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log('💾 Using localStorage configuration (database unavailable)')
        return { ...getDefaultConfiguration(), ...parsedConfig }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:189',message:'localStorage read failed',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.warn('⚠️ localStorage read failed:', error)
    }

    // Strategy 3: Use environment variables as last resort
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:193',message:'Using default configuration',data:{reason:'fallback'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:208',message:'Config loaded in useEffect',data:{schoolName:config.school_name,academicYear:config.academic_year,isMounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (isMounted) {
          setConfiguration(config)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:210',message:'Configuration state set',data:{schoolName:config.school_name,academicYear:config.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          // localStorage is already updated by fetchConfiguration when it gets data from database
          // Only update here if fetchConfiguration didn't (shouldn't happen, but safe fallback)
          if (config && typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('app_configuration')
              if (!stored || JSON.parse(stored).academic_year !== config.academic_year) {
                localStorage.setItem('app_configuration', JSON.stringify(config))
              }
            } catch (error) {
              console.warn('Failed to store config in localStorage:', error)
            }
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:224',message:'Config load error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
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
    // Optimistic update for UI responsiveness
    const newConfig = { ...configuration, ...config }
    setConfiguration(newConfig)

    // Don't update localStorage here - wait for database confirmation
    // This prevents stale data from overriding database values

    // Try to update on server
    if (isOnline && user) {
      try {
        // Get user ID from localStorage for authentication
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
        const currentUser = storedUser ? JSON.parse(storedUser) : null
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        if (currentUser?.id) {
          headers['X-User-Id'] = currentUser.id
        }
        
        const response = await fetch('/api/configuration-v2', {
          method: 'PUT',
          headers,
          body: JSON.stringify(config),
        })

        if (response.ok) {
          try {
            const data = await response.json()
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:276',message:'Save response received',data:{hasConfiguration:!!data.configuration,source:data.source,schoolName:data.configuration?.school_name,academicYear:data.configuration?.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            const updatedConfig = data.configuration || newConfig
            
            setConfiguration(updatedConfig)
            setLastFetched(new Date())
            setError(null) // Clear any previous errors
            
            // Update localStorage with server response
            try {
              localStorage.setItem('app_configuration', JSON.stringify(updatedConfig))
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:285',message:'localStorage updated after save',data:{schoolName:updatedConfig.school_name,academicYear:updatedConfig.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
            } catch (error) {
              console.warn('Failed to update localStorage with server response:', error)
            }
            
            // Refresh from database to ensure we have the latest data
            try {
              const freshConfig = await fetchConfiguration()
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:292',message:'Fresh config after save',data:{schoolName:freshConfig.school_name,academicYear:freshConfig.academic_year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              setConfiguration(freshConfig)
              setLastFetched(new Date())
              // Update localStorage with fresh database data
              try {
                localStorage.setItem('app_configuration', JSON.stringify(freshConfig))
              } catch (error) {
                console.warn('Failed to update localStorage with fresh config:', error)
              }
            } catch (refreshError) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-configuration-context-v2.tsx:301',message:'Refresh after save failed',data:{error:refreshError instanceof Error?refreshError.message:String(refreshError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              console.warn('Failed to refresh configuration after save:', refreshError)
              // Continue with the response data we already have
            }
            
            return true
          } catch (jsonError) {
            // Response was ok but JSON parsing failed
            const errorMessage = 'Server returned invalid response format'
            const jsonErrorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError)
            console.warn('Failed to parse successful response:', {
              status: response.status,
              statusText: response.statusText,
              jsonError: jsonErrorMessage
            })
            setError(errorMessage)
            return false
          }
        } else {
          // Parse error response to get detailed error information
          let errorMessage = `Server update failed: ${response.status} ${response.statusText || 'Unknown error'}`
          let errorCode: string | undefined = undefined
          let errorDetails: any = null
          
          try {
            // Read response as text first, then try to parse as JSON
            const responseText = await response.text()
            
            if (responseText && responseText.trim()) {
              try {
                const errorData = JSON.parse(responseText)
                
                // Only use errorData if it has meaningful content
                if (errorData && typeof errorData === 'object') {
                  errorMessage = errorData.error || errorData.message || errorMessage
                  errorCode = errorData.code
                  errorDetails = errorData.details
                }
                
                // Build a comprehensive error log object - only log if we have meaningful data
                const errorLog: Record<string, any> = {
                  status: response.status,
                  statusText: response.statusText || 'Unknown',
                  error: errorMessage
                }
                
                if (errorCode) {
                  errorLog.code = errorCode
                }
                if (errorDetails) {
                  errorLog.details = errorDetails
                }
                
                // Use console.warn instead of console.error to avoid Next.js error boundary
                console.warn('Configuration update failed:', errorLog)
              } catch (jsonError) {
                // Not JSON, use text as error message
                errorMessage = responseText || errorMessage
                console.warn('Configuration update failed (non-JSON response):', {
                  status: response.status,
                  statusText: response.statusText || 'Unknown',
                  message: errorMessage,
                  rawResponse: responseText.substring(0, 200) // First 200 chars
                })
              }
            } else {
              // Empty response body
              console.warn('Configuration update failed (empty response):', {
                status: response.status,
                statusText: response.statusText || 'Unknown',
                message: errorMessage
              })
            }
          } catch (readError) {
            const readErrorMessage = readError instanceof Error ? readError.message : String(readError)
            console.warn('Failed to read error response:', readErrorMessage)
            console.warn('Configuration update failed:', {
              status: response.status,
              statusText: response.statusText || 'Unknown',
              message: errorMessage,
              readError: readErrorMessage
            })
          }
          
          setError(errorMessage)
          // Don't throw - just return false to indicate failure
          // This prevents React error boundaries from catching it
          return false
        }
      } catch (error) {
        // Handle network errors, fetch errors, etc.
        let errorMessage = 'Server update failed'
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to server. Please check your internet connection.'
        } else if (error instanceof Error) {
          errorMessage = error.message
        } else {
          errorMessage = String(error) || 'Server update failed'
        }
        
        // Use console.warn instead of console.error to avoid Next.js error boundary
        const errorInfo: Record<string, any> = {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
        
        if (error instanceof Error && error.stack) {
          errorInfo.stack = error.stack
        }
        
        console.warn('Server update failed (catch block):', errorInfo)
        
        setError(errorMessage)
        // Keep the optimistic update - user can retry later
        return false
      }
    }

    // Offline mode - just keep local changes
    return true
  }, [configuration, isOnline, user, fetchConfiguration])

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
        // Get user ID from localStorage for authentication
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
        const currentUser = storedUser ? JSON.parse(storedUser) : null
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        if (currentUser?.id) {
          headers['X-User-Id'] = currentUser.id
        }
        
        const response = await fetch('/api/configuration-v2', {
          method: 'POST',
          headers,
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
  const uploadLogo = useCallback(async (file: File): Promise<{ success: boolean; logoUrl?: string; error?: string; errorCode?: string; errorDetails?: any }> => {
    if (!isOnline) {
      const errorMsg = 'Cannot upload logo while offline'
      setError(errorMsg)
      return { success: false, error: errorMsg, errorCode: 'OFFLINE_ERROR' }
    }

    try {
      const formData = new FormData()
      formData.append('logo', file)

      // Get user ID from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      
      // Add X-User-Id header if user is logged in
      // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
      if (currentUser?.id) {
        headers['X-User-Id'] = currentUser.id
      }

      const response = await fetch('/api/configuration/upload-logo-v2', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.logoUrl) {
          setError(null)
          return { success: true, logoUrl: data.logoUrl }
        } else {
          const errorMsg = data.error || 'Upload failed'
          setError(errorMsg)
          return { 
            success: false, 
            error: errorMsg, 
            errorCode: data.code || 'UPLOAD_FAILED',
            errorDetails: data.details 
          }
        }
      } else {
        // Parse error response - try to get response text first
        let errorData: any = {}
        let responseText = ''
        
        try {
          responseText = await response.text()
          
          // Try to parse as JSON if there's content
          if (responseText && responseText.trim()) {
            try {
              errorData = JSON.parse(responseText)
            } catch (jsonError) {
              // If JSON parsing fails, use the text as the error message
              console.warn('Failed to parse error response as JSON:', jsonError)
              errorData = { message: responseText }
            }
          } else {
            // If response is empty, create a meaningful error object
            errorData = {
              message: response.statusText || `HTTP ${response.status} error`,
              code: `HTTP_${response.status}`
            }
          }
        } catch (textError) {
          const readErrorMessage = textError instanceof Error ? textError.message : String(textError)
          console.warn('Failed to read response text:', readErrorMessage)
          // Fall back to status text
          responseText = response.statusText || 'Unknown error'
          errorData = {
            message: responseText,
            code: `HTTP_${response.status}`
          }
        }

        // Extract error information with better fallbacks
        const errorMsg = errorData.error || errorData.message || responseText || response.statusText || `Upload failed (HTTP ${response.status})`
        const errorCode = errorData.code || `HTTP_${response.status}`
        
        // Build a comprehensive error log object - ensure it always has minimum required fields
        const errorLog: Record<string, any> = {
          status: response.status,
          statusText: response.statusText || 'Unknown',
          error: errorMsg,
          code: errorCode
        }
        
        // Only add these if they have meaningful values
        if (responseText && responseText.trim()) {
          errorLog.responseText = responseText.substring(0, 200) // Log first 200 chars
        }
        if (errorData.details) {
          errorLog.details = errorData.details
        }
        if (Object.keys(errorData).length > 0 && JSON.stringify(errorData) !== '{}') {
          errorLog.fullErrorData = errorData
        }
        
        // Use console.warn instead of console.error to avoid Next.js error boundary
        console.warn('Logo upload error:', errorLog)
        
        setError(errorMsg)
        return { 
          success: false, 
          error: errorMsg, 
          errorCode,
          errorDetails: errorData.details || (Object.keys(errorData).length > 0 ? errorData : undefined)
        }
      }
    } catch (error) {
      // Network or other errors
      const errorMsg = error instanceof Error ? error.message : 'Network error occurred'
      
      // Use console.warn instead of console.error to avoid Next.js error boundary
      const errorInfo: Record<string, any> = {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
      
      if (error instanceof Error && error.stack) {
        errorInfo.stack = error.stack
      }
      
      console.warn('Logo upload network error:', errorInfo)
      setError(errorMsg)
      return { 
        success: false, 
        error: errorMsg, 
        errorCode: 'NETWORK_ERROR',
        errorDetails: error instanceof Error ? { stack: error.stack } : undefined
      }
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
    url: configuration.school_logo_url || '/pison.png',
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

// Global system settings hooks - these values are managed in App Configuration
export const useGlobalAcademicYear = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.academic_year || '2024-2025', [configuration.academic_year])
}

export const useGlobalCurrency = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.currency || 'XOF', [configuration.currency])
}

export const useGlobalTimezone = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.timezone || 'Africa/Douala', [configuration.timezone])
}

export const useGlobalTimeFormat = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.time_format || '24h', [configuration.time_format])
}

export const useGlobalDateFormat = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => configuration.date_format || 'DD/MM/YYYY', [configuration.date_format])
}

// Combined hook for all global system settings
export const useGlobalSystemSettings = () => {
  const { configuration } = useAppConfiguration()
  return useMemo(() => ({
    academicYear: configuration.academic_year || '2024-2025',
    currency: configuration.currency || 'XOF',
    timezone: configuration.timezone || 'Africa/Douala',
    timeFormat: configuration.time_format || '24h',
    dateFormat: configuration.date_format || 'DD/MM/YYYY',
    language: configuration.language || 'en'
  }), [
    configuration.academic_year,
    configuration.currency,
    configuration.timezone,
    configuration.time_format,
    configuration.date_format,
    configuration.language
  ])
}

/**
 * Currency Formatter Hook
 * Provides currency formatting functions that automatically use the global currency
 * from app configuration. This ensures consistent currency display throughout the app.
 */
export const useCurrencyFormatter = () => {
  const currency = useGlobalCurrency()
  
  return useMemo(() => {
    return {
      /**
       * Format amount with currency symbol using the global currency
       */
      formatCurrency: (amount: number) => formatCurrency(amount, currency),
      
      /**
       * Format amount without currency symbol using the global currency
       */
      formatAmount: (amount: number) => formatAmount(amount, currency),
      
      /**
       * Format amount with decimals using the global currency
       */
      formatCurrencyWithDecimals: (amount: number) => formatCurrencyWithDecimals(amount, currency),
      
      /**
       * Format range of amounts using the global currency
       */
      formatCurrencyRange: (minAmount: number, maxAmount: number) => formatCurrencyRange(minAmount, maxAmount, currency),
      
      /**
       * Format currency for table display using the global currency
       */
      formatCurrencyForTable: (amount: number) => formatCurrencyForTable(amount, currency),
      
      /**
       * Format currency for card/dashboard display using the global currency
       */
      formatCurrencyForCard: (amount: number) => formatCurrencyForCard(amount, currency),
      
      /**
       * Format currency for form display using the global currency
       */
      formatCurrencyForForm: (amount: number) => formatCurrencyForForm(amount, currency),
      
      /**
       * Format currency for PDF reports using the global currency
       */
      formatCurrencyForPDF: (amount: number) => formatCurrencyForPDF(amount, currency),
      
      /**
       * Format currency for receipts using the global currency
       */
      formatCurrencyForReceipt: (amount: number) => formatCurrencyForReceipt(amount, currency),
      
      /**
       * Get the current currency symbol
       */
      getCurrencySymbol: () => getCurrencySymbol(currency),
      
      /**
       * Get the current currency name
       */
      getCurrencyName: () => getCurrencyName(currency),
      
      /**
       * Get the current currency code
       */
      currency
    }
  }, [currency])
}