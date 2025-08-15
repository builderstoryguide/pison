"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

// Report Template Types
export interface ReportParameter {
  id: string
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "multiselect" | "boolean"
  required: boolean
  options?: { value: string; label: string }[]
  defaultValue?: any
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: "academic" | "financial" | "attendance" | "administrative" | "examination"
  parameters: ReportParameter[]
  outputFormats: ("pdf" | "excel" | "csv")[]
  estimatedTime: string
  lastUsed?: string
  usageCount: number
}

export interface GeneratedReport {
  id: string
  templateId: string
  templateName: string
  title: string
  parameters: Record<string, any>
  format: "pdf" | "excel" | "csv"
  status: "generating" | "completed" | "failed"
  generatedAt: string
  generatedBy: string
  fileSize?: string
  downloadUrl?: string
  notes?: string
}

export interface AnalyticsMetric {
  id: string
  name: string
  value: string | number
  previousValue?: string | number
  change?: string
  changeType?: "increase" | "decrease" | "neutral"
  category: "enrollment" | "academic" | "financial" | "attendance" | "staffing"
  icon: string
  description?: string
}

export interface DashboardWidget {
  id: string
  title: string
  type: "metric" | "chart" | "table" | "progress"
  data: any
  size: "small" | "medium" | "large"
  position: { x: number; y: number }
}

interface ReportsAnalyticsContextType {
  // Report Templates
  reportTemplates: ReportTemplate[]
  getReportTemplate: (id: string) => ReportTemplate | undefined
  getReportTemplatesByCategory: (category: string) => ReportTemplate[]

  // Generated Reports
  generatedReports: GeneratedReport[]
  generateReport: (
    templateId: string,
    parameters: Record<string, any>,
    format: string,
    title?: string,
    notes?: string,
  ) => Promise<string>
  getGeneratedReport: (id: string) => GeneratedReport | undefined
  deleteGeneratedReport: (id: string) => void
  downloadReport: (id: string) => void

  // Analytics
  analyticsMetrics: AnalyticsMetric[]
  getMetricsByCategory: (category: string) => AnalyticsMetric[]
  refreshAnalytics: () => Promise<void>

  // Dashboard
  dashboardWidgets: DashboardWidget[]
  updateDashboardLayout: (widgets: DashboardWidget[]) => void

  // Filters and Search
  searchReports: (query: string) => GeneratedReport[]
  filterReportsByStatus: (status: string) => GeneratedReport[]
  filterReportsByDateRange: (startDate: string, endDate: string) => GeneratedReport[]
}

const ReportsAnalyticsContext = createContext<ReportsAnalyticsContextType | undefined>(undefined)

// Mock data for report templates
const mockReportTemplates: ReportTemplate[] = [
  {
    id: "academic-performance",
    name: "Student Academic Performance Report",
    description: "Comprehensive academic performance analysis by class, term, and subject",
    category: "academic",
    parameters: [
      {
        id: "class",
        name: "class",
        label: "Class/Form",
        type: "select",
        required: true,
        options: [
          { value: "form1", label: "Form 1" },
          { value: "form2", label: "Form 2" },
          { value: "form3", label: "Form 3" },
          { value: "form4", label: "Form 4" },
          { value: "form5", label: "Form 5" },
          { value: "upper6", label: "Upper Sixth" },
          { value: "lower6", label: "Lower Sixth" },
        ],
      },
      {
        id: "term",
        name: "term",
        label: "Academic Term",
        type: "select",
        required: true,
        options: [
          { value: "first", label: "First Term" },
          { value: "second", label: "Second Term" },
          { value: "third", label: "Third Term" },
        ],
      },
      {
        id: "subsystem",
        name: "subsystem",
        label: "Sub-system",
        type: "select",
        required: false,
        options: [
          { value: "english", label: "English Sub-system" },
          { value: "french", label: "French Sub-system" },
        ],
      },
      {
        id: "includeGraphs",
        name: "includeGraphs",
        label: "Include Performance Graphs",
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    ],
    outputFormats: ["pdf", "excel"],
    estimatedTime: "2-3 minutes",
    usageCount: 45,
    lastUsed: "2024-01-15T10:30:00Z",
  },
  {
    id: "financial-summary",
    name: "Financial Collection Summary",
    description: "Detailed financial report showing fee collections, outstanding amounts, and payment trends",
    category: "financial",
    parameters: [
      {
        id: "dateRange",
        name: "dateRange",
        label: "Date Range",
        type: "select",
        required: true,
        options: [
          { value: "current-month", label: "Current Month" },
          { value: "current-term", label: "Current Term" },
          { value: "current-year", label: "Current Academic Year" },
          { value: "custom", label: "Custom Range" },
        ],
      },
      {
        id: "startDate",
        name: "startDate",
        label: "Start Date",
        type: "date",
        required: false,
      },
      {
        id: "endDate",
        name: "endDate",
        label: "End Date",
        type: "date",
        required: false,
      },
      {
        id: "classes",
        name: "classes",
        label: "Classes to Include",
        type: "multiselect",
        required: false,
        options: [
          { value: "form1", label: "Form 1" },
          { value: "form2", label: "Form 2" },
          { value: "form3", label: "Form 3" },
          { value: "form4", label: "Form 4" },
          { value: "form5", label: "Form 5" },
          { value: "upper6", label: "Upper Sixth" },
          { value: "lower6", label: "Lower Sixth" },
        ],
      },
    ],
    outputFormats: ["pdf", "excel", "csv"],
    estimatedTime: "1-2 minutes",
    usageCount: 32,
    lastUsed: "2024-01-14T14:20:00Z",
  },
  {
    id: "attendance-analysis",
    name: "Attendance Analysis Report",
    description: "Comprehensive attendance tracking and analysis by class, student, and time period",
    category: "attendance",
    parameters: [
      {
        id: "analysisType",
        name: "analysisType",
        label: "Analysis Type",
        type: "select",
        required: true,
        options: [
          { value: "class-summary", label: "Class Summary" },
          { value: "student-detail", label: "Individual Student Details" },
          { value: "trend-analysis", label: "Attendance Trends" },
        ],
      },
      {
        id: "period",
        name: "period",
        label: "Time Period",
        type: "select",
        required: true,
        options: [
          { value: "last-week", label: "Last Week" },
          { value: "last-month", label: "Last Month" },
          { value: "current-term", label: "Current Term" },
          { value: "academic-year", label: "Academic Year" },
        ],
      },
      {
        id: "minimumAttendance",
        name: "minimumAttendance",
        label: "Minimum Attendance Threshold (%)",
        type: "number",
        required: false,
        defaultValue: 75,
      },
    ],
    outputFormats: ["pdf", "excel"],
    estimatedTime: "2-4 minutes",
    usageCount: 28,
    lastUsed: "2024-01-13T09:15:00Z",
  },
  {
    id: "teacher-performance",
    name: "Teacher Performance Dashboard",
    description: "Teacher workload, performance metrics, and professional development tracking",
    category: "administrative",
    parameters: [
      {
        id: "department",
        name: "department",
        label: "Department",
        type: "select",
        required: false,
        options: [
          { value: "mathematics", label: "Mathematics" },
          { value: "sciences", label: "Sciences" },
          { value: "languages", label: "Languages" },
          { value: "social-studies", label: "Social Studies" },
          { value: "technical", label: "Technical Education" },
        ],
      },
      {
        id: "includeWorkload",
        name: "includeWorkload",
        label: "Include Workload Analysis",
        type: "boolean",
        required: false,
        defaultValue: true,
      },
      {
        id: "includeStudentFeedback",
        name: "includeStudentFeedback",
        label: "Include Student Feedback Scores",
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    ],
    outputFormats: ["pdf", "excel"],
    estimatedTime: "3-5 minutes",
    usageCount: 15,
    lastUsed: "2024-01-12T16:45:00Z",
  },
  {
    id: "examination-results",
    name: "Examination Results Analysis",
    description: "Detailed analysis of examination results with comparative performance metrics",
    category: "examination",
    parameters: [
      {
        id: "examType",
        name: "examType",
        label: "Examination Type",
        type: "select",
        required: true,
        options: [
          { value: "mock", label: "Mock Examinations" },
          { value: "gce-ol", label: "GCE Ordinary Level" },
          { value: "gce-al", label: "GCE Advanced Level" },
          { value: "bepc", label: "BEPC" },
          { value: "probatoire", label: "Probatoire" },
          { value: "baccalaureat", label: "Baccalauréat" },
        ],
      },
      {
        id: "academicYear",
        name: "academicYear",
        label: "Academic Year",
        type: "select",
        required: true,
        options: [
          { value: "2023-2024", label: "2023-2024" },
          { value: "2022-2023", label: "2022-2023" },
          { value: "2021-2022", label: "2021-2022" },
        ],
      },
      {
        id: "compareWithPrevious",
        name: "compareWithPrevious",
        label: "Compare with Previous Year",
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    ],
    outputFormats: ["pdf", "excel"],
    estimatedTime: "4-6 minutes",
    usageCount: 22,
    lastUsed: "2024-01-11T11:30:00Z",
  },
]

// Mock data for analytics metrics
const mockAnalyticsMetrics: AnalyticsMetric[] = [
  {
    id: "total-enrollment",
    name: "Total Enrollment",
    value: 1247,
    previousValue: 1115,
    change: "+11.8%",
    changeType: "increase",
    category: "enrollment",
    icon: "Users",
    description: "Total number of enrolled students across all classes",
  },
  {
    id: "average-performance",
    name: "Average Academic Performance",
    value: "78.5%",
    previousValue: "76.2%",
    change: "+2.3%",
    changeType: "increase",
    category: "academic",
    icon: "TrendingUp",
    description: "Overall academic performance across all subjects",
  },
  {
    id: "attendance-rate",
    name: "Overall Attendance Rate",
    value: "94.2%",
    previousValue: "92.1%",
    change: "+2.1%",
    changeType: "increase",
    category: "attendance",
    icon: "UserCheck",
    description: "Average attendance rate across all classes",
  },
  {
    id: "fee-collection",
    name: "Fee Collection Rate",
    value: "87.3%",
    previousValue: "82.1%",
    change: "+5.2%",
    changeType: "increase",
    category: "financial",
    icon: "DollarSign",
    description: "Percentage of fees collected for current term",
  },
  {
    id: "teacher-student-ratio",
    name: "Teacher-Student Ratio",
    value: "1:14",
    previousValue: "1:16",
    change: "Improved",
    changeType: "increase",
    category: "staffing",
    icon: "GraduationCap",
    description: "Average number of students per teacher",
  },
  {
    id: "pass-rate",
    name: "Examination Pass Rate",
    value: "92.7%",
    previousValue: "89.4%",
    change: "+3.3%",
    changeType: "increase",
    category: "academic",
    icon: "Award",
    description: "Overall pass rate for recent examinations",
  },
]

export function ReportsAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [reportTemplates] = useState<ReportTemplate[]>(mockReportTemplates)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [analyticsMetrics] = useState<AnalyticsMetric[]>(mockAnalyticsMetrics)
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([])

  const getReportTemplate = useCallback(
    (id: string) => {
      return reportTemplates.find((template) => template.id === id)
    },
    [reportTemplates],
  )

  const getReportTemplatesByCategory = useCallback(
    (category: string) => {
      return reportTemplates.filter((template) => template.category === category)
    },
    [reportTemplates],
  )

  const generateReport = useCallback(
    async (
      templateId: string,
      parameters: Record<string, any>,
      format: string,
      title?: string,
      notes?: string,
    ): Promise<string> => {
      const template = getReportTemplate(templateId)
      if (!template) {
        throw new Error("Template not found")
      }

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newReport: GeneratedReport = {
        id: reportId,
        templateId,
        templateName: template.name,
        title: title || `${template.name} - ${new Date().toLocaleDateString()}`,
        parameters,
        format: format as "pdf" | "excel" | "csv",
        status: "generating",
        generatedAt: new Date().toISOString(),
        generatedBy: "Current User", // This would come from auth context
        notes,
      }

      setGeneratedReports((prev) => [newReport, ...prev])

      // Simulate report generation
      setTimeout(
        () => {
          setGeneratedReports((prev) =>
            prev.map((report) =>
              report.id === reportId
                ? {
                    ...report,
                    status: "completed" as const,
                    fileSize: `${Math.floor(Math.random() * 5000) + 500}KB`,
                    downloadUrl: `/reports/${reportId}.${format}`,
                  }
                : report,
            ),
          )
        },
        2000 + Math.random() * 3000,
      ) // 2-5 seconds

      return reportId
    },
    [getReportTemplate],
  )

  const getGeneratedReport = useCallback(
    (id: string) => {
      return generatedReports.find((report) => report.id === id)
    },
    [generatedReports],
  )

  const deleteGeneratedReport = useCallback((id: string) => {
    setGeneratedReports((prev) => prev.filter((report) => report.id !== id))
  }, [])

  const downloadReport = useCallback(
    (id: string) => {
      const report = getGeneratedReport(id)
      if (report && report.downloadUrl) {
        // In a real app, this would trigger a file download
        console.log(`Downloading report: ${report.title}`)
        // window.open(report.downloadUrl, '_blank')
      }
    },
    [getGeneratedReport],
  )

  const getMetricsByCategory = useCallback(
    (category: string) => {
      return analyticsMetrics.filter((metric) => metric.category === category)
    },
    [analyticsMetrics],
  )

  const refreshAnalytics = useCallback(async () => {
    // In a real app, this would fetch fresh analytics data
    console.log("Refreshing analytics data...")
  }, [])

  const updateDashboardLayout = useCallback((widgets: DashboardWidget[]) => {
    setDashboardWidgets(widgets)
  }, [])

  const searchReports = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase()
      return generatedReports.filter(
        (report) =>
          report.title.toLowerCase().includes(lowercaseQuery) ||
          report.templateName.toLowerCase().includes(lowercaseQuery) ||
          report.notes?.toLowerCase().includes(lowercaseQuery),
      )
    },
    [generatedReports],
  )

  const filterReportsByStatus = useCallback(
    (status: string) => {
      return generatedReports.filter((report) => report.status === status)
    },
    [generatedReports],
  )

  const filterReportsByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      return generatedReports.filter((report) => {
        const reportDate = new Date(report.generatedAt)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return reportDate >= start && reportDate <= end
      })
    },
    [generatedReports],
  )

  const value: ReportsAnalyticsContextType = {
    reportTemplates,
    getReportTemplate,
    getReportTemplatesByCategory,
    generatedReports,
    generateReport,
    getGeneratedReport,
    deleteGeneratedReport,
    downloadReport,
    analyticsMetrics,
    getMetricsByCategory,
    refreshAnalytics,
    dashboardWidgets,
    updateDashboardLayout,
    searchReports,
    filterReportsByStatus,
    filterReportsByDateRange,
  }

  return <ReportsAnalyticsContext.Provider value={value}>{children}</ReportsAnalyticsContext.Provider>
}

export function useReportsAnalytics() {
  const context = useContext(ReportsAnalyticsContext)
  if (context === undefined) {
    throw new Error("useReportsAnalytics must be used within a ReportsAnalyticsProvider")
  }
  return context
}
