'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Filter,
  Eye,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Info
} from 'lucide-react'

interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  periods: Array<{
    id: string
    day: string
    startTime: string
    endTime: string
    subject: string
    teacher: string
    room: string
  }>
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  totalPeriods?: number
}

interface ImprovedBulkDeleteSystemProps {
  classes: TimetableClass[]
  selectedTimetables: Set<string>
  onSelectTimetable: (classId: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onDelete: () => Promise<void>
  selectAll: boolean
  isDeleting?: boolean
}

export function ImprovedBulkDeleteSystem({
  classes,
  selectedTimetables,
  onSelectTimetable,
  onSelectAll,
  onClearSelection,
  onDelete,
  selectAll,
  isDeleting = false
}: ImprovedBulkDeleteSystemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmationStep, setConfirmationStep] = useState<'preview' | 'confirm' | 'final'>('preview')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [filterSubsystem, setFilterSubsystem] = useState<string>('all')
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false)

  const classesWithTimetables = classes.filter(c => c.periods.length > 0)
  const selectedClasses = classes.filter(c => selectedTimetables.has(c.id))
  const totalPeriods = selectedClasses.reduce((sum, c) => sum + (c.totalPeriods || c.periods.length), 0)
  const totalStudentsAffected = selectedClasses.length * 30 // Estimated students per class
  
  const filteredClasses = filterSubsystem === 'all' 
    ? classesWithTimetables 
    : classesWithTimetables.filter(c => c.subsystem === filterSubsystem)

  const subsystems = Array.from(new Set(classesWithTimetables.map(c => c.subsystem)))

  const getImpactAnalysis = () => {
    const analysis = {
      totalClasses: selectedClasses.length,
      totalPeriods,
      estimatedStudents: totalStudentsAffected,
      affectedSubsystems: Array.from(new Set(selectedClasses.map(c => c.subsystem))),
      affectedLevels: Array.from(new Set(selectedClasses.map(c => c.level))),
      recentlyModified: selectedClasses.filter(c => {
        if (!c.lastModified) return false
        const modifiedDate = new Date(c.lastModified)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return modifiedDate > weekAgo
      }).length
    }
    return analysis
  }

  const impact = getImpactAnalysis()
  const isHighImpact = impact.totalClasses > 5 || impact.totalPeriods > 50 || impact.recentlyModified > 0

  const handleDelete = async () => {
    await onDelete()
    setIsDeleteDialogOpen(false)
    setConfirmationStep('preview')
    setDeleteConfirmation('')
  }

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true)
    setConfirmationStep('preview')
    setDeleteConfirmation('')
  }

  const nextStep = () => {
    if (confirmationStep === 'preview') {
      setConfirmationStep('confirm')
    } else if (confirmationStep === 'confirm') {
      setConfirmationStep('final')
    }
  }

  const prevStep = () => {
    if (confirmationStep === 'final') {
      setConfirmationStep('confirm')
    } else if (confirmationStep === 'confirm') {
      setConfirmationStep('preview')
    }
  }

  const requiredConfirmation = `DELETE ${selectedTimetables.size} TIMETABLES`
  const isConfirmationValid = deleteConfirmation === requiredConfirmation

  if (selectedTimetables.size === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Selected</h3>
          <p className="text-gray-600 mb-4">
            Select one or more timetables to enable bulk operations
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Use checkboxes to select timetables for bulk actions</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-orange-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-red-900">Bulk Delete Operations</CardTitle>
                <p className="text-sm text-red-700">
                  {selectedTimetables.size} timetable{selectedTimetables.size !== 1 ? 's' : ''} selected for deletion
                </p>
              </div>
            </div>
            
            {isHighImpact && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    High Impact
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This operation will affect many classes or recent changes</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/70 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-lg font-semibold">{selectedTimetables.size}</div>
                  <div className="text-xs text-gray-600">Classes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-lg font-semibold">{totalPeriods}</div>
                  <div className="text-xs text-gray-600">Periods</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-lg font-semibold">~{totalStudentsAffected}</div>
                  <div className="text-xs text-gray-600">Students</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-lg font-semibold">{impact.affectedSubsystems.length}</div>
                  <div className="text-xs text-gray-600">Subsystems</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Selection Controls */}
          <div className="flex items-center justify-between gap-4 p-3 bg-white/70 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filterSubsystem} onValueChange={setFilterSubsystem}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by subsystem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subsystems</SelectItem>
                    {subsystems.map(subsystem => (
                      <SelectItem key={subsystem} value={subsystem}>
                        {subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={onSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All ({filteredClasses.length})
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImpactAnalysis(!showImpactAnalysis)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Impact Analysis
                {showImpactAnalysis ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                <X className="h-4 w-4 mr-1" />
                Clear Selection
              </Button>
            </div>
          </div>

          {/* Impact Analysis */}
          {showImpactAnalysis && (
            <div className="p-4 bg-white/70 rounded-lg border space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Deletion Impact Analysis
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Affected Subsystems</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {impact.affectedSubsystems.map(subsystem => (
                      <Badge key={subsystem} variant="outline" className="text-xs">
                        {subsystem}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600">Class Levels</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {impact.affectedLevels.map(level => (
                      <Badge key={level} variant="outline" className="text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600">Recently Modified</div>
                  <div className="mt-1">
                    {impact.recentlyModified > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {impact.recentlyModified} classes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        None
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {isHighImpact && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-red-800">High Impact Operation</div>
                      <div className="text-red-700 mt-1">
                        This deletion will affect {impact.totalClasses} classes, {impact.totalPeriods} periods, 
                        and approximately {impact.estimatedStudents} students. 
                        {impact.recentlyModified > 0 && ` ${impact.recentlyModified} classes were recently modified.`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              {selectedTimetables.size} of {classesWithTimetables.length} timetables selected
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Hide' : 'Preview'} Selection
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleOpenDeleteDialog}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedTimetables.size})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="p-4 bg-white/70 rounded-lg border">
              <h4 className="font-medium mb-3">Selected Timetables Preview</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {selectedClasses.map(classData => (
                  <div key={classData.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => onSelectTimetable(classData.id)}
                      />
                      <div>
                        <div className="font-medium">{classData.name}</div>
                        <div className="text-sm text-gray-600">
                          {classData.level} • {classData.subsystem} • {classData.periods.length} periods
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={classData.status === 'generated' ? 'default' : 'secondary'}>
                      {classData.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Confirm Bulk Deletion</DialogTitle>
                <DialogDescription>
                  Step {confirmationStep === 'preview' ? '1' : confirmationStep === 'confirm' ? '2' : '3'} of 3 - 
                  {confirmationStep === 'preview' && ' Review what will be deleted'}
                  {confirmationStep === 'confirm' && ' Understand the consequences'}
                  {confirmationStep === 'final' && ' Final confirmation required'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step 1: Preview */}
          {confirmationStep === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">You are about to delete:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-700">Timetables:</span>
                      <span className="font-medium">{selectedTimetables.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Total Periods:</span>
                      <span className="font-medium">{totalPeriods}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-700">Affected Students:</span>
                      <span className="font-medium">~{totalStudentsAffected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Subsystems:</span>
                      <span className="font-medium">{impact.affectedSubsystems.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedClasses.map(classData => (
                  <div key={classData.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{classData.name}</span>
                    <span className="text-sm text-gray-600">{classData.periods.length} periods</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Consequences */}
          {confirmationStep === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  This action will permanently:
                </h4>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full" />
                    Remove all scheduled periods for selected classes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full" />
                    Affect student schedules and teacher assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full" />
                    Require regeneration of timetables for these classes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full" />
                    Cannot be undone without regenerating timetables
                  </li>
                </ul>
              </div>

              {impact.recentlyModified > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Changes Warning
                  </h4>
                  <p className="text-sm text-red-800">
                    {impact.recentlyModified} of the selected timetables were recently modified. 
                    Deleting them will lose any recent customizations or adjustments.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {confirmationStep === 'final' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Final Safety Check
                </h4>
                <p className="text-sm text-red-800 mb-4">
                  To proceed with deleting {selectedTimetables.size} timetables, 
                  please type the following confirmation text exactly:
                </p>
                
                <div className="bg-white p-3 rounded border-2 border-dashed border-red-300 mb-3">
                  <code className="text-red-900 font-mono text-sm">{requiredConfirmation}</code>
                </div>

                <Input
                  placeholder="Type the confirmation text above"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className={`${
                    deleteConfirmation && !isConfirmationValid 
                      ? 'border-red-500 focus:border-red-500' 
                      : isConfirmationValid 
                      ? 'border-green-500 focus:border-green-500' 
                      : ''
                  }`}
                />

                {deleteConfirmation && !isConfirmationValid && (
                  <p className="text-sm text-red-600 mt-2">
                    Confirmation text doesn't match. Please type exactly as shown above.
                  </p>
                )}

                {isConfirmationValid && (
                  <div className="flex items-center gap-2 mt-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Confirmation verified</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {confirmationStep !== 'preview' && (
                <Button variant="outline" onClick={prevStep} disabled={isDeleting}>
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              
              {confirmationStep === 'final' ? (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!isConfirmationValid || isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Delete {selectedTimetables.size} Timetables
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={nextStep} variant="default">
                  {confirmationStep === 'preview' ? 'Continue' : 'Next'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
