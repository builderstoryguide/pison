"use client"

import React from "react"
import { School } from "lucide-react"
import { useSchoolName, useSchoolLogo } from "@/lib/app-configuration-context-v2"

interface SchoolBrandingProps {
  showSubtitle?: boolean
  subtitle?: string
  collapsed?: boolean
  className?: string
}

export function SchoolBranding({ 
  showSubtitle = true, 
  subtitle, 
  collapsed = false,
  className = ""
}: SchoolBrandingProps) {
  const schoolName = useSchoolName()
  const schoolLogo = useSchoolLogo()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        {schoolLogo.url && schoolLogo.url !== '/placeholder-logo.svg' ? (
          <img
            src={schoolLogo.url}
            alt={schoolLogo.alt}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <School className="size-4" />
        )}
      </div>
      {!collapsed && (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{schoolName}</span>
          {showSubtitle && subtitle && (
            <span className="truncate text-xs">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
