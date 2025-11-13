"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "./auth/auth-page"
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { SubjectManagementProvider } from "@/lib/subject-management-context"
import { ExaminationProvider } from "@/lib/examination-context"
import { FinancialProvider } from "@/lib/financial-context"
import { ProfileProvider } from "@/lib/profile-context"
import { TeacherClassesProvider } from "@/lib/teacher-classes-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { BursarProvider } from "@/lib/bursar-context"
import { TimetableProvider } from "@/lib/timetable-context"
import { useNotifications } from "@/lib/notification-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { formatCurrency } from "@/lib/currency-utils"

// Context hooks for data fetching
import { useStudentManagement } from "@/lib/student-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useClassManagement } from "@/lib/class-management-context"
import { useFinancial } from "@/lib/financial-context"

// Admin Components
import { UserManagement } from "./admin/user-management"
import { StudentManagement } from "./admin/student-management"
import { TeacherManagement } from "./admin/teacher-management"
import { ClassManagement } from "./admin/class-management"
import { SubjectManagement } from "./admin/subject-management"
import { ExaminationManagement } from "./admin/examination-management"
import { TimetableManagement } from "./admin/timetable-management"
import { FinancialManagement } from "./admin/financial-management"
import { AppConfiguration } from "./admin/app-configuration"
import { ProfileSettings } from "./profile/profile-settings"
import { BursarProfile } from "./bursar/bursar-profile"
import { RecentActivities } from "./admin/recent-activities"
import { Dashboard01 } from "./dashboard-01"
import { QuickActionsDashboard } from "./admin/quick-actions-dashboard"

// Teacher Components
import { TeacherDashboard } from "./teacher/teacher-dashboard"
import { TeacherClassesView } from "./teacher/teacher-classes-view"
import { GradesManagement } from "./teacher/grades-management"
import { TeacherAssignmentManagement } from "./teacher/teacher-assignment-management"
import { TeacherExaminationManagement } from "./teacher/examination-management"
import { TeacherAssignmentsView } from "./teacher/teacher-assignments-view"

// Parent Components
import { ParentDashboard } from "./parent/parent-dashboard"
import { ParentCommunication } from "./parent/parent-communication"
import { ParentChildRecords } from "./parent/parent-child-records"

// Student Components
import { StudentDashboard } from "./student/student-dashboard"
import { StudentGradesView } from "./student/student-grades-view"
import { StudentScheduleView } from "./student/student-schedule-view"
import { StudentAssignmentsView } from "./student/student-assignments-view"

// Bursar Components
import { BursarDashboard } from "./bursar/bursar-dashboard"
import { FinancialReports } from "./bursar/financial-reports"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderTitle,
  SidebarHeaderDescription,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar-07"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { SchoolBranding } from "@/components/ui/school-branding"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  MessageSquare,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CalendarDays,
  Download,
  Award,
  RefreshCw,
} from "lucide-react"

type AdminView =
  | "quick-actions"
  | "users"
  | "students"
  | "teachers"
  | "classes"
  | "subjects"
  | "timetable"
  | "examinations"
  | "financial"
  | "configuration"
  | "profile"

type TeacherView = "dashboard" | "classes" | "grades" | "assignments" | "my-assignments" | "examinations" | "profile"

type ParentView = "dashboard" | "records" | "communication" | "profile"

type StudentView = "dashboard" | "grades" | "schedule" | "assignments" | "fees" | "profile"

type BursarView = "dashboard" | "financial" | "reports" | "profile"

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: "New Student Enrollment",
    message: "John Doe has been enrolled in Form 5A",
    type: "info" as const,
    time: "2 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment Received",
            message: "School fees payment of XOF 150,000 received from Marie Ngozi",
    type: "success" as const,
    time: "1 hour ago",
    read: false,
  },
  {
    id: 4,
    title: "Exam Schedule Updated",
    message: "First term examination dates have been modified",
    type: "info" as const,
    time: "1 day ago",
    read: true,
  },
  {
    id: 5,
    title: "System Maintenance",
    message: "Scheduled maintenance completed successfully",
    type: "success" as const,
    time: "2 days ago",
    read: true,
  },
]

// Notification Component
function NotificationDropdown() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-muted/50 hover:bg-muted"
                      : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? "text-blue-900" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full bg-transparent" size="sm">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// User Profile Dropdown Component
function UserProfileDropdown({
  user,
  onProfileClick,
  onLogout,
}: {
  user: any
  onProfileClick: () => void
  onLogout: () => void
}) {
  return (
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
        <DropdownMenuItem onClick={onProfileClick}>
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
  )
}

// Enhanced Header Component
function DashboardHeader({
  user,
  onProfileClick,
  onLogout,
}: {
  user: any
  onProfileClick: () => void
  onLogout: () => void
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 right-0 left-[var(--sidebar-width)] z-40">
      <div className="flex items-center gap-2 px-4">
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4">
        <ThemeToggle />
        <NotificationDropdown />
        <UserProfileDropdown user={user} onProfileClick={onProfileClick} onLogout={onLogout} />
      </div>
    </header>
  )
}

interface QuickActionsDashboardProps {
  onNavigate?: (view: AdminView) => void
}

interface ParentDashboardProps {
  onNavigate?: (view: ParentView) => void
}

interface StudentDashboardProps {
  onNavigate?: (view: StudentView) => void
}

interface TeacherDashboardProps {
  onNavigate?: (view: TeacherView) => void
}

interface BursarDashboardProps {
  onNavigate?: (view: BursarView) => void
}

export function Dashboard() {
  const { user, logout: originalLogout } = useAuth()
  
  // Custom logout function that clears localStorage
  const handleLogout = () => {
    // Clear all stored view states
    localStorage.removeItem('adminCurrentView')
    localStorage.removeItem('teacherCurrentView')
    localStorage.removeItem('parentCurrentView')
    localStorage.removeItem('studentCurrentView')
    localStorage.removeItem('bursarCurrentView')
    
    // Call the original logout function
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
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Update CSS variable when sidebar state changes
  useEffect(() => {
    if (sidebarCollapsed) {
      document.documentElement.style.setProperty('--sidebar-width', '4rem')
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '18rem')
    }
  }, [sidebarCollapsed])
  
  // Get data from contexts for Admin Dashboard
  const { students, isLoading: studentsLoading, error: studentsError } = useStudentManagement()
  const { teachers, isLoading: teachersLoading, error: teachersError } = useTeacherManagement()
  const { classes, isLoading: classesLoading, error: classesError } = useClassManagement()
  const { payments, isLoading: paymentsLoading } = useFinancial()
  
  // Calculate total revenue from payments
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  
  // Check if any data is still loading
  const isDataLoading = studentsLoading || teachersLoading || classesLoading || paymentsLoading
  
  // Check if there are any errors
  const hasErrors = studentsError || teachersError || classesError

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



  // Parent Dashboard
  if (user.role === "parent") {
    const parentMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "records", label: "Child's Records", icon: FileText },
      { id: "communication", label: "Communication", icon: MessageSquare },
    ]

    const renderParentContent = () => {
      switch (parentCurrentView) {
        case "records":
          return <ParentChildRecords />
        case "communication":
          return <ParentCommunication />
        case "profile":
          return <ProfileSettings />
        default:
          return <ParentDashboard onNavigate={(view: string) => setParentCurrentView(view as ParentView)} />
      }
    }

    return (
      <ProfileProvider>
        <div className="flex h-screen">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={setSidebarCollapsed}
            className="border-r border-border/50"
          >
            <SidebarHeader>
              <SidebarHeaderTitle>
                <SchoolBranding 
                  showSubtitle={true}
                  subtitle="Parent Portal"
                  collapsed={sidebarCollapsed}
                />
              </SidebarHeaderTitle>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Parent Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {parentMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setParentCurrentView(item.id as ParentView)}
                        isActive={parentCurrentView === item.id}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
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
                      <SidebarMenuButton
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <UserAvatar user={user} size="sm" className="rounded-lg" />
                        {!sidebarCollapsed && (
                          <>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-semibold">{user.name}</span>
                              <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronUp className="ml-auto size-4" />
                          </>
                        )}
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
                      <DropdownMenuItem onClick={() => setParentCurrentView("profile")}>
                        <Settings />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <div className="flex-1 flex flex-col">
                         <DashboardHeader 
               user={user} 
               onProfileClick={() => setParentCurrentView("profile")} 
               onLogout={handleLogout}
             />
            <div className="flex flex-1 flex-col gap-4 p-6 pt-0 ml-4">{renderParentContent()}</div>
          </div>
        </div>
      </ProfileProvider>
    )
  }

  // Student Dashboard
  if (user.role === "student") {
    const studentMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "grades", label: "Grades", icon: Award },
      { id: "schedule", label: "Schedule", icon: Calendar },
      { id: "assignments", label: "Assignments", icon: BookOpen },
      { id: "fees", label: "Fees", icon: CreditCard },
    ]

    const renderStudentContent = () => {
      switch (studentCurrentView) {
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
    }

    return (
      <ProfileProvider>
        <div className="flex h-screen">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={setSidebarCollapsed}
            className="border-r border-border/50"
          >
            <SidebarHeader>
              <SidebarHeaderTitle>
                <SchoolBranding 
                  showSubtitle={true}
                  subtitle="Student Portal"
                  collapsed={sidebarCollapsed}
                />
              </SidebarHeaderTitle>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Student Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {studentMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setStudentCurrentView(item.id as StudentView)}
                        isActive={studentCurrentView === item.id}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
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
                      <SidebarMenuButton
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <UserAvatar user={user} size="sm" className="rounded-lg" />
                        {!sidebarCollapsed && (
                          <>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-semibold">{user.name}</span>
                              <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronUp className="ml-auto size-4" />
                          </>
                        )}
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
                      <DropdownMenuItem onClick={() => setStudentCurrentView("profile")}>
                        <Settings />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <div className="flex-1 flex flex-col">
                         <DashboardHeader 
               user={user} 
               onProfileClick={() => setStudentCurrentView("profile")} 
               onLogout={handleLogout}
             />
            <div className="flex flex-1 flex-col gap-4 p-6 pt-0 ml-4">{renderStudentContent()}</div>
          </div>
        </div>
      </ProfileProvider>
    )
  }

  // Admin Dashboard
  if (user.role === "admin") {
    const adminMenuItems = [
      { id: "quick-actions", label: "Dashboard", icon: Home },
      { id: "users", label: "User Management", icon: Users },
      { id: "students", label: "Student Management", icon: GraduationCap },
      { id: "teachers", label: "Teacher Management", icon: UserCheck },
      { id: "classes", label: "Class Management", icon: BookOpen },
      { id: "subjects", label: "Manage Subjects", icon: BookOpen },
      { id: "timetable", label: "Timetable Management", icon: CalendarDays },
      { id: "examinations", label: "Examinations", icon: FileText },
      { id: "financial", label: "Financial Management", icon: DollarSign },
      { id: "configuration", label: "App Configuration", icon: Settings },
    ]

    const renderAdminContent = () => {
      switch (adminCurrentView) {
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
        case "subjects":
          return (
            <SubjectManagementProvider>
              <SubjectManagement />
            </SubjectManagementProvider>
          )
        case "timetable":
          return (
            <TimetableProvider>
              <TimetableManagement />
            </TimetableProvider>
          )
        case "examinations":
          return (
            <ExaminationProvider>
              <ExaminationManagement />
            </ExaminationProvider>
          )
        case "financial":
          return <FinancialManagement />
        case "configuration":
          return <AppConfiguration />
        case "profile":
          return <ProfileSettings />
        default:
          return <QuickActionsDashboard onNavigate={(view: string) => setAdminCurrentView(view as AdminView)} />
      }
    }

    return (
      <UserManagementProvider>
        <StudentEnrollmentProvider>
          <StudentManagementProvider>
            <TeacherManagementProvider>
              <ClassManagementProvider>
                <SubjectManagementProvider>
                  <ExaminationProvider>
                    <FinancialProvider>
                      <ProfileProvider>
                        <div className="flex h-screen">
                            <Sidebar 
                              collapsed={sidebarCollapsed} 
                              onCollapsedChange={setSidebarCollapsed}
                              className="border-r border-border/50 fixed left-0 top-0 h-full z-50"
                            >
                              <SidebarHeader>
                                <SidebarHeaderTitle>
                                  <SchoolBranding 
                                    showSubtitle={true}
                                    subtitle="Admin Panel"
                                    collapsed={sidebarCollapsed}
                                  />
                                </SidebarHeaderTitle>
                              </SidebarHeader>
                              <SidebarContent>
                                <SidebarGroup>
                                  <SidebarGroupLabel>Management</SidebarGroupLabel>
                                  <SidebarMenu>
                                    {adminMenuItems.map((item) => (
                                      <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                          onClick={() => setAdminCurrentView(item.id as AdminView)}
                                          isActive={adminCurrentView === item.id}
                                          className="hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                          <item.icon className="h-4 w-4" />
                                          {!sidebarCollapsed && <span>{item.label}</span>}
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
                                        <SidebarMenuButton
                                          className="hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                          <UserAvatar user={user} size="sm" className="rounded-lg" />
                                          {!sidebarCollapsed && (
                                            <>
                                              <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">{user.name}</span>
                                                <span className="truncate text-xs">{user.email}</span>
                                              </div>
                                              <ChevronUp className="ml-auto size-4" />
                                            </>
                                          )}
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
                                        <DropdownMenuItem onClick={() => setAdminCurrentView("profile")}>
                                          <Settings />
                                          Profile Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}>
                                          <LogOut />
                                          Log out
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </SidebarMenuItem>
                                </SidebarMenu>
                              </SidebarFooter>
                            </Sidebar>
                            <div className="flex-1 flex flex-col ml-[var(--sidebar-width)]">
                              <DashboardHeader
                                user={user}
                                onProfileClick={() => setAdminCurrentView("profile")}
                                onLogout={handleLogout}
                              />
                              <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderAdminContent()}</div>
                            </div>
                          </div>
                        </ProfileProvider>
                      </FinancialProvider>
                </ExaminationProvider>
              </SubjectManagementProvider>
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
      { id: "my-assignments", label: "My Assignments", icon: BookOpen },
      { id: "classes", label: "My Classes", icon: Users },
      { id: "grades", label: "Grades", icon: ClipboardList },
      { id: "assignments", label: "Assignments", icon: Award },
    ]

    const renderTeacherContent = () => {
      switch (teacherCurrentView) {
        case "my-assignments":
          return <TeacherAssignmentsView />
        case "classes":
          return <TeacherClassesView />
        case "grades":
          return <GradesManagement />
        case "assignments":
          return <TeacherAssignmentManagement />
        case "examinations":
          return <TeacherExaminationManagement />
        case "profile":
          return <ProfileSettings />
        default:
          return <TeacherDashboard onNavigate={(view: string) => setTeacherCurrentView(view as TeacherView)} />
      }
    }

    return (
      <TeacherClassesProvider>
          <TeacherGradesProvider>
            <ProfileProvider>
              <div className="flex h-screen">
                <Sidebar 
                  collapsed={sidebarCollapsed} 
                  onCollapsedChange={setSidebarCollapsed}
                  className="border-r border-border/50 fixed left-0 top-0 h-full z-50"
                >
                  <SidebarHeader>
                    <SidebarHeaderTitle>
                      <SchoolBranding 
                        showSubtitle={true}
                        subtitle="Teacher Portal"
                        collapsed={sidebarCollapsed}
                      />
                    </SidebarHeaderTitle>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarGroup>
                      <SidebarGroupLabel>Teaching</SidebarGroupLabel>
                      <SidebarMenu>
                        {teacherMenuItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => setTeacherCurrentView(item.id as TeacherView)}
                              isActive={teacherCurrentView === item.id}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              {!sidebarCollapsed && <span>{item.label}</span>}
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
                            <SidebarMenuButton
                              className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <UserAvatar user={user} size="sm" className="rounded-lg" />
                              {!sidebarCollapsed && (
                                <>
                                  <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                  </div>
                                  <ChevronUp className="ml-auto size-4" />
                                </>
                              )}
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
                            <DropdownMenuItem onClick={() => setTeacherCurrentView("profile")}>
                              <Settings />
                              Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                              <LogOut />
                              Log out
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarFooter>
                </Sidebar>
                <div className="flex-1 flex flex-col ml-[var(--sidebar-width)]">
                  <DashboardHeader
                    user={user}
                    onProfileClick={() => setTeacherCurrentView("profile")}
                    onLogout={handleLogout}
                  />
                  <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderTeacherContent()}</div>
                </div>
              </div>
            </ProfileProvider>
          </TeacherGradesProvider>
        </TeacherClassesProvider>
    )
  }

  // Bursar Dashboard
  if (user.role === "bursar") {
    const bursarMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "financial", label: "Fee Management", icon: DollarSign },
      { id: "reports", label: "Financial Reports", icon: BarChart3 },
    ]

    const renderBursarContent = () => {
      switch (bursarCurrentView) {
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
    }

    return (
      <BursarProvider>
        <ProfileProvider>
          <div className="flex h-screen">
            <Sidebar 
              collapsed={sidebarCollapsed} 
              onCollapsedChange={setSidebarCollapsed}
              className="border-r border-border/50 fixed left-0 top-0 h-full z-50"
            >
              <SidebarHeader>
                <SidebarHeaderTitle>
                  <SchoolBranding 
                    showSubtitle={true}
                    subtitle="Bursar Portal"
                    collapsed={sidebarCollapsed}
                  />
                </SidebarHeaderTitle>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
                  <SidebarMenu>
                    {bursarMenuItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setBursarCurrentView(item.id as BursarView)}
                          isActive={bursarCurrentView === item.id}
                          className="hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <item.icon className="h-4 w-4" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
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
                        <SidebarMenuButton
                          className="hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <UserAvatar user={user} size="sm" className="rounded-lg" />
                          {!sidebarCollapsed && (
                            <>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                              </div>
                              <ChevronUp className="ml-auto size-4" />
                            </>
                          )}
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
                        <DropdownMenuItem onClick={() => setBursarCurrentView("profile")}>
                          <Settings />
                          Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <div className="flex-1 flex flex-col ml-[var(--sidebar-width)]">
              <DashboardHeader 
                user={user} 
                onProfileClick={() => setBursarCurrentView("profile")} 
                onLogout={handleLogout}
              />
              <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderBursarContent()}</div>
            </div>
          </div>
        </ProfileProvider>
      </BursarProvider>
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
          <Button onClick={handleLogout} className="w-full justify-start bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
