"use client"

import { useAppConfiguration, useSchoolName, useSchoolLogo, useThemeColors } from "@/lib/app-configuration-context-v2"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function TestContextV2Page() {
  try {
    const { configuration, isLoading, error } = useAppConfiguration()
    const schoolName = useSchoolName()
    const schoolLogo = useSchoolLogo()
    const themeColors = useThemeColors()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading configuration...</span>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Context V2 Test</h1>
            <p className="text-muted-foreground">
              Testing the v2 configuration context
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            V2 Working
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>
              Current status of the v2 configuration system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {error ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Error
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Working
                </Badge>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">School Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {schoolName}</div>
                  <div><strong>Logo URL:</strong> {schoolLogo.url}</div>
                  <div><strong>Logo Alt:</strong> {schoolLogo.alt}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Theme Colors</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: themeColors.primary }}
                    />
                    <span><strong>Primary:</strong> {themeColors.primary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: themeColors.secondary }}
                    />
                    <span><strong>Secondary:</strong> {themeColors.secondary}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Raw Configuration</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(configuration, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Context Error
            </CardTitle>
            <CardDescription>
              The v2 context is not working properly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
