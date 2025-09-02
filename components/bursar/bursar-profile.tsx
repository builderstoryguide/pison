"use client"

import { useState } from "react"
import { User, Settings, Bell, Lock, Globe, Palette, DollarSign, CreditCard, FileText, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

import { AvatarUpload } from "../profile/avatar-upload"
import { PasswordChange } from "../profile/password-change"
import { NotificationPreferences } from "../profile/notification-preferences"
import { useProfile, type ProfileData } from "@/lib/profile-context"

export function BursarProfile() {
  const { profile, updateProfile, isLoading, error } = useProfile()
  const [formData, setFormData] = useState<Partial<ProfileData>>(profile || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!profile || profile.role !== "bursar") {
    return <div>Access denied. This profile is only for bursars.</div>
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
    setSuccess(false)
  }

  const handleNestedChange = (parent: keyof ProfileData, field: string, value: any) => {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bursar Profile Management</h1>
          <p className="text-muted-foreground">Manage your bursar account settings and financial preferences</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {profile.role}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
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
                    placeholder="Tell us about yourself and your financial management experience..."
                  />
                </div>

                {/* Bursar-specific fields */}
                <div className="space-y-2">
                  <Label htmlFor="bursarId">Bursar ID</Label>
                  <Input
                    id="bursarId"
                    value={formData.bursarId || ""}
                    onChange={(e) => handleInputChange("bursarId", e.target.value)}
                    disabled
                  />
                </div>
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

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Management Preferences
              </CardTitle>
              <CardDescription>Configure your financial management settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Currency & Formatting</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value="XOF" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">West African CFA Franc (XOF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimalPlaces">Decimal Places</Label>
                    <Select value="2" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 (Whole numbers)</SelectItem>
                        <SelectItem value="2">2 (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Processing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Processing</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-generate receipts</Label>
                      <p className="text-sm text-muted-foreground">Automatically generate receipts for all payments</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Send payment confirmations</Label>
                      <p className="text-sm text-muted-foreground">Send email confirmations for payments</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require approval for large payments</Label>
                      <p className="text-sm text-muted-foreground">Require admin approval for payments above threshold</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reporting Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reporting & Analytics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily financial summaries</Label>
                      <p className="text-sm text-muted-foreground">Receive daily summaries of financial activities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly collection reports</Label>
                      <p className="text-sm text-muted-foreground">Generate weekly fee collection reports</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monthly financial statements</Label>
                      <p className="text-sm text-muted-foreground">Generate comprehensive monthly statements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-factor authentication for payments</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for financial transactions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audit trail logging</Label>
                      <p className="text-sm text-muted-foreground">Log all financial transactions for audit</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!hasChanges || isLoading} size="lg">
              {isLoading ? "Saving..." : "Save Financial Settings"}
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
