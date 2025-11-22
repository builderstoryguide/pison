"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  UserCheck,
  ClipboardList,
  School,
  Home,
  LogOut,
  Bell,
  Search,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderDescription,
  SidebarHeaderTitle,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar-08"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and analytics"
  },
  {
    title: "Students",
    href: "/students",
    icon: GraduationCap,
    description: "Student management",
    subItems: [
      { title: "All Students", href: "/students" },
      { title: "Enroll Student", href: "/students/enroll" },
      { title: "Student Records", href: "/students/records" },
    ]
  },
  {
    title: "Teachers",
    href: "/teachers",
    icon: UserCheck,
    description: "Manage Teachers",
    subItems: [
      { title: "All Teachers", href: "/teachers" },
      { title: "Add Teacher", href: "/teachers/add" },
      { title: "Assignments", href: "/teachers/assignments" },
      { title: "Grades", href: "/teachers/grades" },
    ]
  },
  {
    title: "Classes",
    href: "/classes",
    icon: School,
    description: "Manage Classes",
    subItems: [
      { title: "All Classes", href: "/classes" },
      { title: "Create Class", href: "/classes/create" },
      { title: "Class Schedules", href: "/classes/schedules" },
    ]
  },
  {
    title: "Subjects",
    href: "/subjects",
    icon: BookOpen,
    description: "Subject management"
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Analytics and reports",
    subItems: [
      { title: "Academic Reports", href: "/reports/academic" },
      { title: "Financial Reports", href: "/reports/financial" },
    ]
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    description: "Financial management",
    subItems: [
      { title: "Fee Structure", href: "/finance/fees" },
      { title: "Payments", href: "/finance/payments" },
      { title: "Financial Reports", href: "/finance/reports" },
    ]
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    description: "Manage Users",
    subItems: [
      { title: "All Users", href: "/users" },
      { title: "Add User", href: "/users/add" },
      { title: "Roles & Permissions", href: "/users/roles" },
    ]
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System configuration"
  },
]

export function SchoolSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarHeaderTitle>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-lg">Pison Academy</div>
                <SidebarHeaderDescription>
                  School Management System
                </SidebarHeaderDescription>
              </div>
            )}
          </div>
        </SidebarHeaderTitle>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
                
                {item.subItems && !collapsed && (
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.href}
                        >
                          <Link href={subItem.href}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Link href="/students/enroll">
                    <GraduationCap className="h-4 w-4" />
                    <span>Enroll Student</span>
                    <Badge variant="secondary" className="ml-auto">New</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Link href="/reports/academic">
                    <BarChart3 className="h-4 w-4" />
                    <span>View Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed ? (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@pison.edu</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
