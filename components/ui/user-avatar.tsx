"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { generateInitials } from "@/lib/utils"
import InitialsAvatar from "react-initials-avatar"

interface UserAvatarProps {
  user: {
    name: string
    avatar?: string | null
  }
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg"
}

const sizeValues = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64
}

export function UserAvatar({ user, className, size = "md" }: UserAvatarProps) {
  const isInitialsAvatar = user.avatar?.startsWith('initials:')
  const initials = isInitialsAvatar 
    ? user.avatar?.replace('initials:', '') 
    : generateInitials(user.name)

  // If user has a regular avatar image, use the standard Avatar component
  if (!isInitialsAvatar && user.avatar) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className={sizeClasses[size]}>
          {initials}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Use react-initials-avatar for initials-based avatars
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <InitialsAvatar
        name={user.name}
        className={cn("rounded-full", sizeClasses[size])}
      />
    </div>
  )
}

// Helper function for className merging
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
