"use client"

import React from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  Settings, 
  BarChart3,
  UserCheck,
  ClipboardList,
  School,
  Home,
  Bell,
  Search
} from "lucide-react"

export default function SidebarDemoPage() {
  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">School Management Sidebar Demo</h1>
          <p className="text-lg text-muted-foreground">
            Experience the new collapsible sidebar with comprehensive school management navigation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sidebar Features
                <Badge variant="secondary">New</Badge>
              </CardTitle>
              <CardDescription>
                Key features of the sidebar implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Collapsible navigation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>School management menu</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Quick actions section</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>User profile footer</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Responsive design</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Smooth animations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Navigation Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Navigation Sections
              </CardTitle>
              <CardDescription>
                Available sections in the sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-500" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-green-500" />
                  <span>Students Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                  <span>Teachers Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-orange-500" />
                  <span>Classes & Subjects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span>Timetable</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-500" />
                  <span>Examinations</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                  <span>Reports & Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  <span>Finance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-500" />
                  <span>User Management</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Fast access to common tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Enroll New Student
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Timetable
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                How to Use the Sidebar
              </CardTitle>
              <CardDescription>
                Instructions for using the sidebar effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Collapsing the Sidebar</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Click the toggle button in the header</li>
                    <li>• Or click the chevron button on the sidebar</li>
                    <li>• Sidebar collapses to show only icons</li>
                    <li>• Hover over icons to see tooltips</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Navigation</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Click any menu item to navigate</li>
                    <li>• Sub-items appear when expanded</li>
                    <li>• Active page is highlighted</li>
                    <li>• Quick actions provide fast access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Technical Implementation
              </CardTitle>
              <CardDescription>
                Built with shadcn/ui sidebar-07 component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Components Used</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• shadcn/ui sidebar-07</li>
                    <li>• Lucide React icons</li>
                    <li>• Next.js navigation</li>
                    <li>• Tailwind CSS styling</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• TypeScript support</li>
                    <li>• Responsive design</li>
                    <li>• Smooth animations</li>
                    <li>• Accessibility compliant</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Customization</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Easy to modify menu items</li>
                    <li>• Customizable colors</li>
                    <li>• Flexible layout options</li>
                    <li>• Extensible architecture</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Sidebar Successfully Integrated!</h3>
              <p className="text-green-700 text-sm">
                The sidebar is now fully functional with all school management features. 
                Try collapsing it and navigating through the different sections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

