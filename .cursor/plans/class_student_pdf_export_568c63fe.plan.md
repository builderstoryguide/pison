---
name: Class Student PDF Export
overview: Add a server-side PDF export for class student lists and expose download actions in both the class details and manage-students dialogs. Reuse existing PDF generation patterns for consistent file download behavior.
todos:
  - id: add-class-pdf-route
    content: Implement class roster PDF API route under app/api/classes/[classId]/students/pdf/route.ts
    status: completed
  - id: create-class-pdf-generator
    content: Add reusable class-list PDF generation helper in lib/
    status: completed
  - id: add-client-export-hook
    content: Create hook to call route and trigger browser download with loading/toast
    status: completed
  - id: wire-button-manage-students
    content: Add export button in class-student-management dialog
    status: completed
  - id: wire-button-class-details
    content: Add export button in class-details-dialog
    status: completed
  - id: validate-and-lint
    content: Verify export behavior and run lints on edited files
    status: completed
isProject: false
---

# Implement Class Student List PDF Download

## Scope

Enable admins to open any class (e.g., Form 1 BC) and download that class’s current student list as a PDF from:

- the manage students dialog
- the class details dialog

## Implementation Steps

- Add a dedicated export API route at [app/api/classes/[classId]/students/pdf/route.ts](app/api/classes/[classId]/students/pdf/route.ts) that:
  - validates `classId`
  - fetches class metadata + enrolled students (ordered by student name or student_id)
  - builds print-friendly HTML for a class roster
  - generates PDF using existing Puppeteer path (reuse [lib/pdf-generator.ts](lib/pdf-generator.ts) patterns)
  - returns `application/pdf` with `Content-Disposition: attachment` and filename like `class-list-form-1-bc-YYYY-MM-DD.pdf`
- Create a small reusable helper in [lib/class-list-pdf-generator.ts](lib/class-list-pdf-generator.ts) (or extend existing generator module) to keep route code simple:
  - input: class info + students
  - output: PDF buffer (and HTML fallback if Puppeteer fails, aligned with current export behavior)
- Add a lightweight client download helper in [hooks/use-class-list-pdf-export.ts](hooks/use-class-list-pdf-export.ts):
  - `exportClassListPdf(classId, className)`
  - follows current blob download pattern from [hooks/use-pdf-export.ts](hooks/use-pdf-export.ts)
  - includes loading/error toast states
- Integrate download button in [components/admin/class-student-management.tsx](components/admin/class-student-management.tsx):
  - add `Download Class List (PDF)` action near existing dialog actions
  - disable while students are loading/export is in progress
- Integrate the same download action in [components/admin/class-details-dialog.tsx](components/admin/class-details-dialog.tsx):
  - place in top actions/footer area for quick access
  - reuse the same hook for consistent behavior
- Ensure the exported roster includes essential columns (Name, Student ID, Status, optionally Email) and context fields (Class name, Academic Year if available, Generated date, Total students).

## Validation

- Manual checks:
  - open class dialogs for at least two classes and download PDF successfully
  - verify filename includes class name/date
  - verify students in PDF match the UI list count/order
  - verify empty-class behavior (PDF still generated with “No students enrolled” state)
- Run lint checks on touched files and fix any introduced issues.

