"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  User, 
  Mail, 
  GraduationCap, 
  Check,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  studentId: string
  fullName: string
  firstName: string
  lastName: string
  email?: string
  className?: string
  enrollmentStatus?: string
}

interface StudentSearchProps {
  value?: Student | null
  onSelect: (student: Student | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function StudentSearch({ 
  value, 
  onSelect, 
  placeholder = "Search for a student...", 
  className,
  disabled = false 
}: StudentSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value?.fullName || '')
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Sync searchQuery with value prop changes
  useEffect(() => {
    setSearchQuery(value?.fullName || '')
  }, [value])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStudents([])
      return
    }

    const timeoutId = setTimeout(() => {
      searchStudents(searchQuery)
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      // Abort any in-flight request when component unmounts or search changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchStudents = async (query: string) => {
    if (!query.trim()) return

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}&limit=10`, {
        signal: controller.signal
      })
      const data = await response.json()
      
      if (response.ok) {
        setStudents(data.students || [])
      } else {
        setStudents([])
      }
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      // Error searching students
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setIsOpen(true)
    setSelectedIndex(-1)
    
    // If input is cleared, clear selection
    if (!query.trim()) {
      onSelect(null)
    }
  }

  const handleInputFocus = () => {
    if (searchQuery.trim()) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < students.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < students.length) {
          handleSelectStudent(students[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelectStudent = (student: Student) => {
    onSelect(student)
    setSearchQuery(student.fullName)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onSelect(null)
    setSearchQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Selected Student Display */}
      {value && (
        <div className="mt-2 p-3 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {value.fullName}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{value.studentId}</span>
                  {value.className && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <GraduationCap className="h-3 w-3" />
                        <span>{value.className}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching students...</span>
            </div>
          ) : students.length > 0 ? (
            <div className="py-1">
              {students.map((student, index) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors",
                    selectedIndex === index && "bg-muted"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student.fullName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{student.studentId}</span>
                        {student.className && (
                          <>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="h-3 w-3" />
                              <span>{student.className}</span>
                            </div>
                          </>
                        )}
                        {student.email && (
                          <>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No students found for "{searchQuery}"
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Start typing to search for students...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
