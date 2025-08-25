"use client"

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  CreditCard,
  Target,
  PieChart,
  Activity,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CollectionReport } from './reports/collection-report'
import { OutstandingReport } from './reports/outstanding-report'
import { RevenueReport } from './reports/revenue-report'

interface FinancialReportsProps {
  onNavigate?: (view: string) => void
}

export function FinancialReports({ onNavigate }: FinancialReportsProps = {}) {
  const [activeTab, setActiveTab] = useState("collection")

  const reportTabs = [
    {
      id: "collection",
      label: "Collection Report",
      icon: CreditCard,
      description: "Monthly fee collection summary with payment method breakdown"
    },
    {
      id: "outstanding",
      label: "Outstanding Balances",
      icon: AlertTriangle,
      description: "Students with outstanding fee balances and overdue payments"
    },
    {
      id: "revenue",
      label: "Revenue Trends",
      icon: TrendingUp,
      description: "Revenue trends and analysis by period, class, and fee category"
    }
  ]

  const quickStats = [
    {
      title: "Total Collections",
      value: "₦2,450,000",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      description: "This month"
    },
    {
      title: "Outstanding Amount",
      value: "₦890,000",
      change: "-8.2%",
      changeType: "negative",
      icon: AlertTriangle,
      description: "Pending payments"
    },
    {
      title: "Payment Rate",
      value: "78.5%",
      change: "+5.3%",
      changeType: "positive",
      icon: Target,
      description: "Collection efficiency"
    },
    {
      title: "Active Students",
      value: "1,234",
      change: "+2.1%",
      changeType: "positive",
      icon: Users,
      description: "With fee obligations"
    }
  ]

  const getChangeColor = (changeType: string) => {
    return changeType === "positive" ? "text-green-600" : "text-red-600"
  }

  const getChangeIcon = (changeType: string) => {
    return changeType === "positive" ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground">Comprehensive financial reporting and analytics dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate?.("financial")}>
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Management
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const ChangeIcon = getChangeIcon(stat.changeType)
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ChangeIcon className={`h-3 w-3 mr-1 ${getChangeColor(stat.changeType)}`} />
                  <span className={getChangeColor(stat.changeType)}>{stat.change}</span>
                  <span className="ml-1">from last month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Financial Reports
          </CardTitle>
          <CardDescription>
            Generate and view comprehensive financial reports for better decision making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {reportTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="collection" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Collection Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Monthly fee collection summary with payment method breakdown
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Real-time
                  </Badge>
                </div>
                <CollectionReport />
              </TabsContent>

              <TabsContent value="outstanding" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Outstanding Balances Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Students with outstanding fee balances and overdue payments
                    </p>
                  </div>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requires Attention
                  </Badge>
                </div>
                <OutstandingReport />
              </TabsContent>

              <TabsContent value="revenue" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Revenue Trends Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Revenue trends and analysis by period, class, and fee category
                    </p>
                  </div>
                  <Badge variant="default" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Analytics
                  </Badge>
                </div>
                <RevenueReport />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Payment Method Distribution
            </CardTitle>
            <CardDescription>
              Visual breakdown of payment methods used by students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Payment method analytics coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment Calendar
            </CardTitle>
            <CardDescription>
              Track payment schedules and due dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Payment calendar view coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
