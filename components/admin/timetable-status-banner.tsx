'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  Calendar,
  User,
  Eye,
  X,
  Zap,
  Info
} from 'lucide-react'

interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  generatedBy?: string
  totalPeriods?: number
  academicYear?: string
  term?: string
}

interface TimetableStatusBannerProps {
  timetableClass: TimetableClass
  onViewTimetable?: () => void
  onDismiss?: () => void
  showActions?: boolean
}

const statusConfig = {
  not_generated: {
    icon: Calendar,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Not Generated',
    description: 'Timetable has not been generated yet',
    iconColor: 'text-gray-500',
    priority: 'low' as const
  },
  generating: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Generating...',
    description: 'Timetable is being generated',
    iconColor: 'text-blue-600',
    priority: 'high' as const
  },
  generated: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Generated Successfully',
    description: 'Timetable has been successfully generated',
    iconColor: 'text-green-600',
    priority: 'high' as const
  },
  modified: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Modified',
    description: 'Timetable has been modified after generation',
    iconColor: 'text-orange-600',
    priority: 'medium' as const
  },
  error: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-300',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Generation Failed',
    description: 'Error occurred during timetable generation',
    iconColor: 'text-red-600',
    priority: 'high' as const
  }
}

export function TimetableStatusBanner({
  timetableClass,
  onViewTimetable,
  onDismiss,
  showActions = true
}: TimetableStatusBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  
  const config = statusConfig[timetableClass.status]
  const IconComponent = config.icon
  
  // Auto-hide low priority statuses after some time
  useEffect(() => {
    if (config.priority === 'low' && onDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [config.priority, onDismiss])

  // Don't render if not visible or low priority status without recent activity
  if (!isVisible || (config.priority === 'low' && !timetableClass.lastGenerated)) {
    return null
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return formatDate(dateString)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <TooltipProvider>
      <Card className={`${config.bgColor} ${config.borderColor} border-l-4 transition-all duration-300 hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Status Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 border">
                <IconComponent 
                  className={`h-6 w-6 ${config.iconColor} ${
                    timetableClass.status === 'generating' ? 'animate-spin' : ''
                  }`} 
                />
              </div>

              {/* Status Information */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {timetableClass.name}
                  </h3>
                  <Badge className={config.color}>
                    {config.label}
                  </Badge>
                  {timetableClass.status === 'generated' && (
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {timetableClass.totalPeriods} periods
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-700">
                  {config.description}
                  {timetableClass.lastGenerated && (
                    <span className="ml-2 text-gray-600">
                      • {getTimeAgo(timetableClass.lastGenerated)}
                    </span>
                  )}
                </p>

                {/* Quick Details */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {timetableClass.level} • {timetableClass.subsystem}
                  </span>
                  {timetableClass.generatedBy && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Generated by {timetableClass.generatedBy}
                    </span>
                  )}
                </div>

                {/* Expandable Details */}
                {showDetails && (
                  <div className="mt-3 p-3 bg-white/50 rounded-md border border-white/70 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Academic Year:</span>
                        <span className="ml-2 font-medium">{timetableClass.academicYear || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Term:</span>
                        <span className="ml-2 font-medium capitalize">{timetableClass.term || 'N/A'}</span>
                      </div>
                      {timetableClass.lastGenerated && (
                        <div>
                          <span className="text-gray-600">Generated:</span>
                          <span className="ml-2 font-medium">{formatDate(timetableClass.lastGenerated)}</span>
                        </div>
                      )}
                      {timetableClass.lastModified && timetableClass.lastModified !== timetableClass.lastGenerated && (
                        <div>
                          <span className="text-gray-600">Last Modified:</span>
                          <span className="ml-2 font-medium">{formatDate(timetableClass.lastModified)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2 ml-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showDetails ? 'Hide details' : 'Show details'}
                  </TooltipContent>
                </Tooltip>

                {timetableClass.status === 'generated' && onViewTimetable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewTimetable}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Timetable
                  </Button>
                )}

                {onDismiss && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Dismiss notification
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
