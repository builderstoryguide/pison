"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Clock, CheckCircle, XCircle } from "lucide-react"

export function GeneratedReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generated Reports</h2>
        <p className="text-muted-foreground">View and manage all generated reports</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium">Monthly Performance Report</h4>
              <p className="text-sm text-muted-foreground">Academic Report Template</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>Generated: 2 hours ago</span>
                <span>By: Admin User</span>
                <span>Size: 2.3 MB</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium">Financial Summary Q1</h4>
              <p className="text-sm text-muted-foreground">Financial Report Template</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>Generated: 1 day ago</span>
                <span>By: Bursar</span>
                <span>Size: 1.8 MB</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium">Student Progress Report</h4>
              <p className="text-sm text-muted-foreground">Academic Report Template</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>Generated: 5 minutes ago</span>
                <span>By: Admin User</span>
                <span>Size: Processing...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              Generating
            </Badge>
            <Button size="sm" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Processing
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Archive</CardTitle>
          <CardDescription>Access historical reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Report Archive</p>
              <p className="text-sm text-muted-foreground mb-4">Browse and download historical reports</p>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Browse Archive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
