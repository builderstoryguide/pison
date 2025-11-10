"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  TeacherDataState, 
  TeacherDataResponse, 
  RealTimeUpdate, 
  PerformanceMetrics,
  TeacherClass,
  TeacherClassStudent,
  ClassSubject,
  Assessment,
  Grade,
  OptimizationConfig
} from './types'
import { ultraFastCache, generateTeacherDataKey } from './cache'

interface TeacherContextType {
  // Core data
  data: TeacherDataState | null
  isLoading: boolean
  error: string | null
  
  // Performance metrics
  performance: PerformanceMetrics
  
  // Data access methods
  getClasses: () => TeacherClass[]
  getClass: (classId: string) => TeacherClass | undefined
  getStudents: (classId?: string) => TeacherClassStudent[]
  getStudent: (studentId: string) => TeacherClassStudent | undefined
  getSubjects: () => ClassSubject[]
  getSubject: (subjectId: string) => ClassSubject | undefined
  
  // Grades methods
  getAssessments: (classId?: string) => Assessment[]
  getAssessment: (assessmentId: string) => Assessment | undefined
  getGrades: (assessmentId?: string) => Grade[]
  createAssessment: (data: Partial<Assessment>) => Promise<{ success: boolean; assessmentId?: string; error?: string }>
  submitGrade: (data: Partial<Grade>) => Promise<{ success: boolean; error?: string }>
  
  // Cache and performance methods
  refreshData: (forceRefresh?: boolean) => Promise<void>
  clearCache: () => Promise<void>
  getCacheStats: () => any
  
  // Real-time updates
  isRealTimeConnected: boolean
  connectRealTime: () => void
  disconnectRealTime: () => void
  
  // Configuration
  config: OptimizationConfig
  updateConfig: (config: Partial<OptimizationConfig>) => void
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined)

interface TeacherProviderProps {
  children: React.ReactNode
}

export function TeacherProvider({ children }: TeacherProviderProps) {
  const { user } = useAuth()
  const [data, setData] = useState<TeacherDataState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0,
    userInteractions: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  })
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const userInteractionsRef = useRef<number>(0)
  
  const [config, setConfig] = useState<OptimizationConfig>({
    enableVirtualScrolling: true,
    enablePrefetching: true,
    enableOfflineMode: true,
    enableRealTimeUpdates: true,
    cacheStrategy: 'balanced',
    maxCacheSize: 100,
    ttl: 30000
  })
  
  // Performance monitoring
  const trackPerformance = useCallback((type: string, duration: number, metadata: Record<string, any> = {}) => {
    setPerformance(prev => ({
      ...prev,
      [type]: duration,
      userInteractions: userInteractionsRef.current
    }))
    
    console.log(`📊 Performance: ${type} - ${duration.toFixed(2)}ms`, metadata)
  }, [])
  
  // Load teacher data with ultra-fast caching
  const loadTeacherData = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!user?.id) return
    
    const startTime = globalThis.performance.now()
    setIsLoading(true)
    setError(null)
    
    try {
      const cacheKey = generateTeacherDataKey(user.id)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await ultraFastCache.get(cacheKey)
        if (cached.hit) {
          setData(cached.data)
          trackPerformance('loadTime', globalThis.performance.now() - startTime, { source: cached.source })
          setIsLoading(false)
          return
        }
      }
      
      // Fetch from API
      const response = await fetch(`/api/teachers/ultra-fast?teacherId=${user.id}&useCache=true`)
      const result: TeacherDataResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load teacher data')
      }
      
      // Cache the data
      await ultraFastCache.set(cacheKey, result.data, config.ttl)
      
      setData(result.data)
      trackPerformance('loadTime', globalThis.performance.now() - startTime, { 
        source: result.performance.source,
        cacheHit: result.performance.cacheHit
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teacher data'
      setError(errorMessage)
      console.error('Teacher data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, config.ttl, trackPerformance])
  
  // Real-time connection
  const connectRealTime = useCallback(() => {
    if (!user?.id || !config.enableRealTimeUpdates || isRealTimeConnected) return
    
    try {
      const eventSource = new EventSource(`/api/teachers/ultra-fast/real-time?teacherId=${user.id}`)
      
      eventSource.onopen = () => {
        setIsRealTimeConnected(true)
        console.log('🔗 Real-time connection established')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data)
          
          if ((update as any).type === 'heartbeat') {
            return // Ignore heartbeat messages
          }
          
          // Process real-time update
          setData(prevData => {
            if (!prevData) return prevData
            
            const newData = { ...prevData }
            
            switch (update.type) {
              case 'grades':
                // Update grades data
                if (update.action === 'create' || update.action === 'update') {
                  const grades: Grade[] = Array.isArray(newData.grades.grades) ? newData.grades.grades : []
                  const gradeIndex = grades.findIndex(g => g.id === update.data.id)
                  if (gradeIndex >= 0) {
                    grades[gradeIndex] = update.data
                  } else {
                    grades.push(update.data)
                  }
                  newData.grades.grades = grades.reduce((acc, grade) => {
                    acc[grade.id] = grade
                    return acc
                  }, {} as Record<string, Grade>)
                } else if (update.action === 'delete') {
                  const grades: Grade[] = Array.isArray(newData.grades.grades) ? newData.grades.grades : []
                  newData.grades.grades = grades.filter(g => g.id !== update.data.id).reduce((acc, grade) => {
                    acc[grade.id] = grade
                    return acc
                  }, {} as Record<string, Grade>)
                }
                newData.grades.lastUpdated = new Date().toISOString()
                break
                
              case 'assessments':
                // Update assessments data
                if (update.action === 'create' || update.action === 'update') {
                  const assessments: Assessment[] = Array.isArray(newData.assessments.assessments) ? newData.assessments.assessments : []
                  const assessmentIndex = assessments.findIndex(a => a.id === update.data.id)
                  if (assessmentIndex >= 0) {
                    assessments[assessmentIndex] = update.data
                  } else {
                    assessments.push(update.data)
                  }
                  newData.assessments.assessments = assessments.reduce((acc, assessment) => {
                    acc[assessment.id] = assessment
                    return acc
                  }, {} as Record<string, Assessment>)
                } else if (update.action === 'delete') {
                  const assessments: Assessment[] = Array.isArray(newData.assessments.assessments) ? newData.assessments.assessments : []
                  newData.assessments.assessments = assessments.filter(a => a.id !== update.data.id).reduce((acc, assessment) => {
                    acc[assessment.id] = assessment
                    return acc
                  }, {} as Record<string, Assessment>)
                }
                newData.assessments.lastUpdated = new Date().toISOString()
                break
                
              case 'classes':
                // Update classes data
                if (update.action === 'create' || update.action === 'update') {
                  const classes: TeacherClass[] = Array.isArray(newData.classes) ? newData.classes : []
                  const classIndex = classes.findIndex(c => c.id === update.data.id)
                  if (classIndex >= 0) {
                    classes[classIndex] = update.data
                  } else {
                    classes.push(update.data)
                  }
                  newData.classes = classes.reduce((acc, cls) => {
                    acc[cls.id] = cls
                    return acc
                  }, {} as Record<string, TeacherClass>)
                } else if (update.action === 'delete') {
                  const classes: TeacherClass[] = Array.isArray(newData.classes) ? newData.classes : []
                  newData.classes = classes.filter(c => c.id !== update.data.id).reduce((acc, cls) => {
                    acc[cls.id] = cls
                    return acc
                  }, {} as Record<string, TeacherClass>)
                }
                break
                
              case 'students':
                // Update students data
                if (update.action === 'create' || update.action === 'update') {
                  const students: TeacherClassStudent[] = Array.isArray(newData.students) ? newData.students : []
                  const studentIndex = students.findIndex(s => s.id === update.data.id)
                  if (studentIndex >= 0) {
                    students[studentIndex] = update.data
                  } else {
                    students.push(update.data)
                  }
                  newData.students = students.reduce((acc, student) => {
                    acc[student.id] = student
                    return acc
                  }, {} as Record<string, TeacherClassStudent>)
                } else if (update.action === 'delete') {
                  const students: TeacherClassStudent[] = Array.isArray(newData.students) ? newData.students : []
                  newData.students = students.filter(s => s.id !== update.data.id).reduce((acc, student) => {
                    acc[student.id] = student
                    return acc
                  }, {} as Record<string, TeacherClassStudent>)
                }
                break
            }
            
            return newData
          })
          
          console.log('🔄 Real-time update received:', update)
          
        } catch (err) {
          console.error('Error processing real-time update:', err)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error)
        setIsRealTimeConnected(false)
        eventSource.close()
      }
      
      eventSourceRef.current = eventSource
      
    } catch (err) {
      console.error('Failed to establish real-time connection:', err)
    }
  }, [user?.id, config.enableRealTimeUpdates, isRealTimeConnected])
  
  const disconnectRealTime = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsRealTimeConnected(false)
      console.log('🔌 Real-time connection closed')
    }
  }, [])
  
  // Data access methods
  const getClasses = useCallback((): TeacherClass[] => {
    if (!data) return []
    return Array.isArray(data.classes) ? data.classes : Object.values(data.classes)
  }, [data])
  
  const getClass = useCallback((classId: string): TeacherClass | undefined => {
    if (!data) return undefined
    return Array.isArray(data.classes) ? data.classes.find(c => c.id === classId) : data.classes[classId]
  }, [data])
  
  const getStudents = useCallback((classId?: string): TeacherClassStudent[] => {
    if (!data) return []
    
    if (classId) {
      const classData = Array.isArray(data.classes) ? data.classes.find(c => c.id === classId) : data.classes[classId]
      return classData?.students || []
    }
    
    return Array.isArray(data.students) ? data.students : Object.values(data.students)
  }, [data])
  
  const getStudent = useCallback((studentId: string): TeacherClassStudent | undefined => {
    if (!data) return undefined
    return Array.isArray(data.students) ? data.students.find(s => s.id === studentId) : data.students[studentId]
  }, [data])
  
  const getSubjects = useCallback((): ClassSubject[] => {
    if (!data) return []
    return Array.isArray(data.subjects) ? data.subjects : Object.values(data.subjects)
  }, [data])
  
  const getSubject = useCallback((subjectId: string): ClassSubject | undefined => {
    if (!data) return undefined
    return Array.isArray(data.subjects) ? data.subjects.find(s => s.id === subjectId) : data.subjects[subjectId]
  }, [data])
  
  // Grades methods
  const getAssessments = useCallback((classId?: string): Assessment[] => {
    if (!data) return []
    
    const assessments = Array.isArray(data.grades.assessments) ? data.grades.assessments : Object.values(data.grades.assessments)
    
    if (classId) {
      return assessments.filter(assessment => assessment.classId === classId)
    }
    
    return assessments
  }, [data])
  
  const getAssessment = useCallback((assessmentId: string): Assessment | undefined => {
    if (!data) return undefined
    return Array.isArray(data.grades.assessments) ? data.grades.assessments.find(a => a.id === assessmentId) : data.grades.assessments[assessmentId]
  }, [data])
  
  const getGrades = useCallback((assessmentId?: string): Grade[] => {
    if (!data) return []
    
    const grades = Array.isArray(data.grades.grades) ? data.grades.grades : Object.values(data.grades.grades)
    
    if (assessmentId) {
      return grades.filter(grade => grade.assessmentId === assessmentId)
    }
    
    return grades
  }, [data])
  
  const createAssessment = useCallback(async (assessmentData: Partial<Assessment>): Promise<{ success: boolean; assessmentId?: string; error?: string }> => {
    try {
      const response = await fetch('/api/teachers/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local data optimistically
        setData(prevData => {
          if (!prevData) return prevData
          
          const newData = { ...prevData }
          if (result.assessmentId && result.assessment) {
            const assessments: Assessment[] = Array.isArray(newData.grades.assessments) ? newData.grades.assessments : Object.values(newData.grades.assessments)
            assessments.push(result.assessment)
            newData.grades.assessments = assessments.reduce((acc, assessment) => {
              acc[assessment.id] = assessment
              return acc
            }, {} as Record<string, Assessment>)
            newData.grades.lastUpdated = new Date().toISOString()
          }
          
          return newData
        })
      }
      
      return result
    } catch (err) {
      return { success: false, error: 'Failed to create assessment' }
    }
  }, [])
  
  const submitGrade = useCallback(async (gradeData: Partial<Grade>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/teachers/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local data optimistically
        setData(prevData => {
          if (!prevData) return prevData
          
          const newData = { ...prevData }
          if (result.gradeId && result.grade) {
            const grades: Grade[] = Array.isArray(newData.grades.grades) ? newData.grades.grades : Object.values(newData.grades.grades)
            grades.push(result.grade)
            newData.grades.grades = grades.reduce((acc, grade) => {
              acc[grade.id] = grade
              return acc
            }, {} as Record<string, Grade>)
            newData.grades.lastUpdated = new Date().toISOString()
          }
          
          return newData
        })
      }
      
      return result
    } catch (err) {
      return { success: false, error: 'Failed to submit grade' }
    }
  }, [])
  
  // Cache and performance methods
  const refreshData = useCallback(async (forceRefresh = false): Promise<void> => {
    await loadTeacherData(forceRefresh)
  }, [loadTeacherData])
  
  const clearCache = useCallback(async (): Promise<void> => {
    if (user?.id) {
      const cacheKey = generateTeacherDataKey(user.id)
      await ultraFastCache.delete(cacheKey)
      
      // Clear server cache
      await fetch('/api/teachers/ultra-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache', teacherId: user.id })
      })
    }
  }, [user?.id])
  
  const getCacheStats = useCallback(() => {
    return ultraFastCache.getCacheStats()
  }, [])
  
  const updateConfig = useCallback((newConfig: Partial<OptimizationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])
  
  // Track user interactions
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractionsRef.current++
    }
    
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    
    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])
  
  // Initial data load
  useEffect(() => {
    if (user?.id) {
      loadTeacherData()
    }
  }, [user?.id, loadTeacherData])
  
  // Real-time connection management
  useEffect(() => {
    if (config.enableRealTimeUpdates && user?.id && data) {
      connectRealTime()
    } else {
      disconnectRealTime()
    }
    
    return () => {
      disconnectRealTime()
    }
  }, [config.enableRealTimeUpdates, user?.id, data, connectRealTime, disconnectRealTime])
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    data,
    isLoading,
    error,
    performance,
    getClasses,
    getClass,
    getStudents,
    getStudent,
    getSubjects,
    getSubject,
    getAssessments,
    getAssessment,
    getGrades,
    createAssessment,
    submitGrade,
    refreshData,
    clearCache,
    getCacheStats,
    isRealTimeConnected,
    connectRealTime,
    disconnectRealTime,
    config,
    updateConfig
  }), [
    data,
    isLoading,
    error,
    performance,
    getClasses,
    getClass,
    getStudents,
    getStudent,
    getSubjects,
    getSubject,
    getAssessments,
    getAssessment,
    getGrades,
    createAssessment,
    submitGrade,
    refreshData,
    clearCache,
    getCacheStats,
    isRealTimeConnected,
    connectRealTime,
    disconnectRealTime,
    config,
    updateConfig
  ])
  
  return (
    <TeacherContext.Provider value={contextValue}>
      {children}
    </TeacherContext.Provider>
  )
}

export function useTeacher() {
  const context = useContext(TeacherContext)
  if (context === undefined) {
    throw new Error('useTeacher must be used within a TeacherProvider')
  }
  return context
}

// Specialized hooks for specific data types
export function useTeacherClasses() {
  const { getClasses, getClass, isLoading } = useTeacher()
  
  return {
    classes: getClasses(),
    getClass,
    isLoading
  }
}

export function useTeacherStudents(classId?: string) {
  const { getStudents, getStudent, isLoading } = useTeacher()
  
  return {
    students: getStudents(classId),
    getStudent,
    isLoading
  }
}


export function useTeacherGrades() {
  const { 
    getAssessments, 
    getAssessment, 
    getGrades, 
    createAssessment, 
    submitGrade,
    isLoading 
  } = useTeacher()
  
  return {
    assessments: getAssessments(),
    getAssessments,
    getAssessment,
    grades: getGrades(),
    getGrades,
    createAssessment,
    submitGrade,
    isLoading
  }
}
