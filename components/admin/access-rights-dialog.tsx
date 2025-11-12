"use client"

import React, { useState, useEffect } from 'react'
import { Shield, Check, AlertCircle, Info, ToggleRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { useUserManagement, User } from '@/lib/user-management-context'
import { useToast } from '@/hooks/use-toast'

interface AccessRightsDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Permission categories for better organization
const permissionCategories = {
  'System Management': [
    'all',
    'manage_users',
    'manage_system',
    'view_reports'
  ],
  'Academic Management': [
    'manage_classes',
    'grade_students',
    'view_grades',
    'view_schedule',
    'submit_assignments'
  ],
  'Communication': [
    'communicate_parents',
    'communicate_teachers'
  ],
  'Financial Management': [
    'manage_finances',
    'track_payments',
    'generate_reports',
    'send_fee_notices',
    'view_financial_records'
  ],
  'Student/Parent Access': [
    'view_child_progress'
  ]
}

export function AccessRightsDialog({ user, open, onOpenChange }: AccessRightsDialogProps) {
  const { updateUser, isLoading } = useUserManagement()
  const { success: toastSuccess, error: toastError } = useToast()
  
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [crossRoleEnabled, setCrossRoleEnabled] = useState(false)

  // Load available permissions when dialog opens
  useEffect(() => {
    if (open && user.role) {
      loadAvailablePermissions()
    }
  }, [open, user.role])

  // Initialize selected permissions when user changes
  useEffect(() => {
    if (user.permissions) {
      setSelectedPermissions([...user.permissions])
    }
  }, [user.permissions])

  const loadAvailablePermissions = async () => {
    setIsLoadingPermissions(true)
    try {
      // Load permissions from API
      const response = await fetch(`/api/users/access-rights?role=${user.role}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        const standardPermissions = data.permissions || []
        setRolePermissions(standardPermissions)
        setAllPermissions(standardPermissions) // For now, use same permissions
        setAvailablePermissions(standardPermissions)
      } else {
        toastError('Error', 'Failed to load available permissions')
      }
    } catch (error) {
      console.error('Error loading available permissions:', error)
      toastError('Error', 'Failed to load available permissions')
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission))
    }
  }

  const handleSelectAll = (categoryPermissions: string[], checked: boolean) => {
    if (checked) {
      // Add all category permissions that are available for this role
      const validPermissions = categoryPermissions.filter(p => availablePermissions.includes(p))
      setSelectedPermissions(prev => {
        const newPermissions = [...prev]
        validPermissions.forEach(permission => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission)
          }
        })
        return newPermissions
      })
    } else {
      // Remove all category permissions
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)))
    }
  }

  const handleCrossRoleToggle = (enabled: boolean) => {
    setCrossRoleEnabled(enabled)
    if (enabled) {
      setAvailablePermissions(allPermissions)
    } else {
      setAvailablePermissions(rolePermissions)
      // Remove any cross-role permissions that are not valid for the user's role
      setSelectedPermissions(prev => prev.filter(p => rolePermissions.includes(p)))
    }
  }

  const handleSave = async () => {
    try {
      setIsLoadingPermissions(true)
      const success = await updateUser(user.id, { permissions: selectedPermissions })
      if (success) {
        const message = crossRoleEnabled 
          ? `Access rights updated for ${user.name} with cross-role permissions`
          : `Access rights updated for ${user.name}`
        toastSuccess('Success', message)
        onOpenChange(false)
      } else {
        toastError('Error', 'Failed to update access rights. Please try again.')
      }
    } catch (error) {
      console.error('Error updating access rights:', error)
      toastError('Error', 'An unexpected error occurred while updating access rights.')
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  const getPermissionDescription = (permission: string): string => {
    const descriptions: Record<string, string> = {
      'all': 'Full system access - can perform any action',
      'manage_users': 'Create, edit, and delete user accounts',
      'manage_system': 'Configure system settings and preferences',
      'view_reports': 'Access to system reports and analytics',
      'manage_classes': 'Create and manage class assignments',
      'grade_students': 'Enter and modify student grades',
      'view_grades': 'View student grades and academic records',
      'view_schedule': 'Access class schedules and timetables',
      'submit_assignments': 'Submit assignments and coursework',
      'communicate_parents': 'Send messages to parents',
      'communicate_teachers': 'Send messages to teachers',
      'manage_finances': 'Manage financial records and transactions',
      'track_payments': 'Track and record payment transactions',
      'generate_reports': 'Generate financial and academic reports',
      'send_fee_notices': 'Send fee payment notices and reminders',
      'view_financial_records': 'View financial information and records',
      'view_child_progress': 'View child\'s academic progress'
    }
    return descriptions[permission] || 'No description available'
  }

  const isCategoryFullySelected = (categoryPermissions: string[]): boolean => {
    const validPermissions = categoryPermissions.filter(p => availablePermissions.includes(p))
    return validPermissions.length > 0 && validPermissions.every(p => selectedPermissions.includes(p))
  }

  const isCategoryPartiallySelected = (categoryPermissions: string[]): boolean => {
    const validPermissions = categoryPermissions.filter(p => availablePermissions.includes(p))
    const selectedInCategory = validPermissions.filter(p => selectedPermissions.includes(p))
    return selectedInCategory.length > 0 && selectedInCategory.length < validPermissions.length
  }

  const isCrossRolePermission = (permission: string): boolean => {
    return !rolePermissions.includes(permission) && allPermissions.includes(permission)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Access Rights
          </DialogTitle>
          <DialogDescription>
            Configure permissions for {user.name} ({user.role})
          </DialogDescription>
          
          {/* Cross-Role Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Switch
                id="cross-role-toggle"
                checked={crossRoleEnabled}
                onCheckedChange={handleCrossRoleToggle}
              />
              <div>
                <Label htmlFor="cross-role-toggle" className="text-sm font-medium cursor-pointer">
                  Enable Cross-Role Permission Assignment
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow assigning permissions from other roles to this user
                </p>
              </div>
            </div>
            {crossRoleEnabled && (
              <Badge variant="outline" className="text-xs">
                <ToggleRight className="h-3 w-3 mr-1" />
                Cross-Role Mode
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading available permissions...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Permissions Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Permissions</CardTitle>
                  <CardDescription>
                    {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPermissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedPermissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No permissions selected</p>
                  )}
                </CardContent>
              </Card>

              {/* Permission Categories */}
              {Object.entries(permissionCategories).map(([category, permissions]) => {
                const validPermissions = permissions.filter(p => availablePermissions.includes(p))
                
                if (validPermissions.length === 0) return null

                return (
                  <Card key={category}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{category}</CardTitle>
                          <CardDescription>
                            {validPermissions.length} permission{validPermissions.length !== 1 ? 's' : ''} available
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isCategoryFullySelected(permissions)}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLInputElement).indeterminate = isCategoryPartiallySelected(permissions)
                              }
                            }}
                            onCheckedChange={(checked) => handleSelectAll(permissions, checked as boolean)}
                          />
                          <Label className="text-sm">Select All</Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validPermissions.map(permission => (
                          <div key={permission} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Checkbox
                              id={permission}
                              checked={selectedPermissions.includes(permission)}
                              onCheckedChange={(checked) => handlePermissionToggle(permission, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Label 
                                  htmlFor={permission} 
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.replace(/_/g, ' ')}
                                </Label>
                                {isCrossRolePermission(permission) && (
                                  <Badge variant="secondary" className="text-xs">
                                    Cross-Role
                                  </Badge>
                                )}
                                {permission === 'all' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Admin Only
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getPermissionDescription(permission)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Warning for Admin Role */}
              {user.role === 'admin' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Admin Warning:</strong> Admins with 'all' permission have unrestricted access to the system. 
                    Use caution when modifying admin permissions.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info about Role-based Permissions */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {crossRoleEnabled ? (
                    <>
                      <strong>Cross-Role Mode:</strong> All system permissions are available for assignment. 
                      Cross-role permissions are marked with a "Cross-Role" badge. Use with caution as this 
                      grants permissions beyond the user's standard role.
                    </>
                  ) : (
                    <>
                      <strong>Standard Mode:</strong> Only permissions appropriate for the {user.role} role are shown. 
                      Enable cross-role assignment to assign permissions from other roles.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || isLoadingPermissions}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
