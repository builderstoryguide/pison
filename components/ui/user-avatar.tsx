"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { generateInitials } from "@/lib/utils"

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

export function UserAvatar({ user, className, size = "md" }: UserAvatarProps) {
  const isInitialsAvatar = user.avatar?.startsWith('initials:')
  const initials = isInitialsAvatar 
    ? user.avatar?.replace('initials:', '') 
    : generateInitials(user.name)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!isInitialsAvatar && user.avatar && (
        <AvatarImage src={user.avatar} alt={user.name} />
      )}
      <AvatarFallback className={sizeClasses[size]}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

// Helper function for className merging
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
