"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "./auth/auth-page"
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider, useStudentManagement } from "@/lib/student-management-context"
import { TeacherManagementProvider, useTeacherManagement } from "@/lib/teacher-management-context"
import { EmployeeManagementProvider } from "@/lib/employee-management-context"
import { ClassManagementProvider, useClassManagement } from "@/lib/class-management-context"
import { SubjectManagementProvider } from "@/lib/subject-management-context"
import { FinancialProvider } from "@/lib/financial-context"
import { ProfileProvider } from "@/lib/profile-context"
import { AlertsProvider } from "@/lib/alerts-context"
import { BursarProvider } from "@/lib/bursar-context"

import { useNotifications } from "@/lib/notification-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCurrencyFormatter } from "@/lib/app-configuration-context-v2"

// Admin Components
import { UserManagement } from "./admin/user-management"
import { StudentManagement } from "./admin/student-management"
import { StudentIdCards } from "./admin/student-id-cards"
import { ReportCards } from "./admin/report-cards-backup"
import { TeacherManagement } from "./admin/teacher-management"
import { EmployeeManagement } from "./admin/employee-management"
import { ClassManagement } from "./admin/class-management"
import { SubjectManagement } from "./admin/subject-management"


import { SalesManagement } from "./admin/sales-management"
import { ExpenditureManagement } from "./admin/expenditure-management"
import { PaymentManagement } from "./admin/payment-management"
import { AppConfiguration } from "./admin/app-configuration"
import { Alerts } from "./admin/alerts"
import { FinancialReports as AdminFinancialReports } from "./admin/financial-reports"
import { AcademicReports } from "./admin/academic-reports"
import { ProfileSettings } from "./profile/profile-settings"
import { BursarProfile } from "./bursar/bursar-profile"
import { QuickActionsDashboard } from "./admin/quick-actions-dashboard"

// Teacher Components
import { TeacherDashboardNew as TeacherDashboard } from "./teacher/teacher-dashboard-new"
import { ClassGradeEntry } from "./teacher/class-grade-entry"
import { GradesHistory } from "./teacher/grades-history"

// Parent Components
import { ParentDashboard } from "./parent/parent-dashboard"
import { ParentCommunication } from "./parent/parent-communication"
import { ParentChildRecords } from "./parent/parent-child-records"
import { ParentAlerts } from "./parent/parent-alerts"

// Student Components
import { StudentDashboard } from "./student/student-dashboard"

// Bursar Components
import { BursarDashboard } from "./bursar/bursar-dashboard"
import { FinancialReports } from "./bursar/financial-reports"

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar-08"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserAvatar } from "@/components/ui/user-avatar"
import { SchoolBranding } from "@/components/ui/school-branding"
import { ScrollArea } from "@/components/ui/scroll-area"

// Icons
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Home,
  ChevronUp,
  MessageSquare,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  ChevronRight,
  Briefcase,
  ClipboardList,
} from "lucide-react"

type AdminView =
  | "quick-actions"
  | "users"
  | "students"
  | "students-list"
  | "student-id-cards"
  | "report-cards"
  | "teachers"
  | "employees"
  | "classes"
  | "subjects"


  | "sales"
  | "payment"
  | "expenditures"
  | "financial-reports"
  | "academic-reports"
  | "alerts"
  | "configuration"
  | "profile"

type TeacherView = "dashboard" | "class-grades" | "grades-history" | "profile"

type ParentView = "dashboard" | "records" | "communication" | "alerts" | "profile"

type StudentView = "dashboard" | "profile"

type BursarView = "dashboard" | "financial" | "sales" | "payment" | "expenditures" | "reports" | "profile"



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



export function Dashboard() {
  const { user, logout: originalLogout } = useAuth()
  const { formatCurrency: _formatCurrency } = useCurrencyFormatter()
  
  // Custom logout function that clears localStorage
  const handleLogout = () => {
    // Clear all stored view states
    localStorage.removeItem('adminCurrentView')
    localStorage.removeItem('teacherCurrentView')
    localStorage.removeItem('parentCurrentView')
    localStorage.removeItem('studentCurrentView')
    localStorage.removeItem('bursarCurrentView')
    localStorage.removeItem('selectedClassId') // Clear selected class on logout
    
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

  // State for managing students menu collapsible open/close
  const [studentsMenuOpen, setStudentsMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminCurrentView')
      return saved === "students-list" || saved === "student-id-cards" || saved === "report-cards" || saved === "students"
    }
    return false
  })

  // Track if user manually closed the menu
  const [studentsMenuManuallyClosed, setStudentsMenuManuallyClosed] = useState(false)

  // State for managing finances menu collapsible open/close
  const [financesMenuOpen, setFinancesMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminCurrentView')
      return saved === "sales" || saved === "payment" || saved === "expenditures" || saved === "financial"
    }
    return false
  })

  // Track if user manually closed the finances menu
  const [financesMenuManuallyClosed, setFinancesMenuManuallyClosed] = useState(false)

  // State for managing reports menu collapsible open/close
  const [reportsMenuOpen, setReportsMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminCurrentView')
      return saved === "financial-reports" || saved === "academic-reports"
    }
    return false
  })

  // Track if user manually closed the reports menu
  const [reportsMenuManuallyClosed, setReportsMenuManuallyClosed] = useState(false)

  // Update students menu open state when view changes
  useEffect(() => {
    if (user?.role === "admin") {
      const isSubItemActive = adminCurrentView === "students-list" || 
                             adminCurrentView === "student-id-cards" || 
                             adminCurrentView === "report-cards" || 
                             adminCurrentView === "students"
      // Only auto-open if a sub-item is active and menu wasn't manually closed
      if (isSubItemActive && !studentsMenuManuallyClosed) {
        setStudentsMenuOpen(true)
      }
      // Reset manual close flag when navigating to a students sub-item
      if (isSubItemActive) {
        setStudentsMenuManuallyClosed(false)
      }
    }
  }, [adminCurrentView, user?.role, studentsMenuManuallyClosed])

  // Update finances menu open state when view changes
  useEffect(() => {
    if (user?.role === "admin") {
      const isSubItemActive = adminCurrentView === "sales" || 
                             adminCurrentView === "payment" || 
                             adminCurrentView === "expenditures"
      // Only auto-open if a sub-item is active and menu wasn't manually closed
      if (isSubItemActive && !financesMenuManuallyClosed) {
        setFinancesMenuOpen(true)
      }
      // Reset manual close flag when navigating to a finances sub-item
      if (isSubItemActive) {
        setFinancesMenuManuallyClosed(false)
      }
    }
  }, [adminCurrentView, user?.role, financesMenuManuallyClosed])

  // Update reports menu open state when view changes
  useEffect(() => {
    if (user?.role === "admin") {
      const isSubItemActive = adminCurrentView === "financial-reports" || 
                             adminCurrentView === "academic-reports"
      // Only auto-open if a sub-item is active and menu wasn't manually closed
      if (isSubItemActive && !reportsMenuManuallyClosed) {
        setReportsMenuOpen(true)
      }
      // Reset manual close flag when navigating to a reports sub-item
      if (isSubItemActive) {
        setReportsMenuManuallyClosed(false)
      }
    }
  }, [adminCurrentView, user?.role, reportsMenuManuallyClosed])
  
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

  // State for managing bursar finances menu collapsible open/close
  const [bursarFinancesMenuOpen, setBursarFinancesMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bursarCurrentView')
      return saved === "sales" || saved === "payment" || saved === "expenditures" || saved === "financial"
    }
    return false
  })

  // Track if user manually closed the bursar finances menu
  const [bursarFinancesMenuManuallyClosed, setBursarFinancesMenuManuallyClosed] = useState(false)

  // Initialize selected class ID state for teacher view
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedClassId') || undefined
    }
    return undefined
  })

  // Update bursar finances menu open state when view changes
  useEffect(() => {
    if (user?.role === "bursar") {
      const isSubItemActive = bursarCurrentView === "sales" || 
                             bursarCurrentView === "payment" || 
                             bursarCurrentView === "expenditures" || 
                             bursarCurrentView === "financial"
      // Only auto-open if a sub-item is active and menu wasn't manually closed
      if (isSubItemActive && !bursarFinancesMenuManuallyClosed) {
        setBursarFinancesMenuOpen(true)
      }
      // Reset manual close flag when navigating to a finances sub-item
      if (isSubItemActive) {
        setBursarFinancesMenuManuallyClosed(false)
      }
    }
  }, [bursarCurrentView, user?.role, bursarFinancesMenuManuallyClosed])
  
  // Sidebar state is now managed by SidebarProvider
  
  // Get data from contexts for Admin Dashboard
  const { isLoading: _studentsLoading, error: _studentsError } = useStudentManagement()
  const { isLoading: _teachersLoading, error: _teachersError } = useTeacherManagement()
  const { isLoading: _classesLoading, error: _classesError } = useClassManagement()

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
      { id: "alerts", label: "Alerts", icon: Bell },
    ]

    const renderParentContent = () => {
      switch (parentCurrentView) {
        case "records":
          return <ParentChildRecords />
        case "communication":
          return <ParentCommunication />
        case "alerts":
          return <ParentAlerts />
        case "profile":
          return <ProfileSettings />
        default:
          return <ParentDashboard onNavigate={(view: string) => setParentCurrentView(view as ParentView)} />
      }
    }

    function ParentSidebarContent() {
      const { state } = useSidebar()
      const collapsed = state === "collapsed"
      
      return (
        <>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Parent Portal"
                collapsed={collapsed}
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
                    <SidebarMenuButton
                      className="hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <UserAvatar user={user} size="sm" className="rounded-lg" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
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
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
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
        </>
      )
    }

    return (
      <ProfileProvider>
        <AlertsProvider>
          <SidebarProvider>
            <Sidebar 
              collapsible="icon"
              className="border-r border-border/50"
            >
              <ParentSidebarContent />
            </Sidebar>
            <SidebarInset>
              <DashboardHeader 
                user={user} 
                onProfileClick={() => setParentCurrentView("profile")} 
                onLogout={handleLogout}
              />
              <div className="flex flex-1 flex-col gap-4 p-6 pt-0 ml-4">{renderParentContent()}</div>
            </SidebarInset>
          </SidebarProvider>
        </AlertsProvider>
      </ProfileProvider>
    )
  }

  // Student Dashboard
  if (user.role === "student") {
    const studentMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
    ]

    const renderStudentContent = () => {
      switch (studentCurrentView) {
        case "profile":
          return <ProfileSettings />
        default:
          return <StudentDashboard onNavigate={(view: string) => setStudentCurrentView(view as StudentView)} />
      }
    }

    function StudentSidebarContent() {
      const { state } = useSidebar()
      const collapsed = state === "collapsed"
      
      return (
        <>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Student Portal"
                collapsed={collapsed}
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
                    <SidebarMenuButton
                      className="hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <UserAvatar user={user} size="sm" className="rounded-lg" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
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
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
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
        </>
      )
    }

    return (
      <ProfileProvider>
        <SidebarProvider>
          <Sidebar 
            collapsible="icon"
            className="border-r border-border/50"
          >
            <StudentSidebarContent />
          </Sidebar>
          <SidebarInset>
            <DashboardHeader 
              user={user} 
              onProfileClick={() => setStudentCurrentView("profile")} 
              onLogout={handleLogout}
            />
            <div className="flex flex-1 flex-col gap-4 p-6 pt-0 ml-4">{renderStudentContent()}</div>
          </SidebarInset>
        </SidebarProvider>
      </ProfileProvider>
    )
  }

  // Admin Dashboard
  if (user.role === "admin") {
    const adminMenuItems: Array<{
      id: string
      label: string
      icon: any
      subItems?: Array<{ id: string; label: string }>
    }> = [
      { id: "quick-actions", label: "Dashboard", icon: Home },
      { id: "users", label: "Manage Users", icon: Users },
      {
        id: "students",
        label: "Manage Students",
        icon: GraduationCap,
        subItems: [
          { id: "students-list", label: "Students" },
          { id: "student-id-cards", label: "Student ID" },
          { id: "report-cards", label: "Report cards" },
        ],
      },
      { id: "teachers", label: "Manage Teachers", icon: UserCheck },
      { id: "employees", label: "Manage Employees", icon: Briefcase },
      { id: "classes", label: "Manage Classes", icon: BookOpen },
      { id: "subjects", label: "Manage Subjects", icon: BookOpen },

      {
        id: "financial",
        label: "Finances",
        icon: DollarSign,
        subItems: [

          { id: "sales", label: "Sales" },
          { id: "payment", label: "Fees Payment" },
          { id: "expenditures", label: "Expenditures" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        icon: BarChart3,
        subItems: [
          { id: "financial-reports", label: "Financial Reports" },
          { id: "academic-reports", label: "Academic Reports" },
        ],
      },
      { id: "alerts", label: "Alerts", icon: Bell },
      { id: "configuration", label: "App Configuration", icon: Settings },
    ]

    const renderAdminContent = () => {
      switch (adminCurrentView) {
        case "quick-actions":
          return <QuickActionsDashboard onNavigate={(view: string) => setAdminCurrentView(view as AdminView)} />
        case "users":
          return <UserManagement />
        case "students":
        case "students-list":
          return <StudentManagement />
        case "student-id-cards":
          return <StudentIdCards />
        case "report-cards":
          return <ReportCards />
        case "teachers":
          return <TeacherManagement />
        case "employees":
          return (
            <EmployeeManagementProvider>
              <EmployeeManagement />
            </EmployeeManagementProvider>
          )
        case "classes":
          return <ClassManagement />
        case "subjects":
          return (
            <SubjectManagementProvider>
              <SubjectManagement />
            </SubjectManagementProvider>
          )


        case "sales":
          return <SalesManagement />
        case "payment":
          return <PaymentManagement />
        case "expenditures":
          return <ExpenditureManagement />
        case "financial-reports":
          return <AdminFinancialReports />
        case "academic-reports":
          return <AcademicReports />
        case "alerts":
          return <Alerts />
        case "configuration":
          return <AppConfiguration />
        case "profile":
          return <ProfileSettings />
        default:
          return <QuickActionsDashboard onNavigate={(view: string) => setAdminCurrentView(view as AdminView)} />
      }
    }

    function AdminSidebarContent() {
      const { state } = useSidebar()
      const collapsed = state === "collapsed"
      
      return (
        <>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Admin Panel"
                collapsed={collapsed}
              />
            </SidebarHeaderTitle>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarMenu>
                {adminMenuItems.map((item) => {
                  // Check if any sub-item is active
                  const isSubItemActive = item.subItems?.some(
                    (subItem) => adminCurrentView === subItem.id
                  )
                  const isParentActive = adminCurrentView === item.id || isSubItemActive
                  const isOpen = isSubItemActive || adminCurrentView === item.id

                  if (item.subItems && item.subItems.length > 0) {
                    const isStudentsMenu = item.id === "students"
                    const isFinancesMenu = item.id === "financial"
                    const isReportsMenu = item.id === "reports"
                    const menuOpen = isStudentsMenu 
                      ? studentsMenuOpen 
                      : isFinancesMenu 
                      ? financesMenuOpen 
                      : isReportsMenu
                      ? reportsMenuOpen
                      : isOpen

                    return (
                      <Collapsible
                        key={item.id}
                        open={menuOpen}
                        onOpenChange={(open) => {
                          if (isStudentsMenu) {
                            setStudentsMenuOpen(open)
                            // Track if user manually closed the menu
                            if (!open) {
                              setStudentsMenuManuallyClosed(true)
                            } else {
                              setStudentsMenuManuallyClosed(false)
                            }
                          } else if (isFinancesMenu) {
                            setFinancesMenuOpen(open)
                            // Track if user manually closed the menu
                            if (!open) {
                              setFinancesMenuManuallyClosed(true)
                            } else {
                              setFinancesMenuManuallyClosed(false)
                            }
                          } else if (isReportsMenu) {
                            setReportsMenuOpen(open)
                            // Track if user manually closed the menu
                            if (!open) {
                              setReportsMenuManuallyClosed(true)
                            } else {
                              setReportsMenuManuallyClosed(false)
                            }
                          }
                          // For other menus, the open state is controlled by isOpen which is based on active state
                          // They will automatically close when a different menu item is selected
                        }}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isParentActive}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton
                                    onClick={() => setAdminCurrentView(subItem.id as AdminView)}
                                    isActive={adminCurrentView === subItem.id}
                                    className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                  >
                                    <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setAdminCurrentView(item.id as AdminView)}
                        isActive={adminCurrentView === item.id}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
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
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
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
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
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
        </>
      )
    }

    return (
      <UserManagementProvider>
        <StudentEnrollmentProvider>
          <StudentManagementProvider>
            <TeacherManagementProvider>
              <ClassManagementProvider>
                <SubjectManagementProvider>
                  <FinancialProvider>
                    <ProfileProvider>
                      <AlertsProvider>
                        <SidebarProvider>
                        <Sidebar 
                          collapsible="icon"
                          className="border-r border-border/50"
                        >
                          <AdminSidebarContent />
                        </Sidebar>
                        <SidebarInset>
                          <DashboardHeader
                            user={user}
                            onProfileClick={() => setAdminCurrentView("profile")}
                            onLogout={handleLogout}
                          />
                          <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderAdminContent()}</div>
                        </SidebarInset>
                      </SidebarProvider>
                      </AlertsProvider>
                    </ProfileProvider>
                  </FinancialProvider>
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
      { id: "grades-history", label: "Grades", icon: ClipboardList },
    ]

    const handleTeacherNavigation = (view: string, classId?: string) => {
      if (view === "grades") {
        setTeacherCurrentView("class-grades")
      } else {
        setTeacherCurrentView(view as TeacherView)
      }
      
      if (classId) {
        setSelectedClassId(classId)
        localStorage.setItem('selectedClassId', classId)
      }
    }

    const renderTeacherContent = () => {
      switch (teacherCurrentView) {
        case "class-grades":
          return <ClassGradeEntry classId={selectedClassId || ""} onBack={() => setTeacherCurrentView("dashboard")} />
        case "grades-history":
          return <GradesHistory />
        case "profile":
          return <ProfileSettings />
        default:
          return <TeacherDashboard onNavigate={handleTeacherNavigation} />
      }
    }

    function TeacherSidebarContent() {
      const { state } = useSidebar()
      const collapsed = state === "collapsed"
      
      return (
        <>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Teacher Portal"
                collapsed={collapsed}
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
                    <SidebarMenuButton
                      className="hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <UserAvatar user={user} size="sm" className="rounded-lg" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
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
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
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
        </>
      )
    }

    return (
        <ProfileProvider>
          <SidebarProvider>
            <Sidebar 
              collapsible="icon"
              className="border-r border-border/50"
            >
              <TeacherSidebarContent />
            </Sidebar>
            <SidebarInset>
              <DashboardHeader
                user={user}
                onProfileClick={() => setTeacherCurrentView("profile")}
                onLogout={handleLogout}
              />
              <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderTeacherContent()}</div>
            </SidebarInset>
          </SidebarProvider>
        </ProfileProvider>
    )
  }

  // Bursar Dashboard
  if (user.role === "bursar") {
    const bursarMenuItems: Array<{
      id: string
      label: string
      icon: any
      subItems?: Array<{ id: string; label: string }>
    }> = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      {
        id: "financial",
        label: "Finances",
        icon: DollarSign,
        subItems: [
          { id: "sales", label: "Sales" },
          { id: "payment", label: "Fees Payment" },
          { id: "expenditures", label: "Expenditures" },
        ],
      },
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
        case "sales":
          return <SalesManagement />
        case "payment":
          return <PaymentManagement />
        case "expenditures":
          return <ExpenditureManagement />
        case "reports":
          return <FinancialReports onNavigate={(view: string) => setBursarCurrentView(view as BursarView)} />
        case "profile":
          return <BursarProfile />
        default:
          return <BursarDashboard onNavigate={(view: string) => setBursarCurrentView(view as BursarView)} />
      }
    }

    function BursarSidebarContent() {
      const { state } = useSidebar()
      const collapsed = state === "collapsed"
      
      return (
        <>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Bursar Portal"
                collapsed={collapsed}
              />
            </SidebarHeaderTitle>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
              <SidebarMenu>
                {bursarMenuItems.map((item) => {
                  // Check if any sub-item is active
                  const isSubItemActive = item.subItems?.some(
                    (subItem) => bursarCurrentView === subItem.id
                  )
                  const isParentActive = bursarCurrentView === item.id || isSubItemActive
                  const isOpen = isSubItemActive || bursarCurrentView === item.id

                  if (item.subItems && item.subItems.length > 0) {
                    const isFinancesMenu = item.id === "financial"
                    const menuOpen = isFinancesMenu ? bursarFinancesMenuOpen : isOpen

                    return (
                      <Collapsible
                        key={item.id}
                        open={menuOpen}
                        onOpenChange={(open) => {
                          if (isFinancesMenu) {
                            setBursarFinancesMenuOpen(open)
                            // Track if user manually closed the menu
                            if (!open) {
                              setBursarFinancesMenuManuallyClosed(true)
                            } else {
                              setBursarFinancesMenuManuallyClosed(false)
                            }
                          }
                          // For other menus, the open state is controlled by isOpen which is based on active state
                          // They will automatically close when a different menu item is selected
                        }}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isParentActive}
                              className="hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton
                                    onClick={() => setBursarCurrentView(subItem.id as BursarView)}
                                    isActive={bursarCurrentView === subItem.id}
                                    className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                  >
                                    <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setBursarCurrentView(item.id as BursarView)}
                        isActive={bursarCurrentView === item.id}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
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
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
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
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
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
        </>
      )
    }

    return (
      <BursarProvider>
        <ProfileProvider>
          <SidebarProvider>
            <Sidebar 
              collapsible="icon"
              className="border-r border-border/50"
            >
              <BursarSidebarContent />
            </Sidebar>
            <SidebarInset>
              <DashboardHeader 
                user={user} 
                onProfileClick={() => setBursarCurrentView("profile")} 
                onLogout={handleLogout}
              />
              <div className="flex flex-1 flex-col gap-4 p-6 pt-20">{renderBursarContent()}</div>
            </SidebarInset>
          </SidebarProvider>
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
