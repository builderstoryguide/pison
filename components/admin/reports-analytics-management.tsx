"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Download,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  DollarSign,
  UserCheck,
  GraduationCap,
  Plus,
} from "lucide-react"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { ReportGenerationForm } from "./report-generation-form"
import { StudentAcademicPerformanceReport } from "./student-academic-performance-report"
import { useReportsAnalytics, type ReportTemplate, type GeneratedReport } from "@/lib/reports-analytics-context"

const categoryIcons = {
  academic: GraduationCap,
  financial: DollarSign,
  attendance: UserCheck,
  administrative: Users,
  examination: FileText,
}

const statusIcons = {
  generating: Clock,
  completed: CheckCircle,
  failed: XCircle,
}

const statusColors = {
  generating: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export function ReportsAnalyticsManagement() {
  const {
    reportTemplates,
    getReportTemplatesByCategory,
    generatedReports,
    deleteGeneratedReport,
    downloadReport,
    searchReports,
    filterReportsByStatus,
  } = useReportsAnalytics()

  const [activeTab, setActiveTab] = useState("analytics")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showGenerationForm, setShowGenerationForm] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Filter templates
  const filteredTemplates =
    selectedCategory === "all" ? reportTemplates : getReportTemplatesByCategory(selectedCategory)

  // Filter generated reports
  const filteredReports = (() => {
    let reports = generatedReports

    if (searchQuery) {
      reports = searchReports(searchQuery)
    }

    if (selectedStatus !== "all") {
      reports = reports.filter((report) => report.status === selectedStatus)
    }

    return reports
  })()

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setShowGenerationForm(true)
  }

  const handleReportGenerated = (reportId: string) => {
    setShowGenerationForm(false)
    setSelectedTemplate(null)
    // Optionally show success message or navigate to generated reports tab
    setActiveTab("generated")
  }

  const handleDeleteReport = (reportId: string) => {
    deleteGeneratedReport(reportId)
    setReportToDelete(null)
  }

  const renderTemplateCard = (template: ReportTemplate) => {
    const CategoryIcon = categoryIcons[template.category] || FileText

    return (
      <Card key={template.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CategoryIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="mt-1">{template.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {template.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {template.estimatedTime}
              </span>
              <span>Used {template.usageCount} times</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {template.outputFormats.map((format) => (
                <Badge key={format} variant="secondary" className="text-xs">
                  {format.toUpperCase()}
                </Badge>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted-foreground">
                {template.lastUsed ? `Last used: ${new Date(template.lastUsed).toLocaleDateString()}` : "Never used"}
              </span>
              <Button size="sm" onClick={() => handleGenerateReport(template)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGeneratedReportRow = (report: GeneratedReport) => {
    const StatusIcon = statusIcons[report.status]
    const statusColorClass = statusColors[report.status]

    return (
      <Card key={report.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">{report.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 truncate">{report.templateName}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{new Date(report.generatedAt).toLocaleString()}</span>
                  </span>
                  <span className="truncate">By: {report.generatedBy}</span>
                  {report.fileSize && <span className="truncate">Size: {report.fileSize}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge className={`${statusColorClass} capitalize text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{report.status}</span>
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {report.status === "completed" && (
                    <DropdownMenuItem onClick={() => downloadReport(report.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setReportToDelete(report.id)} 
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate reports and view analytics for your school</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="academic-performance" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic Performance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report Templates
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Generated Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="academic-performance" className="space-y-6">
          <StudentAcademicPerformanceReport />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search report templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="examination">Examination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredTemplates.map(renderTemplateCard)}</div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search generated reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 max-w-sm"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredReports.length > 0 ? (
              filteredReports.map(renderGeneratedReportRow)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reports found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || selectedStatus !== "all"
                      ? "Try adjusting your search or filters"
                      : "Generate your first report from the templates tab"}
                  </p>
                  {!searchQuery && selectedStatus === "all" && (
                    <Button onClick={() => setActiveTab("templates")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Templates
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Generation Dialog */}
      <Dialog open={showGenerationForm} onOpenChange={setShowGenerationForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <ReportGenerationForm
              template={selectedTemplate}
              onGenerate={handleReportGenerated}
              onCancel={() => {
                setShowGenerationForm(false)
                setSelectedTemplate(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
