"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Award,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react"
import { useReportsAnalytics, type AnalyticsMetric } from "@/lib/reports-analytics-context"

const iconMap = {
  Users,
  TrendingUp,
  UserCheck,
  DollarSign,
  GraduationCap,
  Award,
  BarChart3,
}

export function AnalyticsDashboard() {
  const { analyticsMetrics, getMetricsByCategory, refreshAnalytics } = useReportsAnalytics()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [timePeriod, setTimePeriod] = useState<string>("current-term")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "enrollment", label: "Enrollment" },
    { value: "academic", label: "Academic" },
    { value: "financial", label: "Financial" },
    { value: "attendance", label: "Attendance" },
    { value: "staffing", label: "Staffing" },
  ]

  const timePeriods = [
    { value: "current-week", label: "Current Week" },
    { value: "current-month", label: "Current Month" },
    { value: "current-term", label: "Current Term" },
    { value: "academic-year", label: "Academic Year" },
  ]

  const filteredMetrics = selectedCategory === "all" ? analyticsMetrics : getMetricsByCategory(selectedCategory)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshAnalytics()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case "increase":
        return "text-green-600"
      case "decrease":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const renderMetricCard = (metric: AnalyticsMetric) => {
    const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || BarChart3

    return (
      <Card key={metric.id}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          {metric.change && (
            <div className="flex items-center gap-1 mt-1">
              {getChangeIcon(metric.changeType)}
              <span className={`text-xs ${getChangeColor(metric.changeType)}`}>
                {metric.change} from previous period
              </span>
            </div>
          )}
          {metric.description && <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Key metrics and insights for your school</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Controls
          </CardTitle>
          <CardDescription>
            Customize your analytics view by selecting categories and time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMetrics.map(renderMetricCard)}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key insights and trends for {timePeriods.find((p) => p.value === timePeriod)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Positive Trend
              </Badge>
              <span className="text-sm">Enrollment and attendance rates are showing consistent improvement</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                Achievement
              </Badge>
              <span className="text-sm">Fee collection rate has exceeded target by 7.3%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-orange-100 text-orange-800">
                Attention Needed
              </Badge>
              <span className="text-sm">Teacher-student ratio in technical classes needs monitoring</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparative Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sub-system Comparison</CardTitle>
            <CardDescription>Performance comparison between English and French sub-systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">English Sub-system</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <span className="text-sm">78%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">French Sub-system</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "82%" }}></div>
                  </div>
                  <span className="text-sm">82%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
            <CardDescription>Academic performance by educational branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Grammar</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <span className="text-sm">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Technical</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: "76%" }}></div>
                  </div>
                  <span className="text-sm">76%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Commercial</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: "79%" }}></div>
                  </div>
                  <span className="text-sm">79%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
