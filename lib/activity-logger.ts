// Simple activity logging utility
export interface ActivityLogEntry {
  id: string
  action: string
  details: string
  timestamp: string
  userId?: string
  userName?: string
}

class ActivityLogger {
  private static instance: ActivityLogger
  private listeners: ((activity: ActivityLogEntry) => void)[] = []

  private constructor() {}

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger()
    }
    return ActivityLogger.instance
  }

  logActivity(action: string, details: string, userId?: string, userName?: string) {
    const activity: ActivityLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString(),
      userId,
      userName
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(activity))
  }

  subscribe(listener: (activity: ActivityLogEntry) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

export const activityLogger = ActivityLogger.getInstance()
