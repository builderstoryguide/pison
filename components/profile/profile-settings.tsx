"use client"

import { useState } from "react"
import { User, Settings, Bell, Lock, Globe, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { AvatarUpload } from "./avatar-upload"
import { PasswordChange } from "./password-change"
import { NotificationPreferences } from "./notification-preferences"
import { useProfile, type ProfileData } from "@/lib/profile-context"

export function ProfileSettings() {
  const { profile, updateProfile, isLoading, error } = useProfile()
  const [formData, setFormData] = useState<Partial<ProfileData>>(profile || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!profile) {
    return <div>Loading profile...</div>
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    // Special handling for phone numbers
    if (field === 'phone') {
      let formattedPhone = value
      if (!formattedPhone.startsWith('+237 6')) {
        formattedPhone = '+237 6'
      }
      formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
      value = formattedPhone
    }
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
    setSuccess(false)
  }

  const handleNestedChange = (parent: keyof ProfileData, field: string, value: any) => {
    // Special handling for emergency contact phone
    if (parent === 'emergencyContact' && field === 'phone') {
      let formattedPhone = value
      if (!formattedPhone.startsWith('+237 6')) {
        formattedPhone = '+237 6'
      }
      formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
      value = formattedPhone
    }
    
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }))
    setHasChanges(true)
    setSuccess(false)
  }

  const handleSave = async () => {
    const success = await updateProfile(formData)
    if (success) {
      setHasChanges(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const getRoleSpecificFields = () => {
    switch (profile.role) {
      case "student":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.studentId || ""}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  value={formData.class || ""}
                  onChange={(e) => handleInputChange("class", e.target.value)}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData.branch || ""}
                onValueChange={(value) => handleInputChange("branch", value)}
                disabled
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "teacher":
        return (
          <div className="space-y-2">
            <Label htmlFor="teacherRegNo">Teacher Registration Number</Label>
            <Input
              id="teacherRegNo"
              value={formData.teacherRegNo || ""}
              onChange={(e) => handleInputChange("teacherRegNo", e.target.value)}
              disabled
            />
          </div>
        )
      case "bursar":
        return (
          <div className="space-y-2">
            <Label htmlFor="bursarId">Bursar ID</Label>
            <Input
              id="bursarId"
              value={formData.bursarId || "BUR2024001"}
              onChange={(e) => handleInputChange("bursarId", e.target.value)}
              disabled
            />
          </div>
        )
      case "parent":
        return (
          <div className="space-y-2">
            <Label htmlFor="parentCode">Parent Access Code</Label>
            <Input
              id="parentCode"
              value={formData.parentCode || ""}
              onChange={(e) => handleInputChange("parentCode", e.target.value)}
              disabled
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {profile.role}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile photo</CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentAvatar={formData.avatar}
                  userName={formData.name || ""}
                  onAvatarChange={(url) => handleInputChange("avatar", url)}
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender || ""} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Role-specific fields */}
                {getRoleSpecificFields()}

                {/* Educational Sub-system */}
                {(profile.role === "student" || profile.role === "teacher") && (
                  <div className="space-y-2">
                    <Label htmlFor="subsystem">Educational Sub-system</Label>
                    <Select
                      value={formData.subsystem || ""}
                      onValueChange={(value) => handleInputChange("subsystem", value)}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English Sub-system</SelectItem>
                        <SelectItem value="french">French Sub-system</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact?.name || ""}
                    onChange={(e) => handleNestedChange("emergencyContact", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={(e) => handleNestedChange("emergencyContact", "phone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Select
                    value={formData.emergencyContact?.relationship || ""}
                    onValueChange={(value) => handleNestedChange("emergencyContact", "relationship", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Connect your social media profiles (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    type="url"
                    placeholder="https://facebook.com/username"
                    value={formData.socialMedia?.facebook || ""}
                    onChange={(e) => handleNestedChange("socialMedia", "facebook", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    type="url"
                    placeholder="https://twitter.com/username"
                    value={formData.socialMedia?.twitter || ""}
                    onChange={(e) => handleNestedChange("socialMedia", "twitter", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.socialMedia?.linkedin || ""}
                    onChange={(e) => handleNestedChange("socialMedia", "linkedin", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!hasChanges || isLoading} size="lg">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <PasswordChange />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your language and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={formData.preferences?.language || "en"}
                    onValueChange={(value) => handleNestedChange("preferences", "language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.preferences?.timezone || "Africa/Douala"}
                    onValueChange={(value) => handleNestedChange("preferences", "timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Douala">West Africa Time (WAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.preferences?.theme || "light"}
                  onValueChange={(value) => handleNestedChange("preferences", "theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!hasChanges || isLoading} size="lg">
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
