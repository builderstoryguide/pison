"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  status?: "completed" | "inProgress" | "pending"
  completionCount?: number
  totalCount?: number
}

interface GradeEntryBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function GradeEntryBreadcrumb({ items, className }: GradeEntryBreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={items[0]?.onClick}
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {item.onClick ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-normal"
                onClick={item.onClick}
              >
                {item.label}
              </Button>
            ) : (
              <span className="font-medium">{item.label}</span>
            )}
            {item.status && (
              <Badge
                variant={
                  item.status === "completed"
                    ? "default"
                    : item.status === "inProgress"
                    ? "secondary"
                    : "outline"
                }
                className="text-xs"
              >
                {item.completionCount !== undefined && item.totalCount !== undefined
                  ? `${item.completionCount}/${item.totalCount}`
                  : item.status === "completed"
                  ? "Complete"
                  : item.status === "inProgress"
                  ? "In Progress"
                  : "Pending"}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}
