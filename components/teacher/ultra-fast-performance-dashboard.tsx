"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Wifi, 
  WifiOff,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Gauge,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Settings,
  Download,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { usePerformanceMetrics, usePerformanceOptimization } from '@/lib/teacher-ultra-fast/performance-monitor'
import { performanceMonitor } from '@/lib/teacher-ultra-fast/performance-monitor'
import { cn } from '@/lib/utils'

interface PerformanceDashboardProps {
  className?: string
}

export function UltraFastPerformanceDashboard({ className }: PerformanceDashboardProps) {
  const metrics = usePerformanceMetrics()
  const optimization = usePerformanceOptimization()
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const updateEvents = () => {
      setRecentEvents(performanceMonitor.getRecentEvents(20))
    }

    updateEvents()
    const interval = setInterval(updateEvents, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setRecentEvents(performanceMonitor.getRecentEvents(20))
      setIsRefreshing(false)
    }, 500)
  }

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      events: recentEvents
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const performanceScore = useMemo(() => {
    let score = 100
    
    // Deduct points for poor performance
    if (metrics.loadTime > 2000) score -= 20
    else if (metrics.loadTime > 1000) score -= 10
    
    if (metrics.renderTime > 16) score -= 15
    else if (metrics.renderTime > 8) score -= 8
    
    if (metrics.cacheHitRate < 80) score -= 15
    else if (metrics.cacheHitRate < 90) score -= 8
    
    if (metrics.apiResponseTime > 500) score -= 20
    else if (metrics.apiResponseTime > 200) score -= 10
    
    if (metrics.memoryUsage > 100) score -= 10
    else if (metrics.memoryUsage > 50) score -= 5
    
    return Math.max(0, score)
  }, [metrics])

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceStatus = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time performance monitoring and optimization</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportReport}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Performance Settings</DialogTitle>
                <DialogDescription>Configure performance monitoring and optimization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Performance monitoring settings would be configured here.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className={cn("text-4xl font-bold", getPerformanceColor(performanceScore))}>
                {performanceScore}
              </div>
              <p className="text-sm text-muted-foreground">/ 100</p>
            </div>
            <div className="flex-1 ml-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Performance Status</span>
                <Badge variant={performanceScore >= 90 ? "default" : performanceScore >= 70 ? "secondary" : "destructive"}>
                  {getPerformanceStatus(performanceScore)}
                </Badge>
              </div>
              <Progress value={performanceScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.loadTime ?? 0).toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.loadTime ?? 0) < 1000 ? 'Excellent' : (metrics?.loadTime ?? 0) < 2000 ? 'Good' : 'Needs improvement'}
            </p>
            <Progress 
              value={Math.max(0, Math.min(100, (2000 - (metrics?.loadTime ?? 0)) / 20))} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.cacheHitRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.cacheHitRate ?? 0) > 90 ? 'Excellent' : (metrics?.cacheHitRate ?? 0) > 80 ? 'Good' : 'Needs improvement'}
            </p>
            <Progress value={metrics?.cacheHitRate ?? 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.apiResponseTime ?? 0).toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.apiResponseTime ?? 0) < 200 ? 'Excellent' : (metrics?.apiResponseTime ?? 0) < 500 ? 'Good' : 'Needs improvement'}
            </p>
            <Progress 
              value={Math.max(0, Math.min(100, (500 - (metrics?.apiResponseTime ?? 0)) / 5))} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.memoryUsage ?? 0).toFixed(1)}MB</div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.memoryUsage ?? 0) < 50 ? 'Excellent' : (metrics?.memoryUsage ?? 0) < 100 ? 'Good' : 'Needs improvement'}
            </p>
            <Progress 
              value={Math.max(0, Math.min(100, (100 - (metrics?.memoryUsage ?? 0)) / 1))} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Render Time</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{(metrics?.renderTime ?? 0).toFixed(1)}ms</span>
                      {(metrics?.renderTime ?? 0) < 16 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, (16 - (metrics?.renderTime ?? 0)) / 0.16))} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Freshness</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{(metrics?.dataFreshness ?? 0).toFixed(1)}%</span>
                      {(metrics?.dataFreshness ?? 0) > 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={metrics?.dataFreshness ?? 0} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Interactions</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{metrics?.userInteractions ?? 0}</span>
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Time Target</span>
                    <Badge variant={(metrics?.loadTime ?? 0) < 1000 ? "default" : "secondary"}>
                      {(metrics?.loadTime ?? 0) < 1000 ? "Met" : "Not Met"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Target</span>
                    <Badge variant={(metrics?.cacheHitRate ?? 0) > 90 ? "default" : "secondary"}>
                      {(metrics?.cacheHitRate ?? 0) > 90 ? "Met" : "Not Met"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Target</span>
                    <Badge variant={(metrics?.apiResponseTime ?? 0) < 200 ? "default" : "secondary"}>
                      {(metrics?.apiResponseTime ?? 0) < 200 ? "Met" : "Not Met"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage Target</span>
                    <Badge variant={(metrics?.memoryUsage ?? 0) < 50 ? "default" : "secondary"}>
                      {(metrics?.memoryUsage ?? 0) < 50 ? "Met" : "Not Met"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Performance Events
              </CardTitle>
              <CardDescription>Latest performance events and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No performance events recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentEvents.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {event.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.duration > 0 ? `${event.duration.toFixed(2)}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {event.metadata ? Object.entries(event.metadata).slice(0, 2).map(([key, value]) => (
                              <div key={key}>
                                {key}: {String(value)}
                              </div>
                            )) : '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>Performance optimization suggestions and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Available Optimizations</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Optimize Memory
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Network className="h-4 w-4 mr-2" />
                        Preload Resources
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Cpu className="h-4 w-4 mr-2" />
                        Optimize Rendering
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Performance Tips</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Use virtual scrolling for large lists</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Implement aggressive caching strategies</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Optimize images and assets</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Use React.memo for expensive components</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
