"use client"

import React, { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Settings,
  Upload,
  Save,
  RotateCcw,
  Image,
  Palette,
  Globe,
  Calendar,
  Clock,
  Building,
  Phone,
  Mail,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"
import { useAppConfiguration, type AppConfiguration } from "@/lib/app-configuration-context-v2"

// Form validation schema
const configurationSchema = z.object({
  school_name: z.string().min(1, "School name is required").max(255, "School name is too long"),
  school_logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  school_logo_alt_text: z.string().max(255, "Alt text is too long").optional(),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email("Invalid email").optional().or(z.literal("")),
  school_website: z.string().url("Invalid URL").optional().or(z.literal("")),
  school_motto: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  academic_year: z.string().min(1, "Academic year is required"),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  date_format: z.string().min(1, "Date format is required"),
  time_format: z.string().min(1, "Time format is required"),
})

type ConfigurationFormData = z.infer<typeof configurationSchema>

export function AppConfiguration() {
  const { configuration, isLoading, error, updateConfiguration, resetConfiguration, uploadLogo } = useAppConfiguration()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      school_name: configuration?.school_name || "",
      school_logo_url: configuration?.school_logo_url || "",
      school_logo_alt_text: configuration?.school_logo_alt_text || "",
      school_address: configuration?.school_address || "",
      school_phone: configuration?.school_phone || "",
      school_email: configuration?.school_email || "",
      school_website: configuration?.school_website || "",
      school_motto: configuration?.school_motto || "",
      primary_color: configuration?.primary_color || "#1f2937",
      secondary_color: configuration?.secondary_color || "#3b82f6",
      academic_year: configuration?.academic_year || "2024-2025",
      currency: configuration?.currency || "XOF",
      timezone: configuration?.timezone || "Africa/Douala",
      language: configuration?.language || "en",
      date_format: configuration?.date_format || "DD/MM/YYYY",
      time_format: configuration?.time_format || "24h",
    },
  })

  // Update form when configuration changes
  React.useEffect(() => {
    if (configuration) {
      form.reset({
        school_name: configuration.school_name,
        school_logo_url: configuration.school_logo_url || "",
        school_logo_alt_text: configuration.school_logo_alt_text || "",
        school_address: configuration.school_address || "",
        school_phone: configuration.school_phone || "",
        school_email: configuration.school_email || "",
        school_website: configuration.school_website || "",
        school_motto: configuration.school_motto || "",
        primary_color: configuration.primary_color,
        secondary_color: configuration.secondary_color,
        academic_year: configuration.academic_year,
        currency: configuration.currency,
        timezone: configuration.timezone,
        language: configuration.language,
        date_format: configuration.date_format,
        time_format: configuration.time_format,
      })
    }
  }, [configuration, form])

  const onSubmit = async (data: ConfigurationFormData) => {
    setIsSaving(true)
    try {
      const success = await updateConfiguration(data)
      if (success) {
        toast.success("Configuration Updated", {
          description: "App configuration has been updated successfully."
        })
      } else {
        toast.error("Update Failed", {
          description: "Failed to update configuration. Please try again."
        })
      }
    } catch (error) {
      toast.error("Update Failed", {
        description: "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const success = await resetConfiguration()
      if (success) {
        toast.success("Configuration Reset", {
          description: "Configuration has been reset to defaults."
        })
      } else {
        toast.error("Reset Failed", {
          description: "Failed to reset configuration. Please try again."
        })
      }
    } catch (error) {
      toast.error("Reset Failed", {
        description: "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const logoUrl = await uploadLogo(file)
      if (logoUrl) {
        form.setValue("school_logo_url", logoUrl)
        toast.success("Logo Uploaded", {
          description: "School logo has been uploaded successfully."
        })
      } else {
        toast.error("Upload Failed", {
          description: "Failed to upload logo. Please try again."
        })
      }
    } catch (error) {
      toast.error("Upload Failed", {
        description: "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">App Configuration</h1>
          <p className="text-muted-foreground">
            Configure school branding, settings, and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isResetting}>
                {isResetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset to Defaults
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Configuration</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reset all configuration to default values? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription>
                Basic information about your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="school_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter school name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="school_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+237 123 456 789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="school_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="info@school.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="school_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter school address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school_website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://school.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school_motto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Motto</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter school motto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Logo Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                School Logo
              </CardTitle>
              <CardDescription>
                Upload and configure your school logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={form.watch("school_logo_url") || "/placeholder-logo.svg"}
                    alt={form.watch("school_logo_alt_text") || "School Logo"}
                    className="h-16 w-16 object-contain border rounded-lg"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Recommended: 200x200px, PNG or SVG format
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="school_logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      Direct URL to the logo image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school_logo_alt_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Text</FormLabel>
                    <FormControl>
                      <Input placeholder="School Logo" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alternative text for accessibility
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Theme Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Colors
              </CardTitle>
              <CardDescription>
                Customize the application color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            {...field}
                          />
                          <Input placeholder="#1f2937" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            {...field}
                          />
                          <Input placeholder="#3b82f6" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Academic Year *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="2024-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="XOF">XOF - West African CFA Franc</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="XAF">XAF - Central African CFA Franc</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Timezone *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Africa/Douala">Africa/Douala</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                          <SelectItem value="Africa/Abidjan">Africa/Abidjan</SelectItem>
                          <SelectItem value="Africa/Accra">Africa/Accra</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time Format *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="24h">24 Hour (14:30)</SelectItem>
                          <SelectItem value="12h">12 Hour (2:30 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How your configuration will appear to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={form.watch("school_logo_url") || "/placeholder-logo.svg"}
                      alt={form.watch("school_logo_alt_text") || "School Logo"}
                      className="h-8 w-8 object-contain"
                    />
                    <div>
                      <h3 className="font-semibold">{form.watch("school_name")}</h3>
                      <p className="text-sm text-muted-foreground">Admin Portal</p>
                    </div>
                  </div>
                  {form.watch("school_motto") && (
                    <p className="text-sm italic text-muted-foreground mb-2">
                      "{form.watch("school_motto")}"
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {form.watch("school_phone") && (
                      <span>📞 {form.watch("school_phone")}</span>
                    )}
                    {form.watch("school_email") && (
                      <span>✉️ {form.watch("school_email")}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
