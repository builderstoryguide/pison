"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase"
import { useAuth } from "@/lib/auth-context"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  time: string
  read: boolean
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "time" | "read" | "created_at">) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotifications: () => void // Kept for API compatibility, but might not delete from DB for now
  unreadCount: number
  loading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    try {
      /* eslint-disable no-console */
      if (!supabase) {
           console.error("Supabase client is not initialized")
           return
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
          console.warn("Skipping notification fetch: Invalid User ID format (expected UUID)", user.id)
          return
      }

      console.log("Fetching notifications for user:", user.id)
      /* eslint-enable no-console */

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (data) {
        interface NotificationDB {
          id: string
          title: string
          message: string
          type: "info" | "success" | "warning" | "error"
          created_at: string
          read: boolean
        }

        const formattedNotifications: Notification[] = data.map((n: NotificationDB) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          time: new Date(n.created_at).toLocaleString(), // Simple formatting
          read: n.read,
          created_at: n.created_at
        }))
        setNotifications(formattedNotifications)
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notifications:', error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()

    // Optional: Set up realtime subscription
    if (user) {
      const channel = supabase!
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
             const newNotification = payload.new as Notification
             const formatted: Notification = {
                id: newNotification.id,
                title: newNotification.title,
                message: newNotification.message,
                type: newNotification.type,
                time: new Date(newNotification.created_at).toLocaleString(),
                read: newNotification.read,
                created_at: newNotification.created_at
             }
             setNotifications(prev => {
               // Avoid duplicates from race condition with initial fetch
               if (prev.some(n => n.id === formatted.id)) {
                 return prev
               }
               return [formatted, ...prev]
             })          
          }
        )
        .subscribe()

      return () => {
        supabase!.removeChannel(channel)
      }
    }
    return undefined
  }, [user, fetchNotifications])

  const addNotification = useCallback(async (_notification: Omit<Notification, "id" | "time" | "read" | "created_at">) => {
    // This is primarily for local optimistic updates or client-side triggered notifications
    // For admin alerts, the database trigger/insertion happens elsewhere
    if (!user) return
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    if (!supabase) {
      // eslint-disable-next-line no-console
      console.error("Supabase client is not initialized")
      return
    }

    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error marking notification as read:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))

        if (!user) return

        const { error } = await supabase!
            .from('notifications')
            .update({ read: true })
            .eq('recipient_id', user.id)
            .eq('read', false)
        
        if (error) throw error
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error marking all as read:", err)
    }
  }, [user])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadCount,
    loading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
