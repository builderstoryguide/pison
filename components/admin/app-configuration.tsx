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
  Loader2,
  Eye,
  EyeOff,
  ListOrdered,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { useAppConfiguration } from "@/lib/app-configuration-context-v2"
import { useSequenceConfiguration, useUpdateSequenceConfiguration, useReassignSequence, type SequenceAssignment } from "@/hooks/use-sequence-configuration"

// Form validation schema
const configurationSchema = z.object({
  school_name: z.string().min(1, "School name is required").max(255, "School name is too long"),
  school_logo_url: z.union([
    z.literal(""),
    z.string().url("Invalid URL")
  ]).optional(),
  school_logo_alt_text: z.union([
    z.literal(""),
    z.string().max(255, "Alt text is too long")
  ]).optional(),
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

// Helper function to generate academic year options
function getAcademicYearOptions() {
  const currentYear = new Date().getFullYear()
  
  // Academic year format: YYYY-YYYY+1
  // Example: If current year is 2025, current academic year is 2025-2026
  const previousYear = `${currentYear - 1}-${currentYear}`
  const currentYearOption = `${currentYear}-${currentYear + 1}`
  const nextYear = `${currentYear + 1}-${currentYear + 2}`
  
  return {
    previous: previousYear,
    current: currentYearOption,
    next: nextYear
  }
}

export function AppConfiguration() {
  const { configuration, isLoading, error, updateConfiguration, resetConfiguration, uploadLogo } = useAppConfiguration()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get academic year options
  const academicYearOptions = React.useMemo(() => getAcademicYearOptions(), [])

  // Get academic year from System Settings
  const currentAcademicYear = configuration?.academic_year || academicYearOptions.current

  // Sequence configuration state
  const [numberOfSequences, setNumberOfSequences] = useState<number>(6)
  const [defaultMaxMarks, setDefaultMaxMarks] = useState<number>(20)
  const [sequenceAssignments, setSequenceAssignments] = useState<SequenceAssignment[]>([])

  // Fetch sequence configuration (per academic year) - uses academic year from System Settings
  const { data: seqConfigData, isLoading: loadingSeqConfig } = useSequenceConfiguration(
    currentAcademicYear
  )
  const updateSequenceConfig = useUpdateSequenceConfiguration()
  const reassignSequence = useReassignSequence()

  // Track if we've initialized from loaded data to prevent unnecessary resets during refetches
  const lastLoadedDataKey = useRef<string>('')
  const lastAcademicYear = useRef<string>('')
  const hasLoadedOnce = useRef<boolean>(false)

    // Simplified state synchronization
    React.useEffect(() => {
      // Skip if still loading configuration - wait for it to load to get correct academic year
      if (isLoading) return
      
      // Skip if loading sequence config or no data
      if (loadingSeqConfig || !seqConfigData) return

      // If we have sequences, update state
      if (seqConfigData.sequences && seqConfigData.sequences.length > 0) {
        const activeSequences = seqConfigData.sequences.filter(seq => seq.is_active)
        
        // Calculate data key to prevent unnecessary updates/loops
        const dataKey = JSON.stringify(
          activeSequences.map(seq => ({ num: seq.sequence_number, term: seq.term })).sort((a, b) => a.num - b.num)
        )

        // Only update if data is different from what we last loaded
        if (dataKey !== lastLoadedDataKey.current) {
          setNumberOfSequences(activeSequences.length || 6)
          
          if (seqConfigData.configuration) {
            setDefaultMaxMarks(seqConfigData.configuration.default_max_marks || 20)
          } else if (activeSequences.length > 0) {
            setDefaultMaxMarks(activeSequences[0].max_marks || 20)
          }
          
          const assignments: SequenceAssignment[] = activeSequences.map(seq => ({
            sequenceNumber: seq.sequence_number,
            term: seq.term
          }))
          setSequenceAssignments(assignments)
          
          lastLoadedDataKey.current = dataKey
          lastAcademicYear.current = currentAcademicYear
          hasLoadedOnce.current = true
        }
      } else if (!loadingSeqConfig && (!seqConfigData.sequences || seqConfigData.sequences.length === 0)) {
        // Only reset to defaults if:
        // 1. Configuration has actually loaded (has ID or is not default) - not just using fallback
        // 2. We've loaded at least once (to avoid resetting on initial load with wrong academic year)
        // 3. The academic year has actually changed
        const configHasLoaded = configuration && (configuration.id || configuration.school_name !== 'Pison Academy')
        
        // Don't reset if configuration hasn't loaded yet - wait for real config to load
        if (!configHasLoaded && !hasLoadedOnce.current) {
          return // Wait for configuration to load before making decisions
        }
        
        // Only reset if academic year changed and we've loaded at least once
        if (lastAcademicYear.current !== currentAcademicYear && hasLoadedOnce.current) {
          setNumberOfSequences(6)
          setDefaultMaxMarks(20)
          setSequenceAssignments([])
          lastAcademicYear.current = currentAcademicYear
          lastLoadedDataKey.current = ''
        } else if (!hasLoadedOnce.current && lastAcademicYear.current !== currentAcademicYear) {
          // First load with this academic year - mark it but don't reset yet
          lastAcademicYear.current = currentAcademicYear
        }
      }
    }, [seqConfigData, loadingSeqConfig, currentAcademicYear, isLoading, configuration])

  // Handle sequence reassignment (optimistic update)
  const handleReassignSequence = (sequenceNumber: number, newTerm: string) => {

    
    // Validate that term is not empty
    if (!newTerm || newTerm.trim() === '') {

      toast.error("Reassignment Failed", {
        description: "Please select a valid term for the sequence."
      })
      return
    }
    
    // Validate that configuration is loaded and we have a valid academic year
    if (isLoading) {
      toast.error("Reassignment Failed", {
        description: "Please wait for configuration to load before reassigning sequences."
      })
      return
    }
    
    // Validate that we have a valid academic year
    const academicYearToUse = configuration?.academic_year || currentAcademicYear
    if (!academicYearToUse || academicYearToUse.trim() === '') {

      toast.error("Reassignment Failed", {
        description: "Academic year is not available. Please wait for configuration to load or select an academic year."
      })
      return
    }
    
    // Update local state immediately for better UX
    setSequenceAssignments(prev => 
      prev.map(assignment => 
        assignment.sequenceNumber === sequenceNumber
          ? { ...assignment, term: newTerm }
          : assignment
      )
    )
    

    
    // Then update on server
    reassignSequence.mutate({
      academicYear: academicYearToUse,
      sequenceNumber,
      term: newTerm
    }, {
      onSuccess: () => {
        toast.success("Sequence Reassigned", {
          description: `Sequence ${sequenceNumber} moved to ${newTerm}`
        })
      },
      onError: (error) => {

        // Revert on error
        // Update local state immediately for better UX
        const previousAssignments = [...sequenceAssignments]
        setSequenceAssignments(prev => 
          prev.map(assignment => 
            assignment.sequenceNumber === sequenceNumber
              ? { ...assignment, term: newTerm }
              : assignment
          )
        )
        
        
        
        // Then update on server
        reassignSequence.mutate({
          academicYear: academicYearToUse,
          sequenceNumber,
          term: newTerm
        }, {
          onSuccess: () => {
            toast.success("Sequence Reassigned", {
              description: `Sequence ${sequenceNumber} moved to ${newTerm}`
            })
          },
          onError: (error) => {
            // Revert on error
            setSequenceAssignments(previousAssignments)
            toast.error("Reassignment Failed", {
              description: error instanceof Error ? error.message : "Failed to reassign sequence"
            })
          }
        })
        toast.error("Reassignment Failed", {
          description: error instanceof Error ? error.message : "Failed to reassign sequence"
        })
      }
    })
  }

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
      academic_year: configuration?.academic_year || academicYearOptions.current,
      currency: configuration?.currency || "XOF",
      timezone: configuration?.timezone || "Africa/Douala",
      language: configuration?.language || "en",
      date_format: configuration?.date_format || "DD/MM/YYYY",
      time_format: configuration?.time_format || "24h",
    },
  })

  // Update form when configuration changes - only when not loading and configuration has actual data
  React.useEffect(() => {

    // Only update form if configuration is loaded (not loading) and has actual data (not just defaults)
    // Check if configuration has an ID or if school_name is not the default to ensure we have real data
    if (!isLoading && configuration && (configuration.id || configuration.school_name !== 'Pison Academy')) {

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
        academic_year: configuration.academic_year || academicYearOptions.current,
        currency: configuration.currency,
        timezone: configuration.timezone,
        language: configuration.language,
        date_format: configuration.date_format,
        time_format: configuration.time_format,
      }, {
        keepDirty: false, // Reset dirty state to allow form to recognize the new values
        keepErrors: false, // Clear any errors
      })
    }
  }, [configuration, isLoading, form, academicYearOptions])

  const onSubmit = async (data: ConfigurationFormData) => {
    setIsSaving(true)
    try {
      // Save the main app configuration
      const success = await updateConfiguration(data)
      
      if (success) {
        // Also save sequence configuration if sequences are configured
        try {
          const sequenceResult = await updateSequenceConfig.mutateAsync({
            academicYear: data.academic_year || currentAcademicYear,
            numberOfSequences,
            defaultMaxMarks,
            sequenceAssignments: sequenceAssignments.length > 0 
              ? sequenceAssignments 
              : undefined, // Auto-distribute if not provided
          })

          if (sequenceResult.success) {
            
            // Update local state immediately from the mutation result
            // This ensures the UI reflects the saved state without waiting for a refetch
            if (sequenceResult.sequences && sequenceResult.sequences.length > 0) {
              const activeSequences = sequenceResult.sequences.filter(seq => seq.is_active)
              
              // Update sequence assignments from the saved result
              const savedAssignments: SequenceAssignment[] = activeSequences.map(seq => ({
                sequenceNumber: seq.sequence_number,
                term: seq.term
              }))
              setSequenceAssignments(savedAssignments)
              
              // Update other state if needed
              if (activeSequences.length !== numberOfSequences) {
                setNumberOfSequences(activeSequences.length)
              }
              
              // Update the tracking refs to match the saved data
              const dataKey = JSON.stringify(
                savedAssignments.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
              )
              lastLoadedDataKey.current = dataKey
              lastAcademicYear.current = data.academic_year || currentAcademicYear
            }
          }
        } catch (seqError) {
          // Log sequence save error but don't fail the entire save operation

          toast.error("Sequence Configuration Error", {
            description: seqError instanceof Error ? seqError.message : "Failed to save sequence configuration",
          })
        }

        toast.success("Configuration Updated", {
          description: "App configuration has been updated successfully."
        })
      } else {
        // Use the error from context if available, otherwise show generic message
        const errorMessage = error || "Failed to update configuration. Please try again."
        toast.error("Update Failed", {
          description: errorMessage
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (error || "An unexpected error occurred. Please try again.")
      toast.error("Update Failed", {
        description: errorMessage
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
    } catch (_error) {
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

    // Client-side file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid File Type", {
        description: `Only JPEG, PNG, SVG, and WebP images are allowed. You selected: ${file.type || 'unknown type'}`
      })
      // Reset file input
      event.target.value = ''
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      toast.error("File Too Large", {
        description: `File size (${fileSizeMB}MB) exceeds the maximum limit of 5MB. Please select a smaller file.`
      })
      // Reset file input
      event.target.value = ''
      return
    }

    setIsUploading(true)
    setUploadingFileName(file.name)
    try {
      const result = await uploadLogo(file)
      if (result.success && result.logoUrl) {
        form.setValue("school_logo_url", result.logoUrl)
        toast.success("Logo Uploaded", {
          description: "School logo has been uploaded successfully."
        })
        setUploadingFileName(null)
      } else {
        // Show specific error message from API
        const errorMessage = result.error || "Failed to upload logo. Please try again."
        let errorDescription = errorMessage

        // Provide helpful descriptions based on error code
        if (result.errorCode === 'BUCKET_NOT_FOUND') {
          errorDescription = "Storage bucket not configured. Please contact your administrator to run the setup script."
        } else if (result.errorCode === 'STORAGE_PERMISSION_ERROR') {
          errorDescription = "Permission denied. Please check that storage policies are configured correctly."
        } else if (result.errorCode === 'FILE_SIZE_LIMIT_EXCEEDED') {
          errorDescription = "File size exceeds storage limit. Please select a smaller file."
        } else if (result.errorCode === 'NETWORK_ERROR') {
          errorDescription = "Network error occurred. Please check your connection and try again."
        } else if (result.errorCode === 'OFFLINE_ERROR') {
          errorDescription = "Cannot upload while offline. Please check your internet connection."
        } else if (result.errorDetails?.setupInstructions) {
          errorDescription = result.errorDetails.setupInstructions
        }

        toast.error("Upload Failed", {
          description: errorDescription,
          duration: 8000 // Show longer for setup instructions
        })
      }
    } catch (error) {

      toast.error("Upload Failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsUploading(false)
      setUploadingFileName(null)
      // Reset file input to allow re-selecting the same file
      event.target.value = ''
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
          {/* School Information and Logo Configuration - Grouped Horizontally */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {isUploading ? (
                      <div className="h-16 w-16 border rounded-lg flex items-center justify-center bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={form.watch("school_logo_url") || "/pison.png"}
                        alt={form.watch("school_logo_alt_text") || "School Logo"}
                        className="h-16 w-16 object-contain border rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="flex items-center gap-2">
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
                      {isUploading && uploadingFileName && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {uploadingFileName}
                        </span>
                      )}
                    </div>
                    {isUploading ? (
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploading logo...
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Recommended: 200x200px, PNG or SVG format. Max size: 5MB
                      </p>
                    )}
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
          </div>

          {/* Theme Colors and System Settings - Grouped Horizontally */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <Select onValueChange={field.onChange} value={field.value || academicYearOptions.current}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={academicYearOptions.previous}>
                              {academicYearOptions.previous}
                            </SelectItem>
                            <SelectItem value={academicYearOptions.current}>
                              {academicYearOptions.current}
                            </SelectItem>
                            <SelectItem value={academicYearOptions.next}>
                              {academicYearOptions.next}
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
          </div>

          {/* Sequence Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Sequence Configuration
              </CardTitle>
              <CardDescription>
                Configure sequences for the academic year and assign them to terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Academic Year:</span> {currentAcademicYear}
                  <span className="ml-2 text-xs">(from System Settings)</span>
                </p>
              </div>

              {loadingSeqConfig ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading sequence configuration...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Sequences *</label>
                      <Select
                        value={numberOfSequences.toString()}
                        onValueChange={(value) => {
                          const newCount = parseInt(value)
                          setNumberOfSequences(newCount)
                          
                          // Auto-update assignments when count changes
                          const newAssignments: SequenceAssignment[] = []
                          for (let i = 1; i <= newCount; i++) {
                            const existing = sequenceAssignments.find(a => a.sequenceNumber === i)
                            if (existing) {
                              newAssignments.push(existing)
                            } else {
                              // Auto-assign: 1-2 → Term 1, 3-4 → Term 2, 5-6 → Term 3
                              let term = 'Term 1'
                              if (i > 4) term = 'Term 3'
                              else if (i > 2) term = 'Term 2'
                              newAssignments.push({ sequenceNumber: i, term })
                            }
                          }
                          setSequenceAssignments(newAssignments)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Sequence' : 'Sequences'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Total sequences for the academic year (max 6)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Max Marks</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={defaultMaxMarks}
                        onChange={(e) => setDefaultMaxMarks(parseInt(e.target.value) || 20)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default maximum marks for each sequence
                      </p>
                    </div>
                  </div>

                  {/* Sequence Distribution by Term */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Sequence Distribution</label>
                      <p className="text-xs text-muted-foreground">
                        Assign sequences to terms by selecting from the dropdown
                      </p>
                    </div>
                    
                    {/* All Sequences List - for easy assignment */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">All Sequences</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-lg p-3 bg-muted/20">
                        {Array.from({ length: numberOfSequences }, (_, i) => i + 1).map((seqNum) => {
                          const assignment = sequenceAssignments.find(a => a.sequenceNumber === seqNum)
                          // Ensure currentTerm is always a valid term value
                          const currentTerm = (assignment?.term && ['Term 1', 'Term 2', 'Term 3'].includes(assignment.term)) 
                            ? assignment.term 
                            : 'Term 1'
                          const seqName = seqNum + 
                            (seqNum === 1 ? 'st' : 
                             seqNum === 2 ? 'nd' : 
                             seqNum === 3 ? 'rd' : 'th') + 
                            ' Sequence'
                          
                          return (
                            <div
                              key={seqNum}
                              className="flex items-center justify-between p-2 bg-background rounded border"
                            >
                              <span className="text-sm font-medium">{seqName}</span>
                              <Select
                                value={currentTerm}
                                onValueChange={(newTerm) => {
                                  // Only handle if newTerm is a valid term value
                                  if (newTerm && ['Term 1', 'Term 2', 'Term 3'].includes(newTerm)) {
                                    handleReassignSequence(seqNum, newTerm)
                                  }
                                }}
                                disabled={reassignSequence.isPending}
                              >
                                <SelectTrigger className="h-8 w-[110px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Term 1">Term 1</SelectItem>
                                  <SelectItem value="Term 2">Term 2</SelectItem>
                                  <SelectItem value="Term 3">Term 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Grouped by Term View */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Grouped by Term</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Term 1', 'Term 2', 'Term 3'].map((term) => {
                          const termSequences = sequenceAssignments
                            .filter(a => a.term === term)
                            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                          
                          return (
                            <div key={term} className="border rounded-lg p-4 bg-muted/30">
                              <h4 className="font-semibold mb-3 flex items-center justify-between">
                                <span>{term}</span>
                                <Badge variant="outline" className="text-xs">
                                  {termSequences.length} {termSequences.length === 1 ? 'sequence' : 'sequences'}
                                </Badge>
                              </h4>
                              <div className="space-y-2 min-h-[80px]">
                                {termSequences.length > 0 ? (
                                  termSequences.map((assignment) => {
                                    const seqName = assignment.sequenceNumber + 
                                      (assignment.sequenceNumber === 1 ? 'st' : 
                                       assignment.sequenceNumber === 2 ? 'nd' : 
                                       assignment.sequenceNumber === 3 ? 'rd' : 'th') + 
                                      ' Sequence'
                                    
                                    return (
                                      <div
                                        key={assignment.sequenceNumber}
                                        className="flex items-center justify-between p-2 bg-background rounded border"
                                      >
                                        <span className="text-sm font-medium">{seqName}</span>
                                        <Select
                                          value={assignment.term || 'Term 1'}
                                          onValueChange={(newTerm) => {
                                            // Only handle if newTerm is a valid term value
                                            if (newTerm && ['Term 1', 'Term 2', 'Term 3'].includes(newTerm)) {
                                              handleReassignSequence(assignment.sequenceNumber, newTerm)
                                            }
                                          }}
                                          disabled={reassignSequence.isPending}
                                        >
                                          <SelectTrigger className="h-8 w-[100px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No sequences assigned
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                      src={form.watch("school_logo_url") || "/pison.png"}
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
                      &quot;{form.watch("school_motto")}&quot;
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
