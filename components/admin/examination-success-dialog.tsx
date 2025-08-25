"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ExaminationSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examinationTitle: string
  onViewExamination?: () => void
  onCreateAnother?: () => void
}

export function ExaminationSuccessDialog({
  open,
  onOpenChange,
  examinationTitle,
  onViewExamination,
  onCreateAnother,
}: ExaminationSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <DialogTitle>Examination Created Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            The examination "{examinationTitle}" has been created successfully and is now available in your examination list.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
        <DialogFooter className="flex gap-2">
          {onCreateAnother && (
            <Button variant="outline" onClick={onCreateAnother}>
              Create Another
            </Button>
          )}
          {onViewExamination && (
            <Button onClick={onViewExamination}>
              View Examination
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
