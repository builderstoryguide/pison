"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { copyToClipboardWithFeedback } from "@/lib/clipboard-utils"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showLabel?: boolean
  successMessage?: string
  errorMessage?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function CopyButton({
  text,
  label = "Copy",
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
  successMessage = "Copied to clipboard!",
  errorMessage = "Failed to copy to clipboard",
  disabled = false,
  children
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()

  const handleCopy = async () => {
    if (!text || disabled) return

    await copyToClipboardWithFeedback(
      text,
      () => {
        setIsCopied(true)
        toast({
          title: "Success",
          description: successMessage,
        })
        // Reset the copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000)
      },
      (error) => {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={disabled || !text}
      className={cn("transition-all duration-200", className)}
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {showLabel && !children && (
        <span className="ml-2">{isCopied ? "Copied!" : label}</span>
      )}
      {children}
    </Button>
  )
}

// Specialized copy button components for common use cases
export function CopyPasswordButton({ 
  password, 
  className 
}: { 
  password: string
  className?: string 
}) {
  return (
    <CopyButton
      text={password}
      label="Copy Password"
      successMessage="Password copied to clipboard!"
      errorMessage="Failed to copy password"
      className={className}
    />
  )
}

export function CopyEmailButton({ 
  email, 
  className 
}: { 
  email: string
  className?: string 
}) {
  return (
    <CopyButton
      text={email}
      label="Copy Email"
      successMessage="Email copied to clipboard!"
      errorMessage="Failed to copy email"
      className={className}
    />
  )
}

export function CopyIdButton({ 
  id, 
  className 
}: { 
  id: string
  className?: string 
}) {
  return (
    <CopyButton
      text={id}
      label="Copy ID"
      successMessage="ID copied to clipboard!"
      errorMessage="Failed to copy ID"
      className={className}
    />
  )
}

export function CopyCodeButton({ 
  code, 
  className 
}: { 
  code: string
  className?: string 
}) {
  return (
    <CopyButton
      text={code}
      label="Copy Code"
      successMessage="Code copied to clipboard!"
      errorMessage="Failed to copy code"
      className={className}
    />
  )
}

// Inline copy button for use within text
export function InlineCopyButton({ 
  text, 
  className 
}: { 
  text: string
  className?: string 
}) {
  return (
    <CopyButton
      text={text}
      variant="ghost"
      size="sm"
      showLabel={false}
      className={cn("h-6 w-6 p-0", className)}
    />
  )
}

// Copy button with custom icon
export function CopyButtonWithIcon({ 
  text, 
  icon: Icon, 
  label, 
  className 
}: { 
  text: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  className?: string 
}) {
  const [isCopied, setIsCopied] = useState(false)
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()

  const handleCopy = async () => {
    if (!text) return

    await copyToClipboardWithFeedback(
      text,
      () => {
        setIsCopied(true)
        toast({
          title: "Success",
          description: "Copied to clipboard!",
        })
        setTimeout(() => setIsCopied(false), 2000)
      },
      (error) => {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive"
        })
      }
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={!text}
      className={cn("transition-all duration-200", className)}
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="ml-2">{isCopied ? "Copied!" : label}</span>
    </Button>
  )
}
