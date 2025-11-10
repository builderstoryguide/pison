"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { UserManagementProvider } from '@/lib/user-management-context'
import { StudentManagementProvider } from '@/lib/student-management-context'
import { TeacherManagementProvider } from '@/lib/teacher-management-context'
import { CreateUserForm } from '@/components/admin/create-user-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, GraduationCap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function StudentSyncTest() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
             <div className="text-center space-y-2">
         <h1 className="text-3xl font-bold">User Synchronization Test</h1>
         <p className="text-muted-foreground">
           Test and verify that students and teachers created in User Management appear in their respective management systems
         </p>
       </div>

      <Card>
        <CardHeader>
                   <CardTitle>How to Test</CardTitle>
         <CardDescription>
           This page demonstrates the synchronization between User Management and Student/Teacher Management systems.
         </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                         <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
               <h3 className="font-semibold text-blue-800 mb-2">🔍 Testing Steps:</h3>
               <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                 <li>Click "Create New User" to add a student or teacher through User Management</li>
                 <li>Fill out the form and select the appropriate role (Student or Teacher)</li>
                 <li>Check both User Management and the respective management tabs</li>
                 <li>Verify the user appears in both systems</li>
                 <li>Use the refresh button to update data</li>
               </ol>
             </div>

             <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
               <h3 className="font-semibold text-green-800 mb-2">✅ What Should Happen:</h3>
               <ul className="text-sm text-green-700 space-y-1">
                 <li>Student created in User Management → automatically appears in Student Management</li>
                 <li>Teacher created in User Management → automatically appears in Teacher Management</li>
                 <li>Both systems show the same user counts</li>
                 <li>Data remains synchronized between all views</li>
               </ul>
             </div>

                         <div className="flex gap-2">
               <Button onClick={() => setShowCreateForm(true)}>
                 <Users className="h-4 w-4 mr-2" />
                 Create New User
               </Button>
               <Button variant="outline" onClick={handleRefresh}>
                 <RefreshCw className="h-4 w-4 mr-2" />
                 Refresh Data
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>

             <Tabs defaultValue="user-management" className="space-y-4">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="user-management">User Management</TabsTrigger>
           <TabsTrigger value="student-management">Student Management</TabsTrigger>
           <TabsTrigger value="teacher-management">Teacher Management</TabsTrigger>
         </TabsList>

        <TabsContent value="user-management" className="space-y-4">
          <UserManagementProvider key={refreshKey}>
            <StudentManagementProvider>
              <TeacherManagementProvider>
                <Card>
                  <CardHeader>
                    <CardTitle>User Management - Students</CardTitle>
                    <CardDescription>
                      Students created through the user management system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Student Users</h3>
                        <Button variant="outline" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                      
                      {/* This will show the student users from User Management */}
                      <div className="text-sm text-muted-foreground">
                        Students created through User Management will appear here.
                        Check the Student Management tab to see if they're synchronized.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TeacherManagementProvider>
            </StudentManagementProvider>
          </UserManagementProvider>
        </TabsContent>

                 <TabsContent value="student-management" className="space-y-4">
           <UserManagementProvider>
             <StudentManagementProvider key={refreshKey}>
               <TeacherManagementProvider>
                 <Card>
                   <CardHeader>
                     <CardTitle>Student Management</CardTitle>
                     <CardDescription>
                       Students from the dedicated student management system
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-lg font-semibold">Student Records</h3>
                         <Button variant="outline" onClick={handleRefresh}>
                           <RefreshCw className="h-4 w-4 mr-2" />
                           Refresh
                         </Button>
                       </div>
                       
                       {/* This will show the students from Student Management */}
                       <div className="text-sm text-muted-foreground">
                         Students from the students table will appear here.
                         If synchronization is working, you should see the same students as in User Management.
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </TeacherManagementProvider>
             </StudentManagementProvider>
           </UserManagementProvider>
         </TabsContent>

         <TabsContent value="teacher-management" className="space-y-4">
           <UserManagementProvider>
             <StudentManagementProvider>
               <TeacherManagementProvider key={refreshKey}>
                 <Card>
                   <CardHeader>
                     <CardTitle>Teacher Management</CardTitle>
                     <CardDescription>
                       Teachers from the dedicated teacher management system
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-lg font-semibold">Teacher Records</h3>
                         <Button variant="outline" onClick={handleRefresh}>
                           <RefreshCw className="h-4 w-4 mr-2" />
                           Refresh
                         </Button>
                       </div>
                       
                       {/* This will show the teachers from Teacher Management */}
                       <div className="text-sm text-muted-foreground">
                         Teachers from the teachers table will appear here.
                         If synchronization is working, you should see the same teachers as in User Management.
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </TeacherManagementProvider>
             </StudentManagementProvider>
           </UserManagementProvider>
         </TabsContent>
      </Tabs>

             {/* Create User Form Dialog */}
       {showCreateForm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold">Create New User</h2>
               <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                 Close
               </Button>
             </div>
             <CreateUserForm 
               onSuccess={() => {
                 setShowCreateForm(false)
                 handleRefresh()
               }} 
             />
           </div>
         </div>
       )}
    </div>
  )
}

export default function TestStudentSyncPage() {
  return (
    <UserManagementProvider>
      <StudentManagementProvider>
        <TeacherManagementProvider>
          <StudentSyncTest />
        </TeacherManagementProvider>
      </StudentManagementProvider>
    </UserManagementProvider>
  )
}
