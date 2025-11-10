"use client"

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Award, 
  Activity,
  Settings,
  Zap,
  Wifi,
  WifiOff
} from "lucide-react"
import { TeacherProvider, useTeacher } from '@/lib/teacher-ultra-fast/context'
import { UltraFastTeacherDashboard } from './ultra-fast-dashboard'
import { UltraFastClassesView } from './ultra-fast-classes-view'
import { UltraFastGrades } from './ultra-fast-grades'
import { UltraFastPerformanceDashboard } from './ultra-fast-performance-dashboard'
import { cn } from '@/lib/utils'

interface UltraFastTeacherAppProps {
  className?: string
}

function TeacherAppContent({ className }: UltraFastTeacherAppProps) {
  const { 
    data, 
    isLoading, 
    error, 
    isRealTimeConnected, 
    performance,
    config,
    updateConfig
  } = useTeacher()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showPerformance, setShowPerformance] = useState(false)

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (data && isRealTimeConnected) {
        // Data will be updated via real-time connection
        // Auto-refresh triggered
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [data, isRealTimeConnected])

  if (isLoading && !data) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        <div className="container mx-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Teacher Portal</h1>
                <p className="text-muted-foreground">Loading your ultra-fast teaching environment...</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-0 pb-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Teacher Data</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teacher Portal</h1>
            <p className="text-muted-foreground">
              Ultra-fast teaching environment with real-time updates
              <span className="ml-2 flex items-center gap-2">
                {isRealTimeConnected ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Ultra-Fast
                </Badge>
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConfig({ 
                enableRealTimeUpdates: !config.enableRealTimeUpdates 
              })}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Performance Dashboard */}
        {showPerformance && (
          <div className="mb-6">
            <UltraFastPerformanceDashboard />
          </div>
        )}

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Grades
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <UltraFastTeacherDashboard 
              onNavigate={(view) => setActiveTab(view)}
            />
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <UltraFastClassesView 
              onNavigate={(view) => setActiveTab(view)}
            />
          </TabsContent>


          <TabsContent value="grades" className="space-y-4">
            <UltraFastGrades 
              onSuccess={() => {
                // Refresh data after successful grade submission
                // Grades submitted successfully
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Analytics</CardTitle>
                  <CardDescription>Performance metrics and system health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performance?.loadTime != null ? performance.loadTime.toFixed(0) : "—"}ms
                      </div>
                      <p className="text-xs text-muted-foreground">Load Time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performance?.cacheHitRate != null ? performance.cacheHitRate.toFixed(1) : "—"}%
                      </div>
                      <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performance?.apiResponseTime != null ? performance.apiResponseTime.toFixed(0) : "—"}ms
                      </div>
                      <p className="text-xs text-muted-foreground">API Response</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {performance?.memoryUsage != null ? performance.memoryUsage.toFixed(1) : "—"}MB
                      </div>
                      <p className="text-xs text-muted-foreground">Memory Usage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Statistics</CardTitle>
                  <CardDescription>Current data state and freshness</CardDescription>
                </CardHeader>
                <CardContent>
                  {data && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Object.keys(data.classes).length}</div>
                        <p className="text-xs text-muted-foreground">Classes</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Object.keys(data.students).length}</div>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Object.keys(data.subjects).length}</div>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Object.keys(data.assignments).length}</div>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export function UltraFastTeacherApp({ className }: UltraFastTeacherAppProps) {
  return (
    <TeacherProvider>
      <TeacherAppContent className={className} />
    </TeacherProvider>
  )
}
