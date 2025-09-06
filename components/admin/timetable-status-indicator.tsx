'use client'

import React from 'react'
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
  Calendar
} from 'lucide-react'
// Removed framer-motion import for compatibility

interface TimetableStatusIndicatorProps {
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  generatedBy?: string
  totalPeriods?: number
  showDetails?: boolean
}

const statusConfig = {
  not_generated: {
    icon: Calendar,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Not Generated',
    description: 'Timetable has not been generated yet',
    iconColor: 'text-gray-500'
  },
  generating: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Generating...',
    description: 'Timetable is being generated',
    iconColor: 'text-blue-600'
  },
  generated: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Generated',
    description: 'Timetable has been successfully generated',
    iconColor: 'text-green-600'
  },
  modified: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Modified',
    description: 'Timetable has been modified after generation',
    iconColor: 'text-orange-600'
  },
  error: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Error',
    description: 'Error occurred during timetable generation',
    iconColor: 'text-red-600'
  }
}

export function TimetableStatusIndicator({
  status,
  lastGenerated,
  lastModified,
  generatedBy,
  totalPeriods,
  showDetails = false
}: TimetableStatusIndicatorProps) {
  const config = statusConfig[status]
  const IconComponent = config.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusDetails = () => {
    const details: string[] = []
    
    if (totalPeriods !== undefined) {
      details.push(`${totalPeriods} periods`)
    }
    
    if (lastGenerated) {
      details.push(`Generated: ${formatDate(lastGenerated)}`)
    }
    
    if (lastModified && lastModified !== lastGenerated) {
      details.push(`Modified: ${formatDate(lastModified)}`)
    }
    
    if (generatedBy) {
      details.push(`By: ${generatedBy}`)
    }
    
    return details
  }

  const statusDetails = getStatusDetails()

  if (showDetails) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={status === 'generating' ? 'animate-spin' : ''}>
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
        
        {statusDetails.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-1">
            {statusDetails.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                {detail}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={status === 'generating' ? 'animate-spin' : ''}>
              <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
            </div>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{config.description}</p>
            {statusDetails.length > 0 && (
              <div className="text-xs space-y-1">
                {statusDetails.map((detail, index) => (
                  <div key={index}>{detail}</div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
