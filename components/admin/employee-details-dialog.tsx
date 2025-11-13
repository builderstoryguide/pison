"use client"

import React from "react"
import { X, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, FileText, User, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Employee } from "@/lib/employee-management-context"

interface EmployeeDetailsDialogProps {
  open: boolean
  employee: Employee
  onClose: () => void
}

export function EmployeeDetailsDialog({ open, employee, onClose }: EmployeeDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "terminated":
        return (
          <Badge variant="destructive" className="bg-red-700">
            Terminated
          </Badge>
        )
      case "retired":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Retired
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case "full-time":
        return <Badge variant="default">Full-Time</Badge>
      case "part-time":
        return <Badge variant="secondary">Part-Time</Badge>
      case "contract":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Contract
          </Badge>
        )
      case "temporary":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            Temporary
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`/placeholder_64px.png?height=80&width=80`} />
                <AvatarFallback className="text-2xl">
                  {employee.firstName.charAt(0)}
                  {employee.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold">
                  {employee.title} {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-muted-foreground">{employee.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">{employee.employeeId}</Badge>
                  {getEmploymentTypeBadge(employee.employmentType)}
                  {getStatusBadge(employee.status)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Employment Type</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {employee.employmentType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-xs text-muted-foreground">
                      {employee.startDate
                        ? new Date(employee.startDate).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Monthly Salary</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "XAF",
                        maximumFractionDigits: 0,
                      }).format(employee.salary || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-xs text-muted-foreground">
                      {employee.department || "Not assigned"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Full Name</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.title} {employee.firstName} {employee.lastName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Date of Birth</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.dateOfBirth
                      ? new Date(employee.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Gender</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {employee.gender || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Nationality</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.nationality || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">ID Number</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.idNumber || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Email</h4>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Phone</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.phone || "Not provided"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium mb-1">Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.address || "Not provided"}
                  </p>
                  {employee.city && employee.region && (
                    <p className="text-sm text-muted-foreground">
                      {employee.city}, {employee.region}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Employment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Employee ID</h4>
                  <p className="text-sm text-muted-foreground font-mono">{employee.employeeId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Employment Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {employee.employmentType}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Department</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.department || "Not assigned"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Specialization</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.specialization || "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Start Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.startDate
                      ? new Date(employee.startDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                {employee.endDate && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">End Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {employee.contractRenewalDate && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Contract Renewal Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.contractRenewalDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-1">Monthly Salary</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "XAF",
                      maximumFractionDigits: 0,
                    }).format(employee.salary || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Professional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Subsystem</h4>
                  <Badge variant="outline" className="capitalize">
                    {employee.subsystem}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.subjects.length > 0 ? (
                      employee.subjects.map((subject: string) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No subjects assigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.classes.length > 0 ? (
                      employee.classes.map((cls: string) => (
                        <Badge key={cls} variant="outline">
                          {cls}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No classes assigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Qualifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.qualifications.length > 0 ? (
                      employee.qualifications.map((qualification: string) => (
                        <Badge key={qualification} variant="secondary">
                          {qualification}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No qualifications listed</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Experience</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.experience || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Name</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.emergencyContact?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Relationship</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.emergencyContact?.relationship || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Phone</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.emergencyContact?.phone || "Not provided"}
                  </p>
                </div>
                {employee.emergencyContact?.email && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Email</h4>
                    <p className="text-sm text-muted-foreground">
                      {employee.emergencyContact.email}
                    </p>
                  </div>
                )}
                {employee.emergencyContact?.address && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-1">Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {employee.emergencyContact.address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>Edit Employee</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

