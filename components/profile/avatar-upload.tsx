"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile } from "@/lib/profile-context"

interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onAvatarChange?: (url: string | null) => void
}

export function AvatarUpload({ currentAvatar, userName, onAvatarChange }: AvatarUploadProps) {
  const { uploadAvatar, deleteAvatar, isLoading, error } = useProfile()
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (file) {
      const url = await uploadAvatar(file)
      if (url) {
        setPreview(null)
        onAvatarChange?.(url)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const handleDelete = async () => {
    const success = await deleteAvatar()
    if (success) {
      setPreview(null)
      onAvatarChange?.(null)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <UserAvatar 
          user={{ 
            name: userName, 
            avatar: displayAvatar 
          }} 
          size="xl" 
        />

        {/* Camera overlay button */}
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {/* Action buttons */}
      {preview ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleUpload} disabled={isLoading} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Change Photo
          </Button>
          {currentAvatar && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 text-destructive hover:text-destructive bg-transparent"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload guidelines */}
      <div className="text-center text-sm text-muted-foreground max-w-sm">
        <p>Recommended: Square image, at least 200x200 pixels</p>
        <p>Maximum file size: 5MB</p>
        <p>Supported formats: JPG, PNG, GIF</p>
      </div>
    </div>
  )
}
