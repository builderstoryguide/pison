import puppeteer from "puppeteer"

export interface ClassListInfo {
  id: string
  name: string
  schoolName?: string | null
  schoolLogoUrl?: string | null
  level?: string | null
  academicYear?: string | null
  subsystem?: string | null
  branch?: string | null
}

export interface ClassListStudent {
  id: string
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  placeOfBirth?: string | null
  parentGuardianContact?: string | null
}

export interface ClassListDocumentResult {
  buffer: Buffer
  contentType: "application/pdf" | "text/html"
  extension: "pdf" | "html"
  generator: "puppeteer" | "html-fallback"
}

export class ClassListPDFGenerator {
  private browser: any | null = null

  private async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      })
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close()
      } finally {
        this.browser = null
      }
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  private generateHtml(classInfo: ClassListInfo, students: ClassListStudent[], generatedAt: Date): string {
    const title = `Class List - ${classInfo.name}`
    const generatedAtLabel = generatedAt.toLocaleString()
    const schoolName = classInfo.schoolName || "School"

    const rowsHtml =
      students.length > 0
        ? students
            .map((student, index) => {
              const fullName = `${student.firstName} ${student.lastName}`.trim()
              const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${this.escapeHtml(fullName || "N/A")}</td>
                  <td>${this.escapeHtml(dob)}</td>
                  <td>${this.escapeHtml(student.placeOfBirth || "N/A")}</td>
                  <td>${this.escapeHtml(student.parentGuardianContact || "N/A")}</td>
                </tr>
              `
            })
            .join("")
        : `
          <tr>
            <td colspan="5" class="empty-state">No students enrolled in this class.</td>
          </tr>
        `

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${this.escapeHtml(title)}</title>
          <style>
            @page {
              size: A4;
              margin: 16mm;
            }
            body {
              font-family: "Segoe UI", Arial, sans-serif;
              color: #1f2937;
              font-size: 12px;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #1d4ed8;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .branding {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;
            }
            .branding-logo {
              width: 56px;
              height: 56px;
              object-fit: contain;
              border-radius: 6px;
              border: 1px solid #d1d5db;
              padding: 4px;
              background: #ffffff;
            }
            .branding-school {
              margin: 0;
              font-size: 14px;
              color: #111827;
              font-weight: 700;
              letter-spacing: 0.01em;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              color: #1d4ed8;
            }
            .metadata {
              margin-top: 8px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px 14px;
            }
            .metadata-item strong {
              color: #111827;
            }
            .summary {
              margin: 12px 0;
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 8px 10px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #eff6ff;
              color: #1e3a8a;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .empty-state {
              text-align: center;
              color: #6b7280;
              font-style: italic;
              padding: 16px;
            }
            .footer {
              margin-top: 12px;
              font-size: 10px;
              color: #6b7280;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="branding">
              ${
                classInfo.schoolLogoUrl
                  ? `<img src="${this.escapeHtml(classInfo.schoolLogoUrl)}" alt="${this.escapeHtml(schoolName)} logo" class="branding-logo" />`
                  : ""
              }
              <p class="branding-school">${this.escapeHtml(schoolName)}</p>
            </div>
            <h1>${this.escapeHtml(title)}</h1>
            <div class="metadata">
              <div class="metadata-item"><strong>Class:</strong> ${this.escapeHtml(classInfo.name)}</div>
              <div class="metadata-item"><strong>Level:</strong> ${this.escapeHtml(classInfo.level || "N/A")}</div>
              <div class="metadata-item"><strong>Academic Year:</strong> ${this.escapeHtml(classInfo.academicYear || "N/A")}</div>
              <div class="metadata-item"><strong>Subsystem:</strong> ${this.escapeHtml(classInfo.subsystem || "N/A")}</div>
            </div>
            <div class="metadata-item"><strong>Generated:</strong> ${this.escapeHtml(generatedAtLabel)}</div>
          </div>

          <div class="summary">Total Students: ${students.length}</div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Date of Birth</th>
                <th>Place of Birth</th>
                <th>Parent/Guardian Contact</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">Generated by School Management System</div>
        </body>
      </html>
    `
  }

  async generateClassListDocument(classInfo: ClassListInfo, students: ClassListStudent[]): Promise<ClassListDocumentResult> {
    const generatedAt = new Date()
    const html = this.generateHtml(classInfo, students, generatedAt)
    let page: any | null = null

    try {
      await this.initialize()
      if (!this.browser) {
        throw new Error("Browser not initialized")
      }

      page = await this.browser.newPage()
      await page.setContent(html, { waitUntil: "networkidle0" })

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "16mm",
          right: "16mm",
          bottom: "16mm",
          left: "16mm",
        },
      })

      return {
        buffer: pdfBuffer,
        contentType: "application/pdf",
        extension: "pdf",
        generator: "puppeteer",
      }
    } catch (error) {
      console.warn("Class list PDF generation failed. Returning HTML fallback.", error)
      return {
        buffer: Buffer.from(html, "utf-8"),
        contentType: "text/html",
        extension: "html",
        generator: "html-fallback",
      }
    } finally {
      if (page) {
        await page.close()
      }
      await this.close()
    }
  }
}

export const classListPdfGenerator = new ClassListPDFGenerator()
