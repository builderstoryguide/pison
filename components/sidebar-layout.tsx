"use client"

import React from "react"
import { SchoolSidebar } from "@/components/school-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar-08"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <SchoolSidebar />
      <SidebarInset>
        {/* Header - Mobile First */}
        <header className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4">
          <SidebarTrigger className="h-8 w-8 sm:h-9 sm:w-9" />
          <div className="flex-1">
            <h1 className="text-sm sm:text-lg font-semibold truncate">School Management System</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Navigation controls will be added here */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
