"use client"

import React from 'react'
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
import { useAdminMarks, type Mark } from '@/lib/admin-marks-context'

interface MarkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mark: Mark | null
  onDeleted?: () => void
}

export function MarkDeleteDialog({
  open,
  onOpenChange,
  mark,
  onDeleted,
}: MarkDeleteDialogProps) {
  const { deleteMark } = useAdminMarks()

  const handleDelete = async () => {
    if (!mark) return

    const success = await deleteMark(mark.id)
    if (success) {
      onOpenChange(false)
      if (onDeleted) {
        onDeleted()
      }
    }
  }

  if (!mark) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Mark</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the mark for <strong>{mark.studentName}</strong> in{' '}
            <strong>{mark.assessmentName}</strong> ({mark.subjectName})?
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
