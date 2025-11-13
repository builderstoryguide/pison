"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Shield, Users, DollarSign, BookOpen, UserCheck } from 'lucide-react'
import { useUserManagement } from '@/lib/user-management-context'

interface EnhancedAccessRightsDialogProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  system: {
    title: 'System Management',
    icon: Shield,
    permissions: ['all', 'manage_users', 'manage_system'],
    description: 'Core system administration permissions'
  },
  academic: {
    title: 'Academic Management',
    icon: BookOpen,
    permissions: ['manage_classes', 'grade_students', 'view_grades', 'view_schedule', 'submit_assignments'],
    description: 'Teaching and learning related permissions'
  },
  communication: {
    title: 'Communication',
    icon: Users,
    permissions: ['communicate_parents', 'communicate_teachers'],
    description: 'Messaging and communication permissions'
  },
  financial: {
    title: 'Financial Management',
    icon: DollarSign,
    permissions: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices', 'view_financial_records'],
    description: 'Financial and payment related permissions'
  },
  student: {
    title: 'Student/Parent Access',
    icon: UserCheck,
    permissions: ['view_child_progress'],
    description: 'Student and parent specific permissions'
  }
}

export function EnhancedAccessRightsDialog({ user, open, onOpenChange }: EnhancedAccessRightsDialogProps) {
  const { updateUser } = useUserManagement()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [allowCrossRole, setAllowCrossRole] = useState(false)
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && user) {
      setSelectedPermissions(user.permissions || [])
      loadPermissions()
    }
  }, [open, user])

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/users/access-rights?role=${user.role}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        const permissions = data.permissions || []
        setAllPermissions(permissions)
        setRolePermissions(permissions)
      } else {
        setError('Failed to load permissions')
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError('Failed to load permissions')
    }
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission))
    }
  }

  const handleCategoryToggle = (categoryPermissions: string[], checked: boolean) => {
    if (checked) {
      // Add all category permissions that are available
      const availablePermissions = categoryPermissions.filter(p => 
        allowCrossRole ? allPermissions.includes(p) : rolePermissions.includes(p)
      )
      setSelectedPermissions(prev => {
        const newPermissions = [...prev]
        availablePermissions.forEach(permission => {
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

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await updateUser(user.id, { permissions: selectedPermissions })
      if (success) {
        onOpenChange(false)
      } else {
        setError('Failed to update access rights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access rights')
    } finally {
      setIsLoading(false)
    }
  }

  const isCategorySelected = (categoryPermissions: string[]) => {
    const availablePermissions = categoryPermissions.filter(p => 
      allowCrossRole ? allPermissions.includes(p) : rolePermissions.includes(p)
    )
    return availablePermissions.every(p => selectedPermissions.includes(p))
  }

  const isCategoryPartiallySelected = (categoryPermissions: string[]) => {
    const availablePermissions = categoryPermissions.filter(p => 
      allowCrossRole ? allPermissions.includes(p) : rolePermissions.includes(p)
    )
    const selectedCount = availablePermissions.filter(p => selectedPermissions.includes(p)).length
    return selectedCount > 0 && selectedCount < availablePermissions.length
  }

  const getAvailablePermissions = () => {
    return allowCrossRole ? allPermissions : rolePermissions
  }

  const getPermissionBadgeVariant = (permission: string) => {
    if (rolePermissions.includes(permission)) {
      return 'default' as const
    }
    return 'secondary' as const
  }

  const getPermissionLabel = (permission: string) => {
    if (rolePermissions.includes(permission)) {
      return 'Standard'
    }
    return 'Cross-Role'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Access Rights - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cross-Role Assignment Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="cross-role" className="text-sm font-medium">
                Enable Cross-Role Permission Assignment
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow assigning permissions from other roles to this user
              </p>
            </div>
            <Switch
              id="cross-role"
              checked={allowCrossRole}
              onCheckedChange={setAllowCrossRole}
            />
          </div>

          {allowCrossRole && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Cross-role assignment is enabled. You can now assign permissions from any role to this user.
                Cross-role permissions are marked with a "Cross-Role" badge.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Permission Categories */}
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
              const Icon = category.icon
              const availableCategoryPermissions = category.permissions.filter(p => 
                getAvailablePermissions().includes(p)
              )

              if (availableCategoryPermissions.length === 0) {
                return null
              }

              return (
                <div key={categoryKey} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <h3 className="font-medium">{category.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {availableCategoryPermissions.length} permissions
                      </Badge>
                    </div>
                    <Checkbox
                      checked={isCategorySelected(availableCategoryPermissions)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(availableCategoryPermissions, checked as boolean)
                      }
                      className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      ref={(el) => {
                        if (el) {
                          (el as any).indeterminate = isCategoryPartiallySelected(availableCategoryPermissions)
                        }
                      }}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableCategoryPermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(permission, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={permission} 
                          className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                        >
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          <Badge 
                            variant={getPermissionBadgeVariant(permission)}
                            className="text-xs"
                          >
                            {getPermissionLabel(permission)}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Permissions Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Selected Permissions ({selectedPermissions.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPermissions.map((permission) => (
                <Badge 
                  key={permission} 
                  variant={getPermissionBadgeVariant(permission)}
                  className="text-xs"
                >
                  {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
