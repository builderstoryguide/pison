import { useState } from "react"
import { useToast } from "./use-toast"

export function useClassListPdfExport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const exportClassListPdf = async (classId: string, className: string): Promise<boolean> => {
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/classes/${classId}/students/pdf`, {
        method: "GET",
      })

      if (!response.ok) {
        let message = "Failed to generate class list"
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            message = errorData.error
          }
        } catch {
          // Keep default message when response is not JSON.
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl

      const contentDisposition = response.headers.get("Content-Disposition")
      const matchedFileName = contentDisposition?.match(/filename="(.+)"/i)?.[1]
      const fallbackFileName = `class-list-${className.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`
      link.download = matchedFileName || fallbackFileName

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("Class list downloaded", {
        description: `${className} student list has been exported.`,
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error("Failed to download class list", { description: message })
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    exportClassListPdf,
  }
}
