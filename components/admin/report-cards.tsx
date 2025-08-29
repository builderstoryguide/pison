"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Download, Plus } from "lucide-react"

export function ReportCards() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Report Cards</h2>
        <p className="text-muted-foreground">Manage student report cards and academic transcripts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Grade 10A Report Cards</CardTitle>
                <CardDescription>End of semester report cards</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>25 Students</span>
                <span>Generated: Today</span>
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="outline">Preview</Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Grade 11B Report Cards</CardTitle>
                <CardDescription>Mid-term progress reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>18 Students</span>
                <span>Generated: Yesterday</span>
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="outline">Preview</Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Grade 9C Report Cards</CardTitle>
                <CardDescription>Quarterly assessment reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>22 Students</span>
                <span>Processing...</span>
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="outline" disabled>Preview</Button>
                <Button size="sm" disabled>Processing...</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Report Card</CardTitle>
          <CardDescription>Generate custom report cards for specific classes or students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Report Card Generator</p>
              <p className="text-sm text-muted-foreground mb-4">Create custom report cards</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
