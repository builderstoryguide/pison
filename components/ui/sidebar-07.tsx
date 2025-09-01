"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"

const sidebarVariants = cva(
  "group relative flex h-full w-full flex-col gap-4 border-r bg-background p-4 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "border-border",
        secondary: "border-border/50",
      },
      size: {
        default: "w-64",
        sm: "w-48",
        lg: "w-80",
      },
      collapsed: {
        true: "w-16",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      collapsed: false,
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, size, collapsed = false, onCollapsedChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(sidebarVariants({ variant, size, collapsed }), className)}
        {...props}
      >
        {children}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background p-0"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-[60px] shrink-0 items-center", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarHeaderTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 font-semibold", className)}
    {...props}
  />
))
SidebarHeaderTitle.displayName = "SidebarHeaderTitle"

const SidebarHeaderDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
SidebarHeaderDescription.displayName = "SidebarHeaderDescription"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex shrink-0 items-center gap-2", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 text-xs font-semibold text-muted-foreground", className)}
    {...props}
  />
))
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 rounded-md px-2 py-1", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean
  }
>(({ className, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-accent text-accent-foreground",
      className
    )}
    {...props}
  />
))
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean
  }
>(({ className, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-accent text-accent-foreground",
      className
    )}
    {...props}
  />
))
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-4 flex flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 rounded-md px-2 py-1", className)}
    {...props}
  />
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButtonItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean
  }
>(({ className, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-accent text-accent-foreground",
      className
    )}
    {...props}
  />
))
SidebarMenuSubButtonItem.displayName = "SidebarMenuSubButtonItem"

const SidebarMenuSubButtonIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonIcon.displayName = "SidebarMenuSubButtonIcon"

const SidebarMenuSubButtonText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 text-left", className)}
    {...props}
  />
))
SidebarMenuSubButtonText.displayName = "SidebarMenuSubButtonText"

const SidebarMenuSubButtonBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonBadge.displayName = "SidebarMenuSubButtonBadge"

const SidebarMenuSubButtonChevron = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonChevron.displayName = "SidebarMenuSubButtonChevron"

const SidebarMenuSubButtonIconWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonIconWrapper.displayName = "SidebarMenuSubButtonIconWrapper"

const SidebarMenuSubButtonTextWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 text-left", className)}
    {...props}
  />
))
SidebarMenuSubButtonTextWrapper.displayName = "SidebarMenuSubButtonTextWrapper"

const SidebarMenuSubButtonBadgeWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonBadgeWrapper.displayName = "SidebarMenuSubButtonBadgeWrapper"

const SidebarMenuSubButtonChevronWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarMenuSubButtonChevronWrapper.displayName = "SidebarMenuSubButtonChevronWrapper"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "h-9 w-9 p-0",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Toggle sidebar</span>
  </button>
))
SidebarTrigger.displayName = "SidebarTrigger"

export {
  Sidebar,
  SidebarHeader,
  SidebarHeaderTitle,
  SidebarHeaderDescription,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSubButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButtonItem,
  SidebarMenuSubButtonIcon,
  SidebarMenuSubButtonText,
  SidebarMenuSubButtonBadge,
  SidebarMenuSubButtonChevron,
  SidebarMenuSubButtonIconWrapper,
  SidebarMenuSubButtonTextWrapper,
  SidebarMenuSubButtonBadgeWrapper,
  SidebarMenuSubButtonChevronWrapper,
  SidebarTrigger,
}
