"use client"

export const dynamic = 'force-dynamic'

import { UserManagementProvider } from '@/lib/user-management-context'
import { StudentManagementProvider } from '@/lib/student-management-context'
import { TeacherManagementProvider } from '@/lib/teacher-management-context'
import { UserManagement } from '@/components/admin/user-management'
import { StudentManagement } from '@/components/admin/student-management'
import { TeacherManagement } from '@/components/admin/teacher-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TestDataConsistencyPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Data Consistency Test</h1>
        <p className="text-muted-foreground">
          Test and verify that student and teacher data is consistent between User Management, Student Management, and Teacher Management dashboards
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Consistency Verification</CardTitle>
          <CardDescription>
            This page demonstrates how User Management, Student Management, and Teacher Management now use the same data sources,
            ensuring consistency across all admin dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ What's Fixed:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• User Management now uses Student Management context for student counts</li>
                <li>• User Management now uses Teacher Management context for teacher counts</li>
                <li>• Student and teacher statistics are synchronized between all dashboards</li>
                <li>• Data consistency is displayed in real-time</li>
                <li>• All components show the same information</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔍 How to Test:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Navigate between the User Management, Student Management, and Teacher Management tabs below</li>
                <li>Compare the student and teacher counts in all dashboards</li>
                <li>Filter by student/teacher role in User Management to see role-specific data</li>
                <li>Verify that the numbers match between all views</li>
                <li>Check the data consistency alerts in each dashboard</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserManagementProvider>
        <StudentManagementProvider>
          <TeacherManagementProvider>
            <Tabs defaultValue="user-management" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user-management">User Management</TabsTrigger>
                <TabsTrigger value="student-management">Student Management</TabsTrigger>
                <TabsTrigger value="teacher-management">Teacher Management</TabsTrigger>
              </TabsList>

              <TabsContent value="user-management" className="space-y-4">
                <UserManagement />
              </TabsContent>

              <TabsContent value="student-management" className="space-y-4">
                <StudentManagement />
              </TabsContent>

              <TabsContent value="teacher-management" className="space-y-4">
                <TeacherManagement />
              </TabsContent>
            </Tabs>
          </TeacherManagementProvider>
        </StudentManagementProvider>
      </UserManagementProvider>
    </div>
  )
}
