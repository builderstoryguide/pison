"use client"

import { ExaminationProvider } from "@/lib/examination-context"
import { ExaminationManagement } from "@/components/admin/examination-management"

export default function TestExamCRUDPage() {
  return (
    <ExaminationProvider>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Examination CRUD Test Page</h1>
          <p className="text-muted-foreground">
            This page demonstrates the complete CRUD (Create, Read, Update, Delete) operations for examinations.
            As an Admin, you can:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li><strong>Create:</strong> Click the "Create Examination" button to add new examinations</li>
            <li><strong>Read:</strong> View all examinations in the table and click "View Details" for more information</li>
            <li><strong>Update:</strong> Click "Edit" on any examination to modify its details</li>
            <li><strong>Delete:</strong> Click "Delete" to remove examinations (with confirmation)</li>
          </ul>
        </div>
        
        <ExaminationManagement />
      </div>
    </ExaminationProvider>
  )
}
