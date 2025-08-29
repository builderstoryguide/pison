"use client"

import { useUserManagement } from '@/lib/user-management-context'
import { 
  UserPlus, 
  School, 
  CreditCard, 
  UserCheck, 
  BookOpen, 
  FileText, 
  LogIn, 
  LogOut,
  Activity,
  Clock
} from 'lucide-react'

// Map action types to icons and colors
const actionConfig = {
  LOGIN: { icon: LogIn, color: 'text-green-500', bgColor: 'bg-green-100' },
  LOGOUT: { icon: LogOut, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  CREATE_USER: { icon: UserPlus, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  UPDATE_USER: { icon: UserCheck, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  DELETE_USER: { icon: UserCheck, color: 'text-red-500', bgColor: 'bg-red-100' },
  STATUS_CHANGE: { icon: Activity, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  PASSWORD_RESET: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  VIEW_GRADES: { icon: FileText, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  PAYMENT_RECORDED: { icon: CreditCard, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  CLASS_CREATED: { icon: School, color: 'text-green-500', bgColor: 'bg-green-100' },
  STUDENT_ENROLLED: { icon: UserPlus, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  TEACHER_ADDED: { icon: UserCheck, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  EXAM_CREATED: { icon: BookOpen, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  ATTENDANCE_MARKED: { icon: Activity, color: 'text-cyan-500', bgColor: 'bg-cyan-100' }
}

// Helper function to format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return activityTime.toLocaleDateString()
  }
}

// Helper function to get action display text
function getActionDisplayText(action: string, details: string): { title: string; description: string } {
  switch (action) {
    case 'LOGIN':
      return { title: 'User logged in', description: details }
    case 'LOGOUT':
      return { title: 'User logged out', description: details }
    case 'CREATE_USER':
      return { title: 'New user created', description: details }
    case 'UPDATE_USER':
      return { title: 'User updated', description: details }
    case 'DELETE_USER':
      return { title: 'User deleted', description: details }
    case 'STATUS_CHANGE':
      return { title: 'Status changed', description: details }
    case 'PASSWORD_RESET':
      return { title: 'Password reset', description: details }
    case 'VIEW_GRADES':
      return { title: 'Grades viewed', description: details }
    case 'PAYMENT_RECORDED':
      return { title: 'Payment recorded', description: details }
    case 'CLASS_CREATED':
      return { title: 'Class created', description: details }
    case 'STUDENT_ENROLLED':
      return { title: 'Student enrolled', description: details }
    case 'TEACHER_ADDED':
      return { title: 'Teacher added', description: details }
    case 'EXAM_CREATED':
      return { title: 'Exam created', description: details }
    case 'ATTENDANCE_MARKED':
      return { title: 'Attendance marked', description: details }
    default:
      return { title: action.replace(/_/g, ' ').toLowerCase(), description: details }
  }
}

export function RecentActivities() {
  const { activityLogs } = useUserManagement()

  // Get the 5 most recent activities
  const recentActivities = activityLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  if (recentActivities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activities</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => {
        const config = actionConfig[activity.action as keyof typeof actionConfig] || {
          icon: Activity,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100'
        }
        const IconComponent = config.icon
        const { title, description } = getActionDisplayText(activity.action, activity.details)

        return (
          <div key={activity.id} className="flex items-center">
            <IconComponent className={`mr-2 h-4 w-4 ${config.color}`} />
            <div className="ml-2 space-y-1 flex-1">
              <p className="text-sm font-medium leading-none">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="ml-auto font-medium text-xs text-muted-foreground">
              {formatRelativeTime(activity.timestamp)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
