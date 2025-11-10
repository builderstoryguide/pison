"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
  Filter,
  Search
} from "lucide-react"

export function Alerts() {
  const [selectedTab, setSelectedTab] = useState("compose")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [alertType, setAlertType] = useState("both") // sms, email, both
  const [priority, setPriority] = useState("normal") // low, normal, high, urgent

  // Mock data for demonstration
  const parentGroups = [
    { id: "all-parents", name: "All Parents", count: 450, description: "All registered parents" },
    { id: "grade-1", name: "Grade 1 Parents", count: 35, description: "Parents of Grade 1 students" },
    { id: "grade-2", name: "Grade 2 Parents", count: 38, description: "Parents of Grade 2 students" },
    { id: "grade-3", name: "Grade 3 Parents", count: 42, description: "Parents of Grade 3 students" },
    { id: "grade-4", name: "Grade 4 Parents", count: 40, description: "Parents of Grade 4 students" },
    { id: "grade-5", name: "Grade 5 Parents", count: 45, description: "Parents of Grade 5 students" },
    { id: "grade-6", name: "Grade 6 Parents", count: 48, description: "Parents of Grade 6 students" },
    { id: "grade-7", name: "Grade 7 Parents", count: 52, description: "Parents of Grade 7 students" },
    { id: "grade-8", name: "Grade 8 Parents", count: 50, description: "Parents of Grade 8 students" },
    { id: "grade-9", name: "Grade 9 Parents", count: 55, description: "Parents of Grade 9 students" },
    { id: "grade-10", name: "Grade 10 Parents", count: 58, description: "Parents of Grade 10 students" },
    { id: "grade-11", name: "Grade 11 Parents", count: 60, description: "Parents of Grade 11 students" },
    { id: "grade-12", name: "Grade 12 Parents", count: 62, description: "Parents of Grade 12 students" },
    { id: "pta-members", name: "PTA Members", count: 25, description: "Active PTA members" },
    { id: "fee-defaulters", name: "Fee Defaulters", count: 15, description: "Parents with outstanding fees" }
  ]

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

  const recentAlerts = [
    {
      id: 1,
      title: "Parent-Teacher Meeting Reminder",
      content: "Meeting scheduled for tomorrow at 2:00 PM",
      type: "both",
      priority: "high",
      groups: ["all-parents"],
      sentAt: "2024-01-15T10:30:00Z",
      status: "sent",
      recipients: 450,
      delivered: 445,
      failed: 5
    },
    {
      id: 2,
      title: "Examination Schedule Update",
      content: "Mid-term exams start next week",
      type: "email",
      priority: "normal",
      groups: ["grade-10", "grade-11", "grade-12"],
      sentAt: "2024-01-14T14:20:00Z",
      status: "sent",
      recipients: 175,
      delivered: 175,
      failed: 0
    },
    {
      id: 3,
      title: "Fee Payment Reminder",
      content: "Quarterly fees due next Friday",
      type: "sms",
      priority: "urgent",
      groups: ["fee-defaulters"],
      sentAt: "2024-01-13T09:15:00Z",
      status: "sent",
      recipients: 15,
      delivered: 12,
      failed: 3
    }
  ]

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSendAlert = () => {
    console.log("Sending alert:", {
      template: selectedTemplate,
      groups: selectedGroups,
      type: alertType,
      priority
    })
    // TODO: Implement actual alert sending logic
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive"
      case "high": return "default"
      case "normal": return "secondary"
      case "low": return "outline"
      default: return "secondary"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sms": return Phone
      case "email": return Mail
      case "both": return MessageSquare
      default: return Bell
    }
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

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +5 from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for later
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alert-content">Message Content</Label>
                    <Textarea 
                      id="alert-content"
                      placeholder="Enter your message..."
                      rows={6}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Alert Type</Label>
                      <Select value={alertType} onValueChange={setAlertType}>
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
                      <Select value={priority} onValueChange={setPriority}>
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

                  <div className="flex gap-2">
                    <Button onClick={handleSendAlert} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Send Alert
                    </Button>
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parentGroups.map((group) => (
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
                        onClick={() => setSelectedTemplate(template.id)}
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
                    <Button size="sm" className="flex-1">
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
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {recentAlerts.map((alert) => {
              const TypeIcon = getTypeIcon(alert.type)
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
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {alert.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Sent: {new Date(alert.sentAt).toLocaleString()}</span>
                          <span>Recipients: {alert.recipients}</span>
                          <span className="text-green-600">Delivered: {alert.delivered}</span>
                          {alert.failed > 0 && (
                            <span className="text-red-600">Failed: {alert.failed}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
            {parentGroups.map((group) => (
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
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
