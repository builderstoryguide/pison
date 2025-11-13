"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth-context"

export interface Alert {
  id: string
  title: string
  content: string
  alert_type: 'sms' | 'email' | 'both'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AlertRecipient {
  id: string
  alert_id: string
  parent_id: string
  student_id: string
  delivery_method: 'sms' | 'email'
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed'
  delivered_at: string | null
  read_at: string | null
  created_at: string
  parent?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  student?: {
    student_id: string
    first_name: string
    last_name: string
    class: string | null
  }
}

export interface AlertGroup {
  id: string
  name: string
  description: string | null
  group_type: 'class' | 'grade' | 'custom' | 'all'
  criteria: any
  created_at: string
  updated_at: string
  member_count?: number
}

export interface ParentGroup {
  id: string
  name: string
  description: string
  count: number
  group_type?: 'class' | 'grade' | 'custom' | 'all'
}

interface AlertsContextType {
  alerts: Alert[]
  alertRecipients: AlertRecipient[]
  alertGroups: AlertGroup[]
  parentGroups: ParentGroup[]
  isLoading: boolean
  error: string | null

  // Alert Management
  fetchAlerts: () => Promise<void>
  fetchAlertHistory: (limit?: number) => Promise<Alert[]>
  sendAlert: (data: {
    title: string
    content: string
    alert_type: 'sms' | 'email' | 'both'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    groupIds?: string[]
    parentIds?: string[]
    scheduled_at?: string | null
  }) => Promise<{ success: boolean; alertId?: string; error?: string }>
  scheduleAlert: (alertId: string, scheduledAt: string) => Promise<{ success: boolean; error?: string }>
  deleteAlert: (alertId: string) => Promise<{ success: boolean; error?: string }>

  // Parent Groups
  fetchParentGroups: () => Promise<void>
  createParentGroup: (data: {
    name: string
    description: string
    group_type: 'class' | 'grade' | 'custom' | 'all'
    criteria?: any
  }) => Promise<{ success: boolean; groupId?: string; error?: string }>

  // Parent Alerts
  fetchParentAlerts: (parentId: string) => Promise<AlertRecipient[]>
  markAlertAsRead: (recipientId: string) => Promise<{ success: boolean; error?: string }>
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined)

export function useAlerts() {
  const context = useContext(AlertsContext)
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertsProvider")
  }
  return context
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertRecipients, setAlertRecipients] = useState<AlertRecipient[]>([])
  const [alertGroups, setAlertGroups] = useState<AlertGroup[]>([])
  const [parentGroups, setParentGroups] = useState<ParentGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    if (user) {
      fetchAlerts()
      fetchParentGroups()
    }
  }, [user])

  const fetchAlerts = useCallback(async () => {
    if (!supabase || !user) return

    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError
      setAlerts(data || [])
    } catch (err: any) {
      console.error('Error fetching alerts:', err)
      setError(err.message || 'Failed to fetch alerts')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const fetchAlertHistory = useCallback(async (limit: number = 50): Promise<Alert[]> => {
    if (!supabase || !user) return []

    try {
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      console.error('Error fetching alert history:', err)
      return []
    }
  }, [user])

  const fetchParentGroups = useCallback(async () => {
    if (!supabase || !user) return

    setIsLoading(true)
    setError(null)
    try {
      // Fetch all parents with their students to build groups
      const { data: parentsData, error: parentsError } = await supabase
        .from('parents')
        .select(`
          id,
          name,
          student_id,
          students (
            student_id,
            first_name,
            last_name,
            class,
            class_name
          )
        `)

      if (parentsError) throw parentsError

      // Build dynamic groups
      const groups: ParentGroup[] = []

      // All Parents group
      const allParentsCount = parentsData?.length || 0
      groups.push({
        id: 'all-parents',
        name: 'All Parents',
        description: 'All registered parents',
        count: allParentsCount,
        group_type: 'all'
      })

      // Group by class
      const classGroups = new Map<string, Set<string>>()
      parentsData?.forEach((parent: any) => {
        const className = parent.students?.class || parent.students?.class_name || 'Unknown'
        if (!classGroups.has(className)) {
          classGroups.set(className, new Set())
        }
        classGroups.get(className)?.add(parent.id)
      })

      classGroups.forEach((parentIds, className) => {
        groups.push({
          id: `class-${className.replace(/\s+/g, '-').toLowerCase()}`,
          name: `${className} Parents`,
          description: `Parents of students in ${className}`,
          count: parentIds.size,
          group_type: 'class'
        })
      })

      // Fetch custom groups from database
      const { data: customGroups, error: customError } = await supabase
        .from('alert_groups')
        .select(`
          id,
          name,
          description,
          group_type,
          criteria
        `)

      if (!customError && customGroups) {
        // Get member counts for custom groups
        for (const group of customGroups) {
          const { count } = await supabase
            .from('alert_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          groups.push({
            id: group.id,
            name: group.name,
            description: group.description || '',
            count: count || 0,
            group_type: group.group_type
          })
        }
      }

      setParentGroups(groups)
    } catch (err: any) {
      console.error('Error fetching parent groups:', err)
      setError(err.message || 'Failed to fetch parent groups')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const sendAlert = useCallback(async (data: {
    title: string
    content: string
    alert_type: 'sms' | 'email' | 'both'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    groupIds?: string[]
    parentIds?: string[]
    scheduled_at?: string | null
  }): Promise<{ success: boolean; alertId?: string; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    setIsLoading(true)
    setError(null)
    try {
      // Create alert record
      const alertData = {
        title: data.title,
        content: data.content,
        alert_type: data.alert_type,
        priority: data.priority,
        status: data.scheduled_at ? 'scheduled' : 'draft',
        scheduled_at: data.scheduled_at || null,
        created_by: user.id
      }

      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .single()

      if (alertError) throw alertError
      if (!alert) throw new Error('Failed to create alert')

      // Get parent IDs based on groups or direct selection
      let targetParentIds: string[] = []

      if (data.parentIds && data.parentIds.length > 0) {
        targetParentIds = data.parentIds
      } else if (data.groupIds && data.groupIds.length > 0) {
        // Get parents from groups
        for (const groupId of data.groupIds) {
          if (groupId === 'all-parents') {
            // Get all parents
            const { data: allParents } = await supabase
              .from('parents')
              .select('id, student_id')
            if (allParents) {
              targetParentIds.push(...allParents.map(p => p.id))
            }
          } else if (groupId.startsWith('class-')) {
            // Get parents by class
            const className = groupId.replace('class-', '').replace(/-/g, ' ')
            const { data: classParents } = await supabase
              .from('parents')
              .select(`
                id,
                student_id,
                students!inner(class, class_name)
              `)
              .or(`students.class.eq.${className},students.class_name.eq.${className}`)
            if (classParents) {
              targetParentIds.push(...classParents.map(p => p.id))
            }
          } else {
            // Custom group - get from alert_group_members
            const { data: members } = await supabase
              .from('alert_group_members')
              .select('parent_id, student_id')
              .eq('group_id', groupId)
            if (members) {
              targetParentIds.push(...members.map(m => m.parent_id))
            }
          }
        }
      }

      // Remove duplicates
      targetParentIds = [...new Set(targetParentIds)]

      // Create recipient records
      if (targetParentIds.length > 0) {
        const recipients = []
        for (const parentId of targetParentIds) {
          // Get parent and student info
          const { data: parentData } = await supabase
            .from('parents')
            .select('student_id')
            .eq('id', parentId)
            .single()

          if (parentData) {
            const deliveryMethods = data.alert_type === 'both' ? ['sms', 'email'] : [data.alert_type]
            for (const method of deliveryMethods) {
              recipients.push({
                alert_id: alert.id,
                parent_id: parentId,
                student_id: parentData.student_id,
                delivery_method: method,
                delivery_status: 'pending'
              })
            }
          }
        }

        if (recipients.length > 0) {
          const { error: recipientsError } = await supabase
            .from('alert_recipients')
            .insert(recipients)

          if (recipientsError) throw recipientsError
        }
      }

      // Update alert status to sent if not scheduled
      if (!data.scheduled_at) {
        await supabase
          .from('alerts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', alert.id)
      }

      await fetchAlerts()
      return { success: true, alertId: alert.id }
    } catch (err: any) {
      console.error('Error sending alert:', err)
      const errorMessage = err.message || 'Failed to send alert'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchAlerts])

  const scheduleAlert = useCallback(async (alertId: string, scheduledAt: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { error: updateError } = await supabase
        .from('alerts')
        .update({
          scheduled_at: scheduledAt,
          status: 'scheduled'
        })
        .eq('id', alertId)

      if (updateError) throw updateError
      await fetchAlerts()
      return { success: true }
    } catch (err: any) {
      console.error('Error scheduling alert:', err)
      return { success: false, error: err.message || 'Failed to schedule alert' }
    }
  }, [user, fetchAlerts])

  const deleteAlert = useCallback(async (alertId: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { error: deleteError } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (deleteError) throw deleteError
      await fetchAlerts()
      return { success: true }
    } catch (err: any) {
      console.error('Error deleting alert:', err)
      return { success: false, error: err.message || 'Failed to delete alert' }
    }
  }, [user, fetchAlerts])

  const createParentGroup = useCallback(async (data: {
    name: string
    description: string
    group_type: 'class' | 'grade' | 'custom' | 'all'
    criteria?: any
  }): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data: group, error: groupError } = await supabase
        .from('alert_groups')
        .insert({
          name: data.name,
          description: data.description,
          group_type: data.group_type,
          criteria: data.criteria || {}
        })
        .select()
        .single()

      if (groupError) throw groupError
      await fetchParentGroups()
      return { success: true, groupId: group.id }
    } catch (err: any) {
      console.error('Error creating parent group:', err)
      return { success: false, error: err.message || 'Failed to create parent group' }
    }
  }, [user, fetchParentGroups])

  const fetchParentAlerts = useCallback(async (parentId: string): Promise<AlertRecipient[]> => {
    if (!supabase) return []

    try {
      const { data, error: fetchError } = await supabase
        .from('alert_recipients')
        .select(`
          *,
          alerts (*),
          parents (id, name, email, phone),
          students (student_id, first_name, last_name, class)
        `)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      console.error('Error fetching parent alerts:', err)
      return []
    }
  }, [])

  const markAlertAsRead = useCallback(async (recipientId: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Database not available' }
    }

    try {
      const { error: updateError } = await supabase
        .from('alert_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('id', recipientId)

      if (updateError) throw updateError
      return { success: true }
    } catch (err: any) {
      console.error('Error marking alert as read:', err)
      return { success: false, error: err.message || 'Failed to mark alert as read' }
    }
  }, [])

  const value: AlertsContextType = {
    alerts,
    alertRecipients,
    alertGroups,
    parentGroups,
    isLoading,
    error,
    fetchAlerts,
    fetchAlertHistory,
    sendAlert,
    scheduleAlert,
    deleteAlert,
    fetchParentGroups,
    createParentGroup,
    fetchParentAlerts,
    markAlertAsRead
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

