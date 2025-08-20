"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface UploadDebugInfoProps {
  parsedData: any[]
  validationErrors: any[]
  uploadResults: any[]
}

export function UploadDebugInfo({ parsedData, validationErrors, uploadResults }: UploadDebugInfoProps) {
  const [showDebug, setShowDebug] = useState(false)

  if (!showDebug) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDebug(true)}
        className="mt-4"
      >
        <Info className="h-4 w-4 mr-2" />
        Show Debug Info
      </Button>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Debug Information
        </CardTitle>
        <CardDescription>
          Detailed information about the upload process for troubleshooting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{parsedData.length}</div>
            <div className="text-sm text-blue-600">Parsed Records</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{validationErrors.length}</div>
            <div className="text-sm text-red-600">Validation Errors</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {uploadResults.filter(r => r.success).length}
            </div>
            <div className="text-sm text-green-600">Successful Uploads</div>
          </div>
        </div>

        {parsedData.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Parsed Data Sample (First 3 records):</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{JSON.stringify(parsedData.slice(0, 3), null, 2)}</pre>
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Validation Errors:</h4>
            <div className="space-y-2">
              {validationErrors.slice(0, 10).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    Row {error.row}: {error.field} - {error.message}
                  </AlertDescription>
                </Alert>
              ))}
              {validationErrors.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  ... and {validationErrors.length - 10} more errors
                </p>
              )}
            </div>
          </div>
        )}

        {uploadResults.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Upload Results:</h4>
            <div className="space-y-2">
              {uploadResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "✓" : "✗"}
                  </Badge>
                  <span className="text-sm">
                    Record {index + 1}: {result.success ? "Success" : `Failed - ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(false)}
        >
          Hide Debug Info
        </Button>
      </CardContent>
    </Card>
  )
}
