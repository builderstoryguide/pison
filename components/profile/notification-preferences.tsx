"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, Smartphone, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile, type ProfileData } from "@/lib/profile-context"

export function NotificationPreferences() {
  const { profile, updateNotificationPreferences, isLoading, error } = useProfile()
  const [preferences, setPreferences] = useState<ProfileData["preferences"]["notifications"]>({
    email: true,
    sms: false,
    push: true,
    grades: true,
    attendance: true,
    fees: true,
    announcements: true,
    messages: true,
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile?.preferences?.notifications) {
      setPreferences(profile.preferences.notifications)
    }
  }, [profile])

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
    setSuccess(false)
  }

  const handleSave = async () => {
    const success = await updateNotificationPreferences(preferences)
    if (success) {
      setHasChanges(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const notificationChannels = [
    {
      key: "email" as const,
      label: "Email Notifications",
      description: "Receive notifications via email",
      icon: Mail,
    },
    {
      key: "sms" as const,
      label: "SMS Notifications",
      description: "Receive notifications via text message",
      icon: MessageSquare,
    },
    {
      key: "push" as const,
      label: "Push Notifications",
      description: "Receive push notifications in your browser",
      icon: Smartphone,
    },
  ]

  const notificationTypes = [
    {
      key: "grades" as const,
      label: "Grades & Results",
      description: "New grades, exam results, and academic updates",
    },
    {
      key: "attendance" as const,
      label: "Attendance",
      description: "Attendance records and absence notifications",
    },
    {
      key: "fees" as const,
      label: "Fees & Payments",
      description: "Fee reminders, payment confirmations, and financial updates",
    },
    {
      key: "announcements" as const,
      label: "School Announcements",
      description: "Important school news and general announcements",
    },
    {
      key: "messages" as const,
      label: "Messages",
      description: "Direct messages from teachers, administrators, or parents",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose how and when you want to receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Channels</h3>
          <div className="space-y-4">
            {notificationChannels.map((channel) => (
              <div key={channel.key} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-3">
                  <channel.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor={channel.key} className="text-base">
                      {channel.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                </div>
                <Switch
                  id={channel.key}
                  checked={preferences[channel.key]}
                  onCheckedChange={(checked) => handlePreferenceChange(channel.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor={type.key} className="text-base">
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Switch
                  id={type.key}
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Save className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Notification preferences saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || isLoading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allOn = { ...preferences }
              Object.keys(allOn).forEach((key) => {
                allOn[key as keyof typeof allOn] = true
              })
              setPreferences(allOn)
              setHasChanges(true)
            }}
          >
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allOff = { ...preferences }
              Object.keys(allOff).forEach((key) => {
                allOff[key as keyof typeof allOff] = false
              })
              setPreferences(allOff)
              setHasChanges(true)
            }}
          >
            Disable All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
