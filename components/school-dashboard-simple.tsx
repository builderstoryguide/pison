"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "./auth/auth-page"
import { QuickActionsDashboard } from "./admin/quick-actions-dashboard"
import { UserManagement } from "./admin/user-management"
import { StudentManagement } from "./admin/student-management"
import { TeacherManagement } from "./admin/teacher-management"
import { ClassManagement } from "./admin/class-management"
import { ExaminationManagement } from "./admin/examination-management"
import { TimetableManagement } from "./admin/timetable-management"
import { FinancialManagement } from "./admin/financial-management"
import { ProfileSettings } from "./profile/profile-settings"
import { TeacherDashboard } from "./teacher/teacher-dashboard"
import { TeacherClassesView } from "./teacher/teacher-classes-view"
import { GradesManagement } from "./teacher/grades-management"
import { TeacherAssignmentManagement } from "./teacher/teacher-assignment-management"
import { ParentDashboard } from "./parent/parent-dashboard"
import { ParentCommunication } from "./parent/parent-communication"
import { ParentChildRecords } from "./parent/parent-child-records"
import { StudentDashboard } from "./student/student-dashboard"
import { StudentGradesView } from "./student/student-grades-view"
import { StudentScheduleView } from "./student/student-schedule-view"
import { StudentAssignmentsView } from "./student/student-assignments-view"
import { BursarDashboard } from "./bursar/bursar-dashboard"
import { FinancialReports } from "./bursar/financial-reports"
import { BursarProfile } from "./bursar/bursar-profile"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderTitle,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/ui/user-avatar"
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
  ChevronLeft,
  School,
  ClipboardList,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Bell,
  User,
  Clock,
  CalendarDays,
  Download,
  Award,
  Sun,
  Moon,
} from "lucide-react"

// Types
type AdminView =
  | "quick-actions"
  | "users"
  | "students"
  | "teachers"
  | "classes"
  | "timetable"
  | "examinations"
  | "financial"
  | "profile"

type TeacherView = "dashboard" | "classes" | "grades" | "assignments" | "profile"
type ParentView = "dashboard" | "records" | "communication" | "profile"
type StudentView = "dashboard" | "grades" | "schedule" | "assignments" | "fees" | "profile"
type BursarView = "dashboard" | "financial" | "reports" | "profile"

// Site Header Component
function SiteHeader({ user, onProfileClick, onLogout }: { 
  user: any
  onProfileClick: () => void
  onLogout: () => void
}) {
  const [isDark, setIsDark] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="-ml-1 h-9 w-9 p-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDark(!isDark)}
          className="h-9 w-9 p-0"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">1</span>
          </div>
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <UserAvatar user={user} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit mt-1 capitalize">
                  {user.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// App Sidebar Component
function AppSidebar({ 
  user, 
  currentView, 
  onViewChange, 
  onProfileClick, 
  onLogout 
}: { 
  user: any
  currentView: string
  onViewChange: (view: string) => void
  onProfileClick: () => void
  onLogout: () => void
}) {
  const getMenuItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { id: "quick-actions", label: "Dashboard", icon: Home },
          { id: "users", label: "User Management", icon: Users },
          { id: "students", label: "Student Management", icon: GraduationCap },
          { id: "teachers", label: "Teacher Management", icon: UserCheck },
          { id: "classes", label: "Class Management", icon: BookOpen },
          { id: "timetable", label: "Timetable Management", icon: CalendarDays },
          { id: "examinations", label: "Examinations", icon: FileText },
          { id: "financial", label: "Financial Management", icon: DollarSign },
        ]
      case "teacher":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "classes", label: "My Classes", icon: BookOpen },
          { id: "grades", label: "Grades", icon: ClipboardList },
          { id: "assignments", label: "Assignments", icon: Award },
        ]
      case "student":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "grades", label: "Grades", icon: Award },
          { id: "schedule", label: "Schedule", icon: Calendar },
          { id: "assignments", label: "Assignments", icon: BookOpen },
          { id: "fees", label: "Fees", icon: CreditCard },
        ]
      case "parent":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "records", label: "Child's Records", icon: FileText },
          { id: "communication", label: "Communication", icon: MessageSquare },
        ]
      case "bursar":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "financial", label: "Fee Management", icon: DollarSign },
          { id: "reports", label: "Financial Reports", icon: BarChart3 },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <SidebarHeaderTitle>
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Pison Academy</span>
              <span className="truncate text-xs capitalize">{user.role} Portal</span>
            </div>
          </div>
        </SidebarHeaderTitle>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onViewChange(item.id)}
                  isActive={currentView === item.id}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:bg-accent hover:text-accent-foreground transition-colors">
                  <UserAvatar user={user} size="sm" className="rounded-lg" />
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
                    <UserAvatar user={user} size="sm" className="rounded-lg" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick}>
                  <Settings />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// Main Dashboard Component
export function SchoolDashboard() {
  const { user, logout: originalLogout } = useAuth()
  
  // Custom logout function that clears localStorage
  const handleLogout = () => {
    localStorage.removeItem('adminCurrentView')
    localStorage.removeItem('teacherCurrentView')
    localStorage.removeItem('parentCurrentView')
    localStorage.removeItem('studentCurrentView')
    localStorage.removeItem('bursarCurrentView')
    originalLogout()
  }
  
  // Initialize view states with localStorage persistence
  const [adminCurrentView, setAdminCurrentView] = useState<AdminView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminCurrentView')
      return saved ? (saved as AdminView) : "quick-actions"
    }
    return "quick-actions"
  })
  
  const [teacherCurrentView, setTeacherCurrentView] = useState<TeacherView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacherCurrentView')
      return saved ? (saved as TeacherView) : "dashboard"
    }
    return "dashboard"
  })
  
  const [parentCurrentView, setParentCurrentView] = useState<ParentView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parentCurrentView')
      return saved ? (saved as ParentView) : "dashboard"
    }
    return "dashboard"
  })
  
  const [studentCurrentView, setStudentCurrentView] = useState<StudentView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studentCurrentView')
      return saved ? (saved as StudentView) : "dashboard"
    }
    return "dashboard"
  })
  
  const [bursarCurrentView, setBursarCurrentView] = useState<BursarView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bursarCurrentView')
      return saved ? (saved as BursarView) : "dashboard"
    }
    return "dashboard"
  })

  // Save view states to localStorage whenever they change
  useEffect(() => {
    if (user?.role === 'admin') {
      localStorage.setItem('adminCurrentView', adminCurrentView)
    }
  }, [adminCurrentView, user?.role])

  useEffect(() => {
    if (user?.role === 'teacher') {
      localStorage.setItem('teacherCurrentView', teacherCurrentView)
    }
  }, [teacherCurrentView, user?.role])

  useEffect(() => {
    if (user?.role === 'parent') {
      localStorage.setItem('parentCurrentView', parentCurrentView)
    }
  }, [parentCurrentView, user?.role])

  useEffect(() => {
    if (user?.role === 'student') {
      localStorage.setItem('studentCurrentView', studentCurrentView)
    }
  }, [studentCurrentView, user?.role])

  useEffect(() => {
    if (user?.role === 'bursar') {
      localStorage.setItem('bursarCurrentView', bursarCurrentView)
    }
  }, [bursarCurrentView, user?.role])

  if (!user) {
    return <AuthPage />
  }

  // Get current view and setter based on user role
  const getCurrentView = () => {
    switch (user.role) {
      case "admin":
        return adminCurrentView
      case "teacher":
        return teacherCurrentView
      case "parent":
        return parentCurrentView
      case "student":
        return studentCurrentView
      case "bursar":
        return bursarCurrentView
      default:
        return "dashboard"
    }
  }

  const setCurrentView = (view: string) => {
    switch (user.role) {
      case "admin":
        setAdminCurrentView(view as AdminView)
        break
      case "teacher":
        setTeacherCurrentView(view as TeacherView)
        break
      case "parent":
        setParentCurrentView(view as ParentView)
        break
      case "student":
        setStudentCurrentView(view as StudentView)
        break
      case "bursar":
        setBursarCurrentView(view as BursarView)
        break
    }
  }

  const onProfileClick = () => {
    setCurrentView("profile")
  }

  // Render content based on current view and user role
  const renderContent = () => {
    const currentView = getCurrentView()

    switch (user.role) {
      case "admin":
        switch (currentView) {
          case "quick-actions":
            return <QuickActionsDashboard onNavigate={(view: string) => setAdminCurrentView(view as AdminView)} />
          case "users":
            return <UserManagement />
          case "students":
            return <StudentManagement />
          case "teachers":
            return <TeacherManagement />
          case "classes":
            return <ClassManagement />
          case "timetable":
            return <TimetableManagement />
          case "examinations":
            return <ExaminationManagement />
          case "financial":
            return <FinancialManagement />
          case "profile":
            return <ProfileSettings />
          default:
            return <QuickActionsDashboard onNavigate={(view: string) => setAdminCurrentView(view as AdminView)} />
        }

      case "teacher":
        switch (currentView) {
          case "classes":
            return <TeacherClassesView />
          case "grades":
            return <GradesManagement />
          case "assignments":
            return <TeacherAssignmentManagement />
          case "profile":
            return <ProfileSettings />
          default:
            return <TeacherDashboard onNavigate={(view: string) => setTeacherCurrentView(view as TeacherView)} />
        }

      case "parent":
        switch (currentView) {
          case "records":
            return <ParentChildRecords />
          case "communication":
            return <ParentCommunication />
          case "profile":
            return <ProfileSettings />
          default:
            return <ParentDashboard onNavigate={(view: string) => setParentCurrentView(view as ParentView)} />
        }

      case "student":
        switch (currentView) {
          case "grades":
            return <StudentGradesView />
          case "schedule":
            return <StudentScheduleView />
          case "assignments":
            return <StudentAssignmentsView />
          case "fees":
            return <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Fees</h1>
                <p className="text-muted-foreground">View your fee information and payment history</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Fee management coming soon...</p>
                </CardContent>
              </Card>
            </div>
          case "profile":
            return <ProfileSettings />
          default:
            return <StudentDashboard onNavigate={(view: string) => setStudentCurrentView(view as StudentView)} />
        }

      case "bursar":
        switch (currentView) {
          case "financial":
            return (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">Fee Management</h1>
                  <p className="text-muted-foreground">Comprehensive tuition fee and payment management</p>
                </div>
                <BursarDashboard />
              </div>
            )
          case "reports":
            return <FinancialReports onNavigate={(view: string) => setBursarCurrentView(view as BursarView)} />
          case "profile":
            return <BursarProfile />
          default:
            return <BursarDashboard onNavigate={(view: string) => setBursarCurrentView(view as BursarView)} />
        }

      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>Your role ({user.role}) does not have access to this dashboard yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout} className="w-full justify-start bg-transparent">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        user={user}
        currentView={getCurrentView()}
        onViewChange={setCurrentView}
        onProfileClick={onProfileClick}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <SiteHeader 
          user={user}
          onProfileClick={onProfileClick}
          onLogout={handleLogout}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
