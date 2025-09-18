"use client"

import React from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Shield, 
  Clock,
  Edit,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { copyToClipboardWithFeedback } from '@/lib/clipboard-utils'

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
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    await copyToClipboardWithFeedback(
      text,
      () => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
      },
      (error) => {
        console.error('Copy failed:', error)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" />
            Teacher Profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete information and details for {teacher.firstName} {teacher.lastName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] pr-2">
          <div className="space-y-4">
            {/* Header Section */}
            <Card className="border-2">
              <CardContent className="p-4">
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
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Contact Information */}
              <Card>
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
              <Card>
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
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Subjects */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    Subjects Taught
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {teacher.subjects?.length || 0} subject{teacher.subjects?.length !== 1 ? 's' : ''} assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects.map((subject: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors"
                        >
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">No subjects assigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Classes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    Classes Assigned
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {teacher.classes?.length || 0} class{teacher.classes?.length !== 1 ? 'es' : ''} assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacher.classes && teacher.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teacher.classes.map((cls: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="border-orange-200 text-orange-800 hover:bg-orange-50 transition-colors"
                        >
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">No classes assigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Qualifications */}
            <Card>
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
              <Card>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(teacher.emergencyContact.phone, 'emergencyPhone')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedField === 'emergencyPhone' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
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
  )
}
