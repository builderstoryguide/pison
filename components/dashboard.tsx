"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "./auth/auth-page"
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { ExaminationProvider } from "@/lib/examination-context"
import { FinancialProvider } from "@/lib/financial-context"
import { AttendanceProvider } from "@/lib/attendance-context"
import { ReportsAnalyticsProvider } from "@/lib/reports-analytics-context"
import { ProfileProvider } from "@/lib/profile-context"
import { TeacherAttendanceProvider } from "@/lib/teacher-attendance-context"
import { TeacherClassesProvider } from "@/lib/teacher-classes-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"

// Admin Components
import { UserManagement } from "./admin/user-management"
import { StudentManagement } from "./admin/student-management"
import { TeacherManagement } from "./admin/teacher-management"
import { ClassManagement } from "./admin/class-management"
import { ExaminationManagement } from "./admin/examination-management"
import { FinancialManagement } from "./admin/financial-management"
import { AttendanceManagement } from "./admin/attendance-management"
import { ReportsAnalyticsManagement } from "./admin/reports-analytics-management"
import { ProfileSettings } from "./profile/profile-settings"

// Teacher Components
import { TeacherDashboard } from "./teacher/teacher-dashboard"
import { TeacherClassesView } from "./teacher/teacher-classes-view"
import { GradesManagement } from "./teacher/grades-management"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Icons
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Home,
  ChevronUp,
  UserPlus,
  School,
  ClipboardList,
  CreditCard,
  CalendarCheck,
} from "lucide-react"

type AdminView =
  | "dashboard"
  | "users"
  | "students"
  | "teachers"
  | "classes"
  | "examinations"
  | "financial"
  | "attendance"
  | "reports"
  | "profile"

type TeacherView = "dashboard" | "classes" | "attendance" | "grades" | "profile"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [adminCurrentView, setAdminCurrentView] = useState<AdminView>("dashboard")
  const [teacherCurrentView, setTeacherCurrentView] = useState<TeacherView>("dashboard")

  if (!user) {
    return <AuthPage />
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Admin Dashboard
  if (user.role === "admin") {
    const adminMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "users", label: "User Management", icon: Users },
      { id: "students", label: "Student Management", icon: GraduationCap },
      { id: "teachers", label: "Teacher Management", icon: UserCheck },
      { id: "classes", label: "Class Management", icon: BookOpen },
      { id: "examinations", label: "Examinations", icon: FileText },
      { id: "financial", label: "Financial Management", icon: DollarSign },
      { id: "attendance", label: "Attendance", icon: Calendar },
      { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    ]

    const renderAdminContent = () => {
      switch (adminCurrentView) {
        case "users":
          return <UserManagement />
        case "students":
          return <StudentManagement />
        case "teachers":
          return <TeacherManagement />
        case "classes":
          return <ClassManagement />
        case "examinations":
          return <ExaminationManagement />
        case "financial":
          return <FinancialManagement />
        case "attendance":
          return <AttendanceManagement />
        case "reports":
          return <ReportsAnalyticsManagement />
        case "profile":
          return <ProfileSettings />
        default:
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}! Manage your school system from here.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-xs text-muted-foreground">+5 new this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">Across all levels</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,231</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="ml-2 space-y-1">
                          <p className="text-sm font-medium leading-none">New student enrolled</p>
                          <p className="text-sm text-muted-foreground">Marie Ngozi joined Form 5A</p>
                        </div>
                        <div className="ml-auto font-medium">2 min ago</div>
                      </div>
                      <div className="flex items-center">
                        <School className="mr-2 h-4 w-4 text-green-500" />
                        <div className="ml-2 space-y-1">
                          <p className="text-sm font-medium leading-none">Class created</p>
                          <p className="text-sm text-muted-foreground">Form 6 Science class added</p>
                        </div>
                        <div className="ml-auto font-medium">1 hour ago</div>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-yellow-500" />
                        <div className="ml-2 space-y-1">
                          <p className="text-sm font-medium leading-none">Payment received</p>
                          <p className="text-sm text-muted-foreground">School fees payment processed</p>
                        </div>
                        <div className="ml-auto font-medium">3 hours ago</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("students")}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll New Student
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("teachers")}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Add New Teacher
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("classes")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create New Class
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("reports")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
      }
    }

    return (
      <UserManagementProvider>
        <StudentEnrollmentProvider>
          <StudentManagementProvider>
            <TeacherManagementProvider>
              <ClassManagementProvider>
                <ExaminationProvider>
                  <FinancialProvider>
                    <AttendanceProvider>
                      <ReportsAnalyticsProvider>
                        <ProfileProvider>
                          <SidebarProvider>
                            <Sidebar variant="inset">
                              <SidebarHeader>
                                <SidebarMenu>
                                  <SidebarMenuItem>
                                    <div className="flex items-center gap-2 px-2 py-1">
                                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <School className="size-4" />
                                      </div>
                                      <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">GBHS Yaoundé</span>
                                        <span className="truncate text-xs">Admin Panel</span>
                                      </div>
                                    </div>
                                  </SidebarMenuItem>
                                </SidebarMenu>
                              </SidebarHeader>
                              <SidebarContent>
                                <SidebarGroup>
                                  <SidebarGroupLabel>Management</SidebarGroupLabel>
                                  <SidebarGroupContent>
                                    <SidebarMenu>
                                      {adminMenuItems.map((item) => (
                                        <SidebarMenuItem key={item.id}>
                                          <SidebarMenuButton
                                            onClick={() => setAdminCurrentView(item.id as AdminView)}
                                            isActive={adminCurrentView === item.id}
                                          >
                                            <item.icon />
                                            <span>{item.label}</span>
                                          </SidebarMenuButton>
                                        </SidebarMenuItem>
                                      ))}
                                    </SidebarMenu>
                                  </SidebarGroupContent>
                                </SidebarGroup>
                              </SidebarContent>
                              <SidebarFooter>
                                <SidebarMenu>
                                  <SidebarMenuItem>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                          size="lg"
                                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                        >
                                          <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                            <AvatarFallback className="rounded-lg">
                                              {getInitials(user.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user.name}</span>
                                            <span className="truncate text-xs">{user.email}</span>
                                          </div>
                                          <ChevronUp className="ml-auto size-4" />
                                        </SidebarMenuButton>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                        side="bottom"
                                        align="end"
                                        sideOffset={4}
                                      >
                                        <DropdownMenuLabel className="p-0 font-normal">
                                          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                              <AvatarFallback className="rounded-lg">
                                                {getInitials(user.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                              <span className="truncate font-semibold">{user.name}</span>
                                              <span className="truncate text-xs">{user.email}</span>
                                            </div>
                                          </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setAdminCurrentView("profile")}>
                                          <Settings />
                                          Profile Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout}>
                                          <LogOut />
                                          Log out
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </SidebarMenuItem>
                                </SidebarMenu>
                              </SidebarFooter>
                              <SidebarRail />
                            </Sidebar>
                            <SidebarInset>
                              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                  <SidebarTrigger className="-ml-1" />
                                  <Separator orientation="vertical" className="mr-2 h-4" />
                                  <Badge variant="outline" className="capitalize">
                                    {user.role}
                                  </Badge>
                                </div>
                              </header>
                              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderAdminContent()}</div>
                            </SidebarInset>
                          </SidebarProvider>
                        </ProfileProvider>
                      </ReportsAnalyticsProvider>
                    </AttendanceProvider>
                  </FinancialProvider>
                </ExaminationProvider>
              </ClassManagementProvider>
            </TeacherManagementProvider>
          </StudentManagementProvider>
        </StudentEnrollmentProvider>
      </UserManagementProvider>
    )
  }

  // Teacher Dashboard
  if (user.role === "teacher") {
    const teacherMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "classes", label: "My Classes", icon: BookOpen },
      { id: "attendance", label: "Attendance", icon: CalendarCheck },
      { id: "grades", label: "Grades", icon: ClipboardList },
    ]

    const renderTeacherContent = () => {
      switch (teacherCurrentView) {
        case "classes":
          return <TeacherClassesView />
        case "grades":
          return <GradesManagement />
        case "profile":
          return <ProfileSettings />
        default:
          return <TeacherDashboard onNavigate={setTeacherCurrentView} />
      }
    }

    return (
      <TeacherAttendanceProvider>
        <TeacherClassesProvider>
          <TeacherGradesProvider>
            <ProfileProvider>
              <SidebarProvider>
                <Sidebar variant="inset">
                  <SidebarHeader>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <div className="flex items-center gap-2 px-2 py-1">
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <School className="size-4" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">GBHS Yaoundé</span>
                            <span className="truncate text-xs">Teacher Portal</span>
                          </div>
                        </div>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarGroup>
                      <SidebarGroupLabel>Teaching</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {teacherMenuItems.map((item) => (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton
                                onClick={() => setTeacherCurrentView(item.id as TeacherView)}
                                isActive={teacherCurrentView === item.id}
                              >
                                <item.icon />
                                <span>{item.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </SidebarContent>
                  <SidebarFooter>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              size="lg"
                              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                              </div>
                              <ChevronUp className="ml-auto size-4" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side="bottom"
                            align="end"
                            sideOffset={4}
                          >
                            <DropdownMenuLabel className="p-0 font-normal">
                              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                  <span className="truncate font-semibold">{user.name}</span>
                                  <span className="truncate text-xs">{user.email}</span>
                                </div>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setTeacherCurrentView("profile")}>
                              <Settings />
                              Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                              <LogOut />
                              Log out
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarFooter>
                  <SidebarRail />
                </Sidebar>
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                      <SidebarTrigger className="-ml-1" />
                      <Separator orientation="vertical" className="mr-2 h-4" />
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </header>
                  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderTeacherContent()}</div>
                </SidebarInset>
              </SidebarProvider>
            </ProfileProvider>
          </TeacherGradesProvider>
        </TeacherClassesProvider>
      </TeacherAttendanceProvider>
    )
  }

  // Default fallback for other roles
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>Your role ({user.role}) does not have access to this dashboard yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={logout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
