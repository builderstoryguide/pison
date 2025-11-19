"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAlerts } from "@/lib/alerts-context"
import { useToast } from "@/hooks/use-toast"
import { 
  Bell, 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Phone,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
  Loader2
} from "lucide-react"

// Type for lucide-react icon components
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

export function Alerts(): JSX.Element {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const {
    alerts,
    parentGroups,
    isLoading,
    error,
    fetchAlerts,
    fetchAlertHistory,
    sendAlert,
    scheduleAlert,
    deleteAlert,
    fetchParentGroups
  } = useAlerts()

  const [selectedTab, setSelectedTab] = useState("compose")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [alertType, setAlertType] = useState<"sms" | "email" | "both">("both")
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal")
  const [alertTitle, setAlertTitle] = useState("")
  const [alertContent, setAlertContent] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sending, setSending] = useState(false)

  // Load data on mount
  useEffect(() => {
    fetchAlerts()
    fetchParentGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mock data for templates (can be moved to database later)
  const parentGroupsList = parentGroups || []

  const alertTemplates = [
    {
      id: "meeting-reminder",
      title: "Parent-Teacher Meeting Reminder",
      content: "Dear Parent,\n\nThis is a reminder that our Parent-Teacher Meeting is scheduled for [DATE] at [TIME] in [LOCATION].\n\nPlease confirm your attendance by replying to this message.\n\nBest regards,\nSchool Administration",
      category: "meetings",
      icon: Calendar
    },
    {
      id: "exam-schedule",
      title: "Examination Schedule",
      content: "Dear Parent,\n\nPlease note that [EXAM_NAME] examinations will commence on [START_DATE] and end on [END_DATE].\n\nStudents should arrive 30 minutes before the scheduled time.\n\nBest regards,\nSchool Administration",
      category: "academic",
      icon: FileText
    },
    {
      id: "fee-reminder",
      title: "Fee Payment Reminder",
      content: "Dear Parent,\n\nThis is a friendly reminder that [FEE_TYPE] fees are due on [DUE_DATE].\n\nAmount: [AMOUNT]\n\nPlease ensure payment is made before the due date to avoid late fees.\n\nBest regards,\nSchool Administration",
      category: "financial",
      icon: AlertCircle
    },
    {
      id: "school-closure",
      title: "School Closure Notice",
      content: "Dear Parent,\n\nPlease be informed that the school will be closed on [DATE] due to [REASON].\n\nClasses will resume on [RESUME_DATE].\n\nBest regards,\nSchool Administration",
      category: "general",
      icon: Bell
    },
    {
      id: "event-invitation",
      title: "School Event Invitation",
      content: "Dear Parent,\n\nYou are cordially invited to [EVENT_NAME] on [DATE] at [TIME] in [LOCATION].\n\n[EVENT_DESCRIPTION]\n\nPlease RSVP by [RSVP_DATE].\n\nBest regards,\nSchool Administration",
      category: "events",
      icon: Calendar
    }
  ]

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSendAlert = async () => {
    if (!alertTitle.trim() || !alertContent.trim()) {
      toastError("Validation Error", {
        description: "Please fill in both title and content"
      })
      return
    }

    if (selectedGroups.length === 0) {
      toastError("Validation Error", {
        description: "Please select at least one parent group"
      })
      return
    }

    setSending(true)
    try {
      const scheduledAt = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null

      const result = await sendAlert({
        title: alertTitle,
        content: alertContent,
        alert_type: alertType,
        priority: priority,
        groupIds: selectedGroups,
        scheduled_at: scheduledAt
      })

      if (result.success) {
        toastSuccess("Success", {
          description: scheduledAt ? "Alert scheduled successfully" : "Alert sent successfully"
        })
        // Reset form
        setAlertTitle("")
        setAlertContent("")
        setSelectedGroups([])
        setScheduledDate("")
        setScheduledTime("")
        setSelectedTab("history")
        await fetchAlerts()
      } else {
        toastError("Error", {
          description: result.error || "Failed to send alert"
        })
      }
    } catch (err: any) {
      toastError("Error", {
        description: err.message || "Failed to send alert"
      })
    } finally {
      setSending(false)
    }
  }

  const handleUseTemplate = (template: { id: string; title: string; content: string; category: string; icon: any }) => {
    setAlertTitle(template.title)
    setAlertContent(template.content)
    setSelectedTemplate(template.id)
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return

    const result = await deleteAlert(alertId)
    if (result.success) {
      toastSuccess("Success", {
        description: "Alert deleted successfully"
      })
      await fetchAlerts()
    } else {
      toastError("Error", {
        description: result.error || "Failed to delete alert"
      })
    }
  }

  // Get alert history with stats
  const alertHistory = alerts.map(alert => {
    // In a real implementation, you'd fetch recipient stats from the database
    // For now, we'll use placeholder values
    return {
      ...alert,
      recipients: 0, // Would be calculated from alert_recipients
      delivered: 0,
      failed: 0
    }
  })

  // Filter alerts based on search and status
  const filteredAlerts = alertHistory.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getPriorityColor = (priority: string): string => {
    if (priority === "urgent") return "destructive"
    if (priority === "high") return "default"
    if (priority === "normal") return "secondary"
    if (priority === "low") return "outline"
    return "secondary"
  }

  const getTypeIcon = (type: string) => {
    if (type === "sms") return Phone
    if (type === "email") return Mail
    if (type === "both") return MessageSquare
    return Bell
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts & Communication</h1>
          <p className="text-muted-foreground">
            Send SMS and email alerts to parents about meetings, updates, and reminders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Alert
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parentGroupsList.find(g => g.id === 'all-parents')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered parents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Total alerts sent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending alerts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parent Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentGroupsList.length}</div>
            <p className="text-xs text-muted-foreground">
              Available groups
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose Alert</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="groups">Parent Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose New Alert</CardTitle>
                  <CardDescription>
                    Create and send alerts to parent groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert-title">Alert Title</Label>
                    <Input 
                      id="alert-title" 
                      placeholder="Enter alert title..."
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alert-content">Message Content</Label>
                    <Textarea 
                      id="alert-content"
                      placeholder="Enter your message..."
                      rows={6}
                      value={alertContent}
                      onChange={(e) => setAlertContent(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Alert Type</Label>
                      <Select value={alertType} onValueChange={(v) => setAlertType(v as typeof alertType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="both">SMS & Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-date">Schedule Date (Optional)</Label>
                      <Input 
                        id="scheduled-date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-time">Schedule Time (Optional)</Label>
                      <Input 
                        id="scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        disabled={!scheduledDate}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendAlert} 
                      className="flex-1"
                      disabled={sending || isLoading}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {scheduledDate && scheduledTime ? "Schedule Alert" : "Send Alert"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Parent Groups</CardTitle>
                  <CardDescription>
                    Choose which parent groups to send the alert to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {parentGroupsList.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <Label 
                          htmlFor={group.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{group.name}</span>
                            <Badge variant="outline">{group.count}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {group.description}
                          </p>
                        </Label>
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Templates</CardTitle>
                  <CardDescription>
                    Use pre-built templates for common messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alertTemplates.slice(0, 3).map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <template.icon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{template.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.category}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alertTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <template.icon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {template.content}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search alerts..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No alerts found
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const TypeIcon = getTypeIcon(alert.alert_type)
                return (
                  <Card key={alert.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant={getPriorityColor(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge variant="outline">
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {alert.alert_type}
                            </Badge>
                            <Badge variant="secondary">{alert.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {alert.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {alert.sent_at && (
                              <span>Sent: {new Date(alert.sent_at).toLocaleString()}</span>
                            )}
                            {alert.scheduled_at && (
                              <span>Scheduled: {new Date(alert.scheduled_at).toLocaleString()}</span>
                            )}
                            {!alert.sent_at && !alert.scheduled_at && (
                              <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setAlertTitle(alert.title)
                              setAlertContent(alert.content)
                              setSelectedTab("compose")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Parent Groups Management</h3>
              <p className="text-sm text-muted-foreground">
                Organize parents into groups for targeted communication
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-3 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              parentGroupsList.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="outline">{group.count} parents</Badge>
                  </div>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      View Members
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
