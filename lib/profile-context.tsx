"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export interface ProfileData {
  id: string
  name: string
  email: string
  role: "admin" | "teacher" | "student" | "parent" | "bursar"
  avatar?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  gender?: "male" | "female"
  studentId?: string
  teacherRegNo?: string
  parentCode?: string
  subsystem?: "english" | "french"
  branch?: "grammar" | "technical" | "commercial"
  class?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences: {
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
      grades: boolean
      attendance: boolean
      fees: boolean
      announcements: boolean
      messages: boolean
    }
    language: "en" | "fr"
    theme: "light" | "dark" | "system"
    timezone: string
  }
  socialMedia?: {
    facebook?: string
    twitter?: string
    linkedin?: string
  }
  bio?: string
  lastUpdated: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ProfileContextType {
  profile: ProfileData | null
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>
  changePassword: (data: PasswordChangeData) => Promise<boolean>
  uploadAvatar: (file: File) => Promise<string | null>
  deleteAvatar: () => Promise<boolean>
  updateNotificationPreferences: (preferences: ProfileData["preferences"]["notifications"]) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Mock profile data
const mockProfiles: Record<string, ProfileData> = {
  "1": {
    id: "1",
    name: "Dr. Marie Ngozi",
    email: "admin@gbhs-yaounde.cm",
    role: "admin",
    avatar: "/placeholder.svg?height=100&width=100",
    phone: "+237 677 123 456",
    address: "Yaoundé, Centre Region, Cameroon",
    dateOfBirth: "1975-05-15",
    gender: "female",
    bio: "Experienced educational administrator with over 15 years in school management.",
    emergencyContact: {
      name: "Paul Ngozi",
      phone: "+237 677 123 457",
      relationship: "Spouse",
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
        grades: true,
        attendance: true,
        fees: true,
        announcements: true,
        messages: true,
      },
      language: "en",
      theme: "light",
      timezone: "Africa/Douala",
    },
    socialMedia: {
      linkedin: "https://linkedin.com/in/marie-ngozi",
    },
    lastUpdated: "2024-01-20T10:30:00Z",
  },
  "2": {
    id: "2",
    name: "Paul Biya Mbeki",
    email: "p.mbeki@gbhs-yaounde.cm",
    role: "teacher",
    teacherRegNo: "TCH2024001",
    subsystem: "english",
    phone: "+237 677 234 567",
    address: "Douala, Littoral Region, Cameroon",
    dateOfBirth: "1985-03-15",
    gender: "male",
    bio: "Mathematics teacher specializing in advanced calculus and statistics.",
    emergencyContact: {
      name: "Grace Mbeki",
      phone: "+237 677 234 568",
      relationship: "Spouse",
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
        grades: true,
        attendance: true,
        fees: false,
        announcements: true,
        messages: true,
      },
      language: "en",
      theme: "dark",
      timezone: "Africa/Douala",
    },
    lastUpdated: "2024-01-19T14:20:00Z",
  },
  "3": {
    id: "3",
    name: "Amina Fru",
    email: "amina.fru@student.gbhs-yaounde.cm",
    role: "student",
    studentId: "STU2024001",
    branch: "grammar",
    class: "Form 5A",
    subsystem: "english",
    phone: "+237 677 345 678",
    address: "Bamenda, Northwest Region, Cameroon",
    dateOfBirth: "2006-08-22",
    gender: "female",
    bio: "Aspiring medical student with interests in biology and chemistry.",
    emergencyContact: {
      name: "John Fru",
      phone: "+237 677 456 789",
      relationship: "Father",
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
        grades: true,
        attendance: true,
        fees: false,
        announcements: true,
        messages: true,
      },
      language: "en",
      theme: "system",
      timezone: "Africa/Douala",
    },
    lastUpdated: "2024-01-18T16:45:00Z",
  },
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      // Load profile data based on user ID
      const userProfile = mockProfiles[user.id]
      if (userProfile) {
        setProfile(userProfile)
      }
    }
  }, [user])

  const updateProfile = async (data: Partial<ProfileData>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      if (profile) {
        const updatedProfile = {
          ...profile,
          ...data,
          lastUpdated: new Date().toISOString(),
        }
        setProfile(updatedProfile)
        // Update mock data
        mockProfiles[profile.id] = updatedProfile
      }
      return true
    } catch (err) {
      setError("Failed to update profile")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      // Validate passwords
      if (data.newPassword !== data.confirmPassword) {
        setError("New passwords do not match")
        return false
      }

      if (data.newPassword.length < 8) {
        setError("Password must be at least 8 characters long")
        return false
      }

      // In real implementation, verify current password
      if (data.currentPassword !== "password123") {
        setError("Current password is incorrect")
        return false
      }

      return true
    } catch (err) {
      setError("Failed to change password")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate upload

      // Validate file
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return null
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("File size must be less than 5MB")
        return null
      }

      // Generate mock URL
      const avatarUrl = `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(profile?.name || "User")}`

      if (profile) {
        await updateProfile({ avatar: avatarUrl })
      }

      return avatarUrl
    } catch (err) {
      setError("Failed to upload avatar")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAvatar = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (profile) {
        await updateProfile({ avatar: undefined })
      }
      return true
    } catch (err) {
      setError("Failed to delete avatar")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationPreferences = async (
    preferences: ProfileData["preferences"]["notifications"],
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (profile) {
        await updateProfile({
          preferences: {
            ...profile.preferences,
            notifications: preferences,
          },
        })
      }
      return true
    } catch (err) {
      setError("Failed to update notification preferences")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        changePassword,
        uploadAvatar,
        deleteAvatar,
        updateNotificationPreferences,
        isLoading,
        error,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
