"use client"

import React from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TestSimplePage() {
  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Simple Test Page with Sidebar</h1>
        <p className="text-muted-foreground mb-6">
          This is a simple test page to verify the sidebar integration is working correctly.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sidebar Features
                <Badge variant="secondary">New</Badge>
              </CardTitle>
              <CardDescription>
                Features of the new sidebar implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Collapsible navigation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  School management menu items
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Quick actions section
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  User profile in footer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Responsive design
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation Items</CardTitle>
              <CardDescription>
                Available sections in the sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Dashboard</li>
                <li>• Students Management</li>
                <li>• Teachers Management</li>
                <li>• Classes & Subjects</li>
                <li>• Timetable</li>
                <li>• Examinations</li>
                <li>• Reports & Analytics</li>
                <li>• Finance</li>
                <li>• User Management</li>
                <li>• Settings</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded">
          <p className="text-green-800">✅ Sidebar integration is working correctly!</p>
        </div>
      </div>
    </SidebarLayout>
  )
}
