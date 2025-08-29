"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Clock, Download } from "lucide-react"

export function ReportTemplates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Report Templates</h2>
        <p className="text-muted-foreground">Manage and create report templates for various school reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Academic Report</CardTitle>
                  <CardDescription className="mt-1">Student academic performance report</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">Academic</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  5 minutes
                </span>
                <span>Used 45 times</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">PDF</Badge>
                <Badge variant="secondary" className="text-xs">EXCEL</Badge>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Last used: 2 days ago</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Financial Report</CardTitle>
                  <CardDescription className="mt-1">School financial summary report</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">Financial</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  3 minutes
                </span>
                <span>Used 23 times</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">PDF</Badge>
                <Badge variant="secondary" className="text-xs">CSV</Badge>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Last used: 1 week ago</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Attendance Report</CardTitle>
                  <CardDescription className="mt-1">Student attendance tracking report</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">Attendance</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  2 minutes
                </span>
                <span>Used 67 times</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">PDF</Badge>
                <Badge variant="secondary" className="text-xs">EXCEL</Badge>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Last used: Today</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>Design custom report templates for your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Template Builder</p>
              <p className="text-sm text-muted-foreground mb-4">Create custom report templates</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
