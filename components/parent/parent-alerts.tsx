"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlerts } from "@/lib/alerts-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react"

export function ParentAlerts() {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const { fetchParentAlerts, markAlertAsRead, isLoading } = useAlerts()
  
  const [alerts, setAlerts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (user?.id) {
      loadAlerts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadAlerts = async () => {
    if (!user?.id || !user?.parentCode) return
    
    try {
      // Get parent ID from parent_code
      // First, we need to find the parent record using the parent_code
      const { supabase } = await import("@/lib/supabase")
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('parent_code', user.parentCode)
        .single()

      if (parentError || !parentData) {
        toast({
          title: "Error",
          description: "Parent record not found",
          variant: "destructive"
        })
        return
      }

      const parentAlerts = await fetchParentAlerts(parentData.id)
      setAlerts(parentAlerts)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load alerts",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsRead = async (recipientId: string) => {
    const result = await markAlertAsRead(recipientId)
    if (result.success) {
      await loadAlerts()
      toast({
        title: "Success",
        description: "Alert marked as read"
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to mark alert as read",
        variant: "destructive"
      })
    }
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

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600"
      case "sent": return "text-blue-600"
      case "failed": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  // Filter alerts
  const filteredAlerts = alerts.filter((alert: any) => {
    const alertData = alert.alerts || {}
    const matchesSearch = !searchQuery || 
      alertData.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alertData.content?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === "all" || alertData.priority === priorityFilter
    const matchesType = typeFilter === "all" || alert.delivery_method === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" && alert.read_at) ||
      (statusFilter === "unread" && !alert.read_at)
    return matchesSearch && matchesPriority && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            View alerts and messages from the school
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm">You don't have any alerts matching your filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => {
            const alertData = alert.alerts || {}
            const TypeIcon = getTypeIcon(alert.delivery_method)
            const isRead = !!alert.read_at

            return (
              <Card key={alert.id} className={!isRead ? "border-primary" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className={`font-semibold ${!isRead ? "text-primary" : ""}`}>
                          {alertData.title || "No Title"}
                        </h3>
                        {!isRead && (
                          <Badge variant="default" className="ml-2">New</Badge>
                        )}
                        <Badge variant={getPriorityColor(alertData.priority)}>
                          {alertData.priority}
                        </Badge>
                        <Badge variant="outline">
                          {alert.delivery_method}
                        </Badge>
                        <Badge variant="secondary" className={getDeliveryStatusColor(alert.delivery_status)}>
                          {alert.delivery_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {alertData.content || "No content"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {alert.delivered_at && (
                          <span>Delivered: {new Date(alert.delivered_at).toLocaleString()}</span>
                        )}
                        {alert.read_at && (
                          <span className="text-green-600">
                            Read: {new Date(alert.read_at).toLocaleString()}
                          </span>
                        )}
                        {alert.students && (
                          <span>
                            Student: {alert.students.first_name} {alert.students.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

