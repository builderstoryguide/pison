"use client"

export const dynamic = 'force-dynamic'

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReportCards } from "@/components/admin/report-cards"

export default function TestReportCardsSimplePage() {
  // Production gate - prevent this page from running in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Test Page Not Available</h1>
          <p className="text-muted-foreground">This page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Cards Test - Simple</h1>
          <p className="text-muted-foreground">
            Simplified test page for report card functionality
          </p>
        </div>
        <Button>
          Test Button
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Cards Component Test</CardTitle>
          <CardDescription>
            Testing the ReportCards component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportCards />
        </CardContent>
      </Card>
    </div>
  )
}
