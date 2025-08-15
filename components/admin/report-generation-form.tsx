"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, FileText, Download, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useReportsAnalytics, type ReportTemplate, type ReportParameter } from "@/lib/reports-analytics-context"

interface ReportGenerationFormProps {
  template: ReportTemplate
  onGenerate: (reportId: string) => void
  onCancel: () => void
}

export function ReportGenerationForm({ template, onGenerate, onCancel }: ReportGenerationFormProps) {
  const { generateReport } = useReportsAnalytics()
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [title, setTitle] = useState(`${template.name} - ${new Date().toLocaleDateString()}`)
  const [notes, setNotes] = useState("")
  const [format, setFormat] = useState<string>(template.outputFormats[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleParameterChange = (parameterId: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [parameterId]: value,
    }))

    // Clear error for this parameter
    if (errors[parameterId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[parameterId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    template.parameters.forEach((param) => {
      if (param.required && (!parameters[param.id] || parameters[param.id] === "")) {
        newErrors[param.id] = `${param.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validateForm()) {
      return
    }

    setIsGenerating(true)
    try {
      const reportId = await generateReport(template.id, parameters, format, title, notes)
      onGenerate(reportId)
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderParameterInput = (parameter: ReportParameter) => {
    const value = parameters[parameter.id] ?? parameter.defaultValue ?? ""
    const hasError = !!errors[parameter.id]

    switch (parameter.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
            placeholder={`Enter ${parameter.label.toLowerCase()}`}
            className={hasError ? "border-red-500" : ""}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(parameter.id, Number.parseFloat(e.target.value) || "")}
            placeholder={`Enter ${parameter.label.toLowerCase()}`}
            className={hasError ? "border-red-500" : ""}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
            className={hasError ? "border-red-500" : ""}
          />
        )

      case "select":
        return (
          <Select value={value} onValueChange={(newValue) => handleParameterChange(parameter.id, newValue)}>
            <SelectTrigger className={hasError ? "border-red-500" : ""}>
              <SelectValue placeholder={`Select ${parameter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((selectedValue: string) => {
                const option = parameter.options?.find((opt) => opt.value === selectedValue)
                return option ? (
                  <Badge key={selectedValue} variant="secondary">
                    {option.label}
                  </Badge>
                ) : null
              })}
            </div>
            <Select
              onValueChange={(newValue) => {
                if (!selectedValues.includes(newValue)) {
                  handleParameterChange(parameter.id, [...selectedValues, newValue])
                }
              }}
            >
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder={`Add ${parameter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {parameter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={selectedValues.includes(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={parameter.id}
              checked={value === true}
              onCheckedChange={(checked) => handleParameterChange(parameter.id, checked)}
            />
            <Label htmlFor={parameter.id} className="text-sm font-normal">
              Yes
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generate Report</h2>
          <p className="text-muted-foreground">{template.name}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {template.estimatedTime}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Template
          </CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Category: <Badge variant="outline">{template.category}</Badge>
            </span>
            <span>Used {template.usageCount} times</span>
            {template.lastUsed && <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure the parameters for your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Output Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {template.outputFormats.map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium">Report Parameters</h4>
            {template.parameters.map((parameter) => (
              <div key={parameter.id} className="space-y-2">
                <Label htmlFor={parameter.id} className="flex items-center gap-2">
                  {parameter.label}
                  {parameter.required && <span className="text-red-500">*</span>}
                </Label>
                {renderParameterInput(parameter)}
                {errors[parameter.id] && <p className="text-sm text-red-500">{errors[parameter.id]}</p>}
              </div>
            ))}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or comments for this report"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please fix the errors above before generating the report.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
          Cancel
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
