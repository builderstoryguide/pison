"use client"

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetrics {
  usersLoadTime: number
  logsLoadTime: number
  lastUpdate: Date
  cacheHits: number
  cacheMisses: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    usersLoadTime: 0,
    logsLoadTime: 0,
    lastUpdate: new Date(),
    cacheHits: 0,
    cacheMisses: 0
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    setIsVisible(process.env.NODE_ENV === 'development')
  }, [])

  if (!isVisible) return null

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 500) return { status: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (loadTime < 1000) return { status: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (loadTime < 2000) return { status: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'Poor', color: 'bg-red-100 text-red-800' }
  }

  const usersStatus = getPerformanceStatus(metrics.usersLoadTime)
  const logsStatus = getPerformanceStatus(metrics.logsLoadTime)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <Badge variant="outline" className="text-xs">
              Dev
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Users API</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono">{metrics.usersLoadTime}ms</span>
                <Badge className={usersStatus.color + ' text-xs'}>
                  {usersStatus.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Logs API</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono">{metrics.logsLoadTime}ms</span>
                <Badge className={logsStatus.color + ' text-xs'}>
                  {logsStatus.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>Cache Hit Rate</span>
              <span className="font-mono">
                {metrics.cacheHits + metrics.cacheMisses > 0 
                  ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Last Update</span>
              <span className="font-mono">
                {metrics.lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Optimizations Applied:</span>
            </div>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Database indexes</li>
              <li>Query optimization</li>
              <li>Client-side caching</li>
              <li>Reduced payload size</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
