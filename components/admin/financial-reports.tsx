"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  Receipt,
  ShoppingCart,
  Users,
  UserPlus2,
  School
} from "lucide-react"

export function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")

  const reportSections = [
    {
      id: "expenditures",
      title: "Expenditures Report",
      description: "Track and analyze school expenses and financial outflows",
      icon: Receipt,
      color: "text-red-600",
      bgColor: "bg-red-50",
      stats: {
        total: 125000,
        change: -5.2,
        period: "vs last month"
      }
    },
    {
      id: "sales",
      title: "Sales Report", 
      description: "Monitor revenue from school sales and services",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
      stats: {
        total: 85000,
        change: 12.5,
        period: "vs last month"
      }
    },
    {
      id: "pta",
      title: "PTA Finances",
      description: "Parent-Teacher Association financial activities and contributions",
      icon: Users,
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
      stats: {
        total: 45000,
        change: 8.3,
        period: "vs last month"
      }
    },
    {
      id: "registration",
      title: "Registration Finances",
      description: "Student registration fees and payment tracking",
      icon: UserPlus2,
      color: "text-purple-600",
      bgColor: "bg-purple-50", 
      stats: {
        total: 320000,
        change: 15.7,
        period: "vs last month"
      }
    },
    {
      id: "fees",
      title: "School Fees",
      description: "Tuition fees, examination fees, and other school charges",
      icon: School,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      stats: {
        total: 2800000,
        change: 3.2,
        period: "vs last month"
      }
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const generateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report for period: ${selectedPeriod}`)
    // TODO: Implement actual report generation logic
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive financial reports for the school system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="current-year">Current Year</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportSections.map((section) => (
              <Card key={section.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <section.icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <Badge variant={section.stats.change >= 0 ? "default" : "destructive"}>
                      {section.stats.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(section.stats.change)}%
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(section.stats.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.stats.period}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => generateReport(section.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(section.id)}
                        aria-label={`Export ${section.title}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-6">
            {reportSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <PieChart className="h-4 w-4 mr-2" />
                        Chart View
                      </Button>
                      <Button variant="outline" size="sm" aria-label={`Export ${section.title} as PDF`}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm" aria-label={`Export ${section.title} as Excel`}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <section.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed {section.title} will be displayed here</p>
                    <p className="text-sm">Click "View Report" to generate detailed analysis</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
                <CardDescription>Monthly financial performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Financial trends chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Breakdown of revenue sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Revenue distribution chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
