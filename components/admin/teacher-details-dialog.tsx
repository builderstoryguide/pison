"use client"

import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Award, 
  Shield, 
  Clock,
  Edit,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { copyToClipboardWithFeedback } from '@/lib/clipboard-utils'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TeacherDetailsDialogProps {
  teacher: any
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

export function TeacherDetailsDialog({ 
  teacher, 
  isOpen, 
  onClose, 
  onEdit 
}: TeacherDetailsDialogProps) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()

  // Fetch teacher assignments when dialog opens
  useEffect(() => {
    if (isOpen && teacher?.id) {
      fetchTeacherAssignments()
    }
  }, [isOpen, teacher?.id])

  const fetchTeacherAssignments = async () => {
    if (!teacher?.id) return

    setIsLoadingAssignments(true)
    setAssignmentsError(null)

    try {
      // Try to get the teacher ID - it could be the UUID or the teacher_id string
      let teacherId = teacher.id
      
      // If we have a teacher_id field, use that instead
      if (teacher.teacherId) {
        teacherId = teacher.teacherId
      }

      console.log('🔍 Fetching assignments for teacher:', teacherId)

      const response = await fetch(`/api/teachers/assignments/ultra-fast?teacherId=${teacherId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📚 Assignments API Response:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch assignments')
      }

      setAssignments(result.assignments || [])
    } catch (error) {
      console.error('❌ Error fetching teacher assignments:', error)
      setAssignmentsError(error instanceof Error ? error.message : 'Failed to fetch assignments')
      toast({
        title: "Error",
        description: "Failed to load teacher assignments",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    const normalized = String(text ?? '').trim()
    if (!normalized) {
      toast({
        title: "Nothing to copy",
        description: "The field is empty or contains no text to copy.",
        variant: "destructive"
      })
      return
    }

    await copyToClipboardWithFeedback(
      normalized,
      () => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
        toast({
          title: "Copied to clipboard",
          description: `${field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : field === 'teacherId' ? 'Teacher ID' : field === 'emergencyPhone' ? 'Emergency phone' : 'Text'} copied successfully.`,
        })
      },
      (error) => {
        console.error('Copy failed:', error)
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again or copy manually.",
          variant: "destructive"
        })
      }
    )
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSubsystemColor = (subsystem: string) => {
    switch (subsystem?.toLowerCase()) {
      case 'english':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'french':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!teacher) return null

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(newOpenState) => {
        if (!newOpenState) {
          onClose()
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" />
            Teacher Profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete information and details for {teacher.firstName} {teacher.lastName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] pr-1">
          <div className="space-y-4 max-w-full overflow-x-hidden">
            {/* Header Section */}
            <Card className="border-2 max-w-full overflow-hidden">
              <CardContent className="p-4 max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-background shadow-lg flex-shrink-0">
                    <AvatarImage src="/placeholder-user.jpg" alt={`${teacher.firstName} ${teacher.lastName}`} />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2 min-w-0">
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold text-foreground break-words">
                        {teacher.title} {teacher.firstName} {teacher.lastName}
                      </h1>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 break-all">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getSubsystemColor(teacher.subsystem)} border`}>
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {teacher.subsystem}
                      </Badge>
                      <Badge className={`${getStatusColor(teacher.status)} border`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {teacher.status}
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 text-blue-800">
                        <Award className="h-3 w-3 mr-1" />
                        {teacher.employmentType}
                      </Badge>
                    </div>
                  </div>

                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onEdit}
                      className="self-start flex-shrink-0"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information Grid */}
            <div className="grid gap-4 lg:grid-cols-2 max-w-full overflow-hidden">
              {/* Contact Information */}
              <Card className="max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">Email</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground truncate flex-1">{teacher.email}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(teacher.email, 'email')}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              {copiedField === 'email' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copiedField === 'email' ? 'Copied!' : 'Copy email'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">Phone</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {teacher.phone || "Not provided"}
                        </span>
                        {teacher.phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(teacher.phone, 'phone')}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                {copiedField === 'phone' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedField === 'phone' ? 'Copied!' : 'Copy phone number'}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Address</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {teacher.address || "Not provided"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {teacher.city && teacher.region 
                          ? `${teacher.city}, ${teacher.region}`
                          : teacher.city || teacher.region || "Location not specified"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">Teacher ID</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground font-mono truncate flex-1">{teacher.teacherId}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(teacher.teacherId, 'teacherId')}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              {copiedField === 'teacherId' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copiedField === 'teacherId' ? 'Copied!' : 'Copy teacher ID'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Start Date</span>
                    </div>
                    <p className="ml-5 text-xs text-muted-foreground">
                      {teacher.startDate || "Not provided"}
                    </p>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Experience</span>
                    </div>
                    <p className="ml-5 text-xs text-muted-foreground">
                      {teacher.experience || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teaching Information */}
              <Card className="max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  Teaching Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                  Subjects and classes assigned to this teacher
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingAssignments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading assignments...</span>
                  </div>
                ) : assignmentsError ? (
                  <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{assignmentsError}</span>
                  </div>
                ) : assignments && assignments.length > 0 ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {assignments.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Assignments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {new Set(assignments.map((a: any) => a.branch?.subject?.subject_name || a.subjectName)).size}
                        </div>
                        <div className="text-xs text-muted-foreground">Subjects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {new Set(assignments.map((a: any) => a.class?.class_name || a.className)).size}
                    </div>
                        <div className="text-xs text-muted-foreground">Classes</div>
                    </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {assignments.filter((a: any) => a.isPrimary || a.isPrimaryTeacher).length}
                    </div>
                        <div className="text-xs text-muted-foreground">Primary</div>
                    </div>
            </div>

            {/* Detailed Assignments */}
                  <div className="space-y-3">
                    {assignments.map((assignment: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-2">
                          {/* Subject and Class Assignment */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800 border-blue-200"
                            >
                                {assignment.branch?.subject?.subject_name || assignment.subjectName || 'Unknown Subject'}
                            </Badge>
                            {assignment.branch?.branch_name && (
                              <Badge 
                                variant="outline" 
                                className="border-gray-300 text-gray-700"
                              >
                                {assignment.branch.branch_name}
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs hidden sm:inline">→</span>
                            <Badge 
                              variant="outline" 
                              className="border-orange-200 text-orange-800"
                            >
                                {assignment.class?.class_name || assignment.className || 'Unknown Class'}
                            </Badge>
                          </div>
                          
                          {/* Class Details */}
                          <div className="text-xs text-muted-foreground">
                            {assignment.class?.class_level && (
                              <span>Level: {assignment.class.class_level}</span>
                            )}
                            {assignment.class?.stream && (
                              <span className="ml-2">Stream: {assignment.class.stream}</span>
                            )}
                              {assignment.class?.current_enrollment && (
                                <span className="ml-2">Students: {assignment.class.current_enrollment}</span>
                              )}
                          </div>
                          
                          {/* Status and Year */}
                          <div className="flex flex-wrap items-center gap-2">
                            {(assignment.isPrimary || assignment.isPrimaryTeacher) && (
                              <Badge 
                                variant="default" 
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Primary Teacher
                              </Badge>
                            )}
                            {assignment.academicYear && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {assignment.academicYear}
                              </Badge>
                            )}
                              {assignment.term && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  Term: {assignment.term}
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                ) : teacher.subjects && teacher.subjects.length > 0 ? (
                  // Fallback: Show subjects and classes from basic teacher data
                  <div className="space-y-4">
                    {/* Subjects Section */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Subjects
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map((subject: string, index: number) => (
                          <Badge 
                            key={index}
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Classes Section */}
                    {teacher.classes && teacher.classes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Classes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {teacher.classes.map((className: string, index: number) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="border-orange-200 text-orange-800"
                            >
                              {className}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // No assignments or subjects found
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No teaching assignments found</span>
                  </div>
                )}
                </CardContent>
              </Card>

            {/* Qualifications */}
            <Card className="max-w-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Qualifications & Certifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Educational background and professional certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teacher.qualifications && teacher.qualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teacher.qualifications.map((qualification: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 transition-colors"
                      >
                        {qualification}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">No qualifications listed</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {teacher.emergencyContact && (
              <Card className="max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-red-600" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Contact information for emergencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Name</p>
                      <p className="text-xs">{teacher.emergencyContact.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Relationship</p>
                      <p className="text-xs">{teacher.emergencyContact.relationship || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs">{teacher.emergencyContact.phone || "Not provided"}</p>
                        {teacher.emergencyContact.phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(teacher.emergencyContact.phone, 'emergencyPhone')}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                {copiedField === 'emergencyPhone' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedField === 'emergencyPhone' ? 'Copied!' : 'Copy emergency phone'}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-2" />
              Edit Teacher
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  )
}
