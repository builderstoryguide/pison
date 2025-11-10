'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Clock, Database, Zap, TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceMetrics {
  loadTime: number
  dataSize: number
  cacheHitRate: number
  queryCount: number
  lastUpdated: Date
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
  onRefresh?: () => void
  className?: string
}

export function PerformanceMonitor({ metrics, onRefresh, className }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [history, setHistory] = useState<PerformanceMetrics[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track performance history
  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, metrics].slice(-10) // Keep last 10 measurements
      return newHistory
    })
  }, [metrics])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (onRefresh) {
      intervalRef.current = setInterval(() => {
        onRefresh()
      }, 30000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [onRefresh])

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 100) return { status: 'excellent', color: 'bg-green-500', icon: Zap }
    if (loadTime < 300) return { status: 'good', color: 'bg-blue-500', icon: TrendingUp }
    if (loadTime < 1000) return { status: 'fair', color: 'bg-yellow-500', icon: Activity }
    return { status: 'poor', color: 'bg-red-500', icon: TrendingDown }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const performanceStatus = getPerformanceStatus(metrics.loadTime)
  const StatusIcon = performanceStatus.icon

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
            <CardDescription className="text-xs">
              Real-time performance metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${performanceStatus.color} text-white text-xs`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {performanceStatus.status}
            </Badge>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
              >
                <Activity className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Load Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Load Time</span>
          </div>
          <span className="text-sm font-mono">{formatTime(metrics.loadTime)}</span>
        </div>

        {/* Data Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Data Size</span>
          </div>
          <span className="text-sm font-mono">{formatBytes(metrics.dataSize)}</span>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Cache Hit Rate</span>
          </div>
          <span className="text-sm font-mono">{metrics.cacheHitRate.toFixed(1)}%</span>
        </div>

        {/* Query Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Queries</span>
          </div>
          <span className="text-sm font-mono">{metrics.queryCount}</span>
        </div>

        {/* Last Updated */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Last Updated</span>
            <span className="text-xs text-muted-foreground">
              {metrics.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Performance History */}
        {history.length > 1 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Load Time Trend</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
                className="h-5 text-xs"
              >
                {isVisible ? 'Hide' : 'Show'} History
              </Button>
            </div>
            {isVisible && (
              <div className="space-y-1">
                {history.slice(-5).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {metric.lastUpdated.toLocaleTimeString()}
                    </span>
                    <span className="font-mono">{formatTime(metric.loadTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for measuring performance
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    dataSize: 0,
    cacheHitRate: 0,
    queryCount: 0,
    lastUpdated: new Date()
  })

  const measurePerformance = async (operation: () => Promise<any>) => {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    try {
      const result = await operation()
      const endTime = performance.now()
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      const loadTime = endTime - startTime
      const dataSize = endMemory - startMemory
      
      setMetrics(prev => ({
        ...prev,
        loadTime,
        dataSize: Math.max(0, dataSize),
        queryCount: prev.queryCount + 1,
        lastUpdated: new Date()
      }))
      
      return result
    } catch (error) {
      const endTime = performance.now()
      setMetrics(prev => ({
        ...prev,
        loadTime: endTime - startTime,
        queryCount: prev.queryCount + 1,
        lastUpdated: new Date()
      }))
      throw error
    }
  }

  return { metrics, measurePerformance }
}
