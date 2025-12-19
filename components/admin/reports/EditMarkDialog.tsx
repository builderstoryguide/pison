"use client"

import React, { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface EditMarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName: string
  subjectId: string
  sequenceNumber?: number
  sequenceName?: string
  currentMark?: number
  currentCoefficient?: number
  studentId?: string
  classId?: string
  term?: number
  academicYear?: string
  editType: 'mark' | 'coefficient' | 'both'
  onSave: () => void
}

export function EditMarkDialog({
  open,
  onOpenChange,
  subjectName,
  subjectId,
  sequenceNumber,
  sequenceName,
  currentMark,
  currentCoefficient,
  studentId,
  classId,
  term,
  academicYear,
  editType,
  onSave,
}: EditMarkDialogProps) {
  const [mark, setMark] = useState<string>('')
  const [coefficient, setCoefficient] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Update values when dialog opens or values change
  useEffect(() => {
    if (open) {
      if (editType === 'mark' || editType === 'both') {
        setMark(currentMark !== undefined ? currentMark.toString() : '')
      }
      if (editType === 'coefficient' || editType === 'both') {
        setCoefficient(currentCoefficient !== undefined ? currentCoefficient.toString() : '')
      }
    }
  }, [open, currentMark, currentCoefficient, editType])

  const handleMarkChange = (value: string) => {
    // Allow empty string or valid number between 0 and 20
    if (value === '') {
      setMark('')
      return
    }

    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      setMark(value)
    }
  }

  const handleCoefficientChange = (value: string) => {
    // Allow empty string or valid positive number
    if (value === '') {
      setCoefficient('')
      return
    }

    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setCoefficient(value)
    }
  }

  const handleSave = async () => {
    // Validate mark if editing mark
    if (editType === 'mark' || editType === 'both') {
      const markValue = parseFloat(mark)
      if (isNaN(markValue) || markValue < 0 || markValue > 20) {
        toast({
          title: 'Invalid mark',
          description: 'Mark must be a number between 0 and 20',
          variant: 'destructive',
        })
        return
      }
    }

    // Validate coefficient if editing coefficient
    if (editType === 'coefficient' || editType === 'both') {
      const coefficientValue = parseFloat(coefficient)
      if (isNaN(coefficientValue) || coefficientValue <= 0) {
        toast({
          title: 'Invalid coefficient',
          description: 'Coefficient must be a positive number',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      // Get user ID from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      // Track which operations succeeded
      let markSaved = false
      let coefficientSaved = false

      // Save mark if editing mark
      if (editType === 'mark' || editType === 'both') {
        if (!studentId || !classId || !sequenceNumber || term === undefined || !academicYear) {
          throw new Error('Missing required fields for mark entry')
        }

        const markValue = parseFloat(mark)
        const response = await fetch('/api/admin/manual-marks', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            studentId,
            subjectId,
            classId,
            sequenceNumber,
            mark: markValue,
            term: term.toString(),
            academicYear,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save mark')
        }
        
        markSaved = true
      }

      // Save coefficient if editing coefficient
      if (editType === 'coefficient' || editType === 'both') {
        const coefficientValue = parseFloat(coefficient)
        const response = await fetch('/api/admin/manual-marks/coefficient', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subjectId,
            coefficient: coefficientValue,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save coefficient')
        }
        
        coefficientSaved = true
      }

      // Only show success and trigger refresh if all operations succeeded
      const successMessage = editType === 'mark' 
        ? `Mark for ${sequenceName} has been ${currentMark !== undefined ? 'updated' : 'saved'} successfully`
        : editType === 'coefficient'
        ? `Coefficient has been updated successfully`
        : `Mark and coefficient have been saved successfully`

      toast({
        title: 'Saved',
        description: successMessage,
      })

      // Only call onSave after all operations succeed
      // This ensures refresh only happens when data is actually saved
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (editType === 'mark' || editType === 'both') {
      setMark(currentMark !== undefined ? currentMark.toString() : '')
    }
    if (editType === 'coefficient' || editType === 'both') {
      setCoefficient(currentCoefficient !== undefined ? currentCoefficient.toString() : '')
    }
    onOpenChange(false)
  }

  const getDialogTitle = () => {
    if (editType === 'mark') {
      return currentMark !== undefined ? 'Edit Mark' : 'Enter Mark'
    } else if (editType === 'coefficient') {
      return 'Edit Coefficient'
    } else {
      return 'Edit Mark & Coefficient'
    }
  }

  const getDialogDescription = () => {
    if (editType === 'mark') {
      return `${subjectName} - ${sequenceName}`
    } else if (editType === 'coefficient') {
      return `${subjectName}`
    } else {
      return `${subjectName} - ${sequenceName}`
    }
  }

  const canSave = () => {
    if (editType === 'mark') {
      return mark !== ''
    } else if (editType === 'coefficient') {
      return coefficient !== ''
    } else {
      return mark !== '' && coefficient !== ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {(editType === 'mark' || editType === 'both') && (
            <div className="grid gap-2">
              <Label htmlFor="mark">Mark (0-20)</Label>
              <Input
                id="mark"
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={mark}
                onChange={(e) => handleMarkChange(e.target.value)}
                placeholder="Enter mark"
                autoFocus={editType === 'mark'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSave()) {
                    handleSave()
                  }
                }}
              />
              {currentMark !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Current mark: {currentMark.toFixed(1)}
                </p>
              )}
            </div>
          )}
          {(editType === 'coefficient' || editType === 'both') && (
            <div className="grid gap-2">
              <Label htmlFor="coefficient">Coefficient</Label>
              <Input
                id="coefficient"
                type="number"
                min="0.1"
                step="0.1"
                value={coefficient}
                onChange={(e) => handleCoefficientChange(e.target.value)}
                placeholder="Enter coefficient"
                autoFocus={editType === 'coefficient'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSave()) {
                    handleSave()
                  }
                }}
              />
              {currentCoefficient !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Current coefficient: {currentCoefficient.toFixed(1)}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
