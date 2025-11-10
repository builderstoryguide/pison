import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTeacherId } from '@/lib/teacher-lookup'

// Ultra-fast cache with Redis-like performance
interface UltraFastCache {
  data: any
  timestamp: number
  ttl: number
  hits: number
}

const ultraFastCache = new Map<string, UltraFastCache>()

// Ultra-short TTL for real-time data (30 seconds)
const ULTRA_FAST_TTL = 30 * 1000

// Cache key generator with versioning
function generateUltraFastCacheKey(teacherId: string, academicYear?: string, term?: string): string {
  const version = 'v1'
  return `ultra_fast:${version}:${teacherId}:${academicYear || 'all'}:${term || 'all'}`
}

// Ultra-fast cache operations
function getUltraFastCache(key: string): { data: any; hit: boolean } {
  const cached = ultraFastCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    cached.hits++
    console.log(`🚀 ULTRA-FAST Cache HIT (${cached.hits} hits): ${key}`)
    return { data: cached.data, hit: true }
  }
  
  if (cached) {
    console.log(`⏰ ULTRA-FAST Cache EXPIRED: ${key}`)
    ultraFastCache.delete(key)
  }
  
  return { data: null, hit: false }
}

function setUltraFastCache(key: string, data: any, ttl: number = ULTRA_FAST_TTL): void {
  ultraFastCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    hits: 0
  })
  console.log(`💾 ULTRA-FAST Cache SET: ${key}`)
}

// Ultra-optimized data transformer
function ultraFastTransform(cachedData: any): any {
  const startTime = performance.now()
  
  // Transform cached data to ensure proper structure
  const transformedAssignments = (cachedData.assignments || []).map((assignment: any) => ({
    ...assignment,
    branch: {
      ...assignment.branch,
      subject: assignment.branch?.subject || {
        id: assignment.subjectId || assignment.subject_id,
        subject_name: assignment.subjectName || assignment.subject_name || 'Unknown Subject',
        subject_code: assignment.subjectCode || assignment.subject_code || '',
        subsystem: assignment.subjectSubsystem || assignment.subject_subsystem || ''
      }
    },
    class: assignment.class || {
      id: assignment.classId || assignment.class_id,
      class_name: assignment.className || assignment.class_name || 'Unknown Class',
      class_level: assignment.classLevel || assignment.class_level || '',
      stream: assignment.stream || '',
      subsystem: assignment.subsystem || '',
      capacity: assignment.capacity || 0,
      current_enrollment: assignment.currentEnrollment || assignment.current_enrollment || 0,
      status: assignment.classStatus || assignment.class_status || 'active'
    }
  }))
  
  const result = {
    success: true,
    teacher: {
      id: cachedData.teacher_id,
      teacherId: cachedData.teacher_id,
      name: cachedData.teacher_name || 'Teacher Name',
      status: 'active'
    },
    classes: cachedData.classes || [],
    subjects: cachedData.subjects || [],
    assignments: transformedAssignments,
    summary: {
      totalClasses: cachedData.total_classes || 0,
      totalSubjects: cachedData.total_subjects || 0,
      totalAssignments: cachedData.total_assignments || 0,
      primaryAssignments: cachedData.primary_assignments || 0,
      transformTimeMs: 0
    },
    performance: {
      totalTimeMs: 0,
      queryTimeMs: 0,
      cacheHit: true,
      source: 'ultra_fast_cache'
    }
  }
  
  const transformTime = performance.now() - startTime
  result.summary.transformTimeMs = Math.round(transformTime)
  
  return result
}

// Main ultra-fast API handler
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Extract parameters
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const useCache = searchParams.get('cache') !== 'false'

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    // Generate ultra-fast cache key
    const cacheKey = generateUltraFastCacheKey(teacherId, academicYear || undefined, term || undefined)
    
    // Check ultra-fast cache first (sub-millisecond response)
    if (useCache) {
      const { data: cachedData, hit } = getUltraFastCache(cacheKey)
      if (hit) {
        const totalTime = performance.now() - startTime
        let result
        if (cachedData.raw) {
          // Cache contains raw data that needs transformation
          result = transformFallbackData(cachedData.data)
        } else {
          // Cache contains already transformed data
          result = ultraFastTransform(cachedData)
        }
        // Ensure performance object exists before setting properties
        if (!result.performance) {
          result.performance = {
            totalTimeMs: 0,
            queryTimeMs: 0,
            cacheHit: true,
            source: 'ultra_fast_cache'
          }
        }
        result.performance.totalTimeMs = Math.round(totalTime)
        return NextResponse.json(result)
      }
    }

    console.log(`🔍 ULTRA-FAST: Fetching from materialized view for teacher: ${teacherId}`)

    // Step 1: Try materialized view first (ultra-fast)
    const queryStartTime = performance.now()
    
    // Use the centralized teacher lookup utility
    const teacher = await resolveTeacherId(supabase, teacherId)
    
    if (!teacher) {
      console.log('⚠️ No teacher found for ID:', teacherId)
      return NextResponse.json({ 
        success: false,
        error: 'Teacher not found',
        details: 'No teacher record found for the provided ID',
        debug: {
          teacherId: teacherId,
          suggestion: 'Teacher may not exist or ID format is invalid'
        }
      }, { status: 404 })
    }
    
    const actualTeacherId = teacher.id
    console.log('✅ Found teacher:', teacher.first_name, teacher.last_name, 'ID:', actualTeacherId)
    
    const { data: cachedData, error: cacheError } = await supabase
      .rpc('get_cached_teacher_assignments', {
        p_teacher_id: actualTeacherId,
        p_academic_year: academicYear,
        p_term: term
      })

    const queryTime = performance.now() - queryStartTime

    if (!cacheError && cachedData && cachedData.length > 0) {
      console.log(`⚡ Materialized view query completed in ${queryTime.toFixed(2)}ms`)
      
      // Cache the result for ultra-fast future access
      if (useCache) {
        setUltraFastCache(cacheKey, cachedData[0])
      }
      
      const totalTime = performance.now() - startTime
      const result = ultraFastTransform(cachedData[0])
      
      // Ensure performance object exists before setting properties
      if (!result.performance) {
        result.performance = {
          totalTimeMs: 0,
          queryTimeMs: 0,
          cacheHit: false,
          source: 'materialized_view'
        }
      }
      
      result.performance.totalTimeMs = Math.round(totalTime)
      result.performance.queryTimeMs = Math.round(queryTime)
      result.performance.cacheHit = false
      result.performance.source = 'materialized_view'
      
      return NextResponse.json(result)
    }

    // Step 2: Fallback to optimized function if materialized view fails
    console.log(`🔄 Fallback to optimized function for teacher: ${teacherId}`)
    
    const { data: rawAssignments, error: queryError } = await supabase
      .rpc('get_teacher_assignments_optimized', {
        p_teacher_id: actualTeacherId,
        p_academic_year: academicYear,
        p_term: term
      })

    if (queryError) {
      console.error('❌ Both cache and query failed:', queryError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch assignments' 
      }, { status: 500 })
    }

    // Transform fallback data (this is the slower path)
    const transformedData = transformFallbackData(rawAssignments || [])
    
    // Cache the raw data with a flag to indicate it needs transformation
    if (useCache) {
      // Normalize rawAssignments to ensure it's always an array
      const normalizedAssignments = Array.isArray(rawAssignments) ? rawAssignments : (rawAssignments ? [rawAssignments] : [])
      setUltraFastCache(cacheKey, { raw: true, data: normalizedAssignments })
    }

    const totalTime = performance.now() - startTime

    return NextResponse.json({
      ...transformedData,
      performance: {
        totalTimeMs: Math.round(totalTime),
        queryTimeMs: Math.round(queryTime),
        cacheHit: false,
        source: 'fallback_query'
      }
    })

  } catch (error) {
    console.error('❌ ULTRA-FAST API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Fallback data transformer (used when materialized view is not available)
function transformFallbackData(rawAssignments: any[]): any {
  const startTime = performance.now()
  
  const classMap = new Map()
  const subjectMap = new Map()
  const assignmentMap = new Map()
  
  let teacher: any = null
  
  for (const assignment of rawAssignments) {
    if (!teacher) {
      teacher = {
        id: assignment.teacher_id,
        teacherId: assignment.teacher_identifier,
        name: `${assignment.first_name} ${assignment.last_name}`,
        status: assignment.teacher_status
      }
    }
    
    if (!classMap.has(assignment.class_id)) {
      classMap.set(assignment.class_id, {
        id: assignment.class_id,
        name: assignment.class_name,
        level: assignment.class_level,
        stream: assignment.stream,
        subsystem: assignment.subsystem,
        capacity: assignment.capacity,
        currentEnrollment: assignment.current_enrollment,
        status: assignment.class_status
      })
    }
    
    if (!subjectMap.has(assignment.subject_id)) {
      subjectMap.set(assignment.subject_id, {
        id: assignment.subject_id,
        name: assignment.subject_name,
        code: assignment.subject_code,
        subsystem: assignment.subject_subsystem
      })
    }
    
    assignmentMap.set(assignment.assignment_id, {
      id: assignment.assignment_id,
      teacherId: assignment.teacher_id,
      classId: assignment.class_id,
      subjectId: assignment.subject_id,
      branchId: assignment.branch_id,
      academicYear: assignment.academic_year,
      term: assignment.term,
      isPrimaryTeacher: assignment.is_primary_teacher,
      assignedAt: assignment.assigned_at,
      branch: {
        id: assignment.branch_id,
        branch_name: assignment.branch_name,
        branch_code: assignment.branch_code,
        weight_percentage: assignment.weight_percentage,
        subject: {
          id: assignment.subject_id,
          subject_name: assignment.subject_name,
          subject_code: assignment.subject_code,
          subsystem: assignment.subject_subsystem
        }
      },
      class: {
        id: assignment.class_id,
        class_name: assignment.class_name,
        class_level: assignment.class_level,
        stream: assignment.stream,
        subsystem: assignment.subsystem,
        capacity: assignment.capacity,
        current_enrollment: assignment.current_enrollment,
        status: assignment.class_status
      }
    })
  }
  
  const transformTime = performance.now() - startTime
  
  return {
    success: true,
    teacher,
    classes: Array.from(classMap.values()),
    subjects: Array.from(subjectMap.values()),
    assignments: Array.from(assignmentMap.values()),
    summary: {
      totalClasses: classMap.size,
      totalSubjects: subjectMap.size,
      totalAssignments: assignmentMap.size,
      primaryAssignments: Array.from(assignmentMap.values()).filter(a => a.isPrimaryTeacher).length,
      transformTimeMs: Math.round(transformTime)
    },
    performance: {
      totalTimeMs: 0, // Will be set by the caller
      queryTimeMs: 0,
      cacheHit: true,
      source: 'fallback_transform'
    }
  }
}

// Cache management and repair endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, teacherId, academicYear, term, userId } = body

    if (action === 'repair_user_profile') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required for repair' }, { status: 400 })
      }

      const supabase = await createClient()
      if (!supabase) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ 
          success: false,
          error: 'User not found',
          details: userError?.message 
        }, { status: 404 })
      }

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingProfile) {
        return NextResponse.json({ 
          success: true,
          message: 'User profile already exists',
          profileId: existingProfile.id
        })
      }

      // Try to find corresponding teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id, teacher_id')
        .eq('email', user.email)
        .single()

      if (teacherError || !teacher) {
        return NextResponse.json({ 
          success: false,
          error: 'No corresponding teacher record found',
          details: 'Cannot create profile without teacher record',
          suggestion: 'Create teacher record first or check email match'
        }, { status: 404 })
      }

      // Create user profile
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          role_specific_id: teacher.teacher_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({ 
          success: false,
          error: 'Failed to create user profile',
          details: profileError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'User profile created successfully',
        profile: newProfile,
        teacher: {
          id: teacher.id,
          teacher_id: teacher.teacher_id
        }
      })
    }

    if (action === 'clear_cache') {
      if (teacherId) {
        // Clear specific teacher cache
        const keysToDelete = Array.from(ultraFastCache.keys())
          .filter(key => key.includes(`ultra_fast:v1:${teacherId}`))
        keysToDelete.forEach(key => ultraFastCache.delete(key))
        
        return NextResponse.json({
          success: true,
          message: `Cleared cache for teacher ${teacherId}`,
          clearedKeys: keysToDelete.length
        })
      } else {
        // Clear all cache
        const cacheSize = ultraFastCache.size
        ultraFastCache.clear()
        
        return NextResponse.json({
          success: true,
          message: 'Cleared all ultra-fast cache',
          clearedKeys: cacheSize
        })
      }
    }

    if (action === 'cache_stats') {
      const stats = Array.from(ultraFastCache.entries()).map(([key, value]) => ({
        key,
        hits: value.hits,
        age: Date.now() - value.timestamp,
        ttl: value.ttl
      }))

      return NextResponse.json({
        success: true,
        cacheSize: ultraFastCache.size,
        stats
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Cache management error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Cache management failed' 
    }, { status: 500 })
  }
}
