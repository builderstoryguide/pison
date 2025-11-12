'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Trash2, 
  X, 
  AlertTriangle, 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
// Removed framer-motion import for compatibility

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
}

interface EnhancedBulkDeleteToolbarProps {
  selectedTimetables: Set<string>
  classes: TimetableClass[]
  onDelete: () => Promise<void>
  onClearSelection: () => void
  isDeleting?: boolean
}

export function EnhancedBulkDeleteToolbar({
  selectedTimetables,
  classes,
  onDelete,
  onClearSelection,
  isDeleting = false
}: EnhancedBulkDeleteToolbarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const selectedClasses = classes.filter(c => selectedTimetables.has(c.id))
  const totalPeriods = selectedClasses.reduce((sum, c) => sum + c.periods.length, 0)
  
  const handleDelete = async () => {
    await onDelete()
    setIsDeleteDialogOpen(false)
    setDeleteConfirmation('')
  }

  const isConfirmationValid = deleteConfirmation === `DELETE ${selectedTimetables.size} TIMETABLES`

  if (selectedTimetables.size === 0) return null

  return (
    <TooltipProvider>
      <div className="transition-all duration-300 ease-in-out">
          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="p-4">
              {/* Main Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Selection Summary */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-orange-900 dark:text-orange-100">
                          {selectedTimetables.size} timetable{selectedTimetables.size !== 1 ? 's' : ''} selected
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {totalPeriods} periods
                        </Badge>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Ready for bulk deletion
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-4 text-sm text-orange-700 dark:text-orange-300">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{new Set(selectedClasses.map(c => c.subsystem)).size} subsystem{new Set(selectedClasses.map(c => c.subsystem)).size !== 1 ? 's' : ''}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Affected subsystems</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{totalPeriods} periods</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total periods to be deleted</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-orange-700 border-orange-200 hover:bg-orange-100"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Details
                    {showDetails ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </Button>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-gray-600 hover:text-gray-800"
                        disabled={isDeleting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear selection</p>
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              </div>

              {/* Detailed View */}
              {showDetails && (
                <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800 transition-all duration-300">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {selectedClasses.map((classData) => (
                        <div
                          key={classData.id}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{classData.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {classData.periods.length} periods
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>Level: {classData.level}</div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {classData.subsystem}
                              </Badge>
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {classData.branch}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">
                  Confirm Timetable Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-600">
                  This action cannot be undone and will permanently delete all schedule data.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Impact Summary */}
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                Deletion Impact Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-600" />
                  <span>{selectedTimetables.size} timetables</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span>{totalPeriods} periods</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-600" />
                  <span>{new Set(selectedClasses.map(c => c.subsystem)).size} subsystems</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span>{selectedClasses.length} classes affected</span>
                </div>
              </div>
            </div>

            {/* Affected Classes List */}
            <div className="max-h-40 overflow-y-auto">
              <h4 className="font-medium mb-2">Affected Classes:</h4>
              <div className="space-y-2">
                {selectedClasses.map((classData) => (
                  <div
                    key={classData.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{classData.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {classData.subsystem}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600">
                      {classData.periods.length} periods
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Confirmation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">DELETE {selectedTimetables.size} TIMETABLES</code> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={`DELETE ${selectedTimetables.size} TIMETABLES`}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedTimetables.size} Timetables
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
