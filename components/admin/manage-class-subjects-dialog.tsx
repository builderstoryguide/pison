"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, BookOpen, Plus, X, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ClassData } from "@/lib/class-management-context"

interface ManageClassSubjectsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData: ClassData
  onSuccess: (updatedSubjects: string[]) => void
}

// Available subjects based on subsystem and branch
const availableSubjects = {
  english: {
    grammar: [
      "Mathematics",
      "English Language",
      "Biology",
      "Chemistry",
      "Physics",
      "History",
      "Geography",
      "Literature",
      "Economics",
      "Government",
      "Religious Studies",
      "French",
      "Computer Science",
    ],
    technical: [
      "Mathematics",
      "English Language",
      "Physics",
      "Chemistry",
      "Technical Drawing",
      "Workshop Practice",
      "Building Construction",
      "Electrical Installation",
      "Metal Work",
      "Wood Work",
    ],
    commercial: [
      "Mathematics",
      "English Language",
      "Economics",
      "Commerce",
      "Accounting",
      "Business Studies",
      "Marketing",
      "Office Practice",
      "Computer Studies",
      "Statistics",
    ],
  },
  french: {
    grammar: [
      "Mathématiques",
      "Français",
      "Physique",
      "Chimie",
      "Sciences Naturelles",
      "Histoire",
      "Géographie",
      "Philosophie",
      "Anglais",
      "Allemand",
      "Espagnol",
    ],
    technical: [
      "Mathématiques",
      "Français",
      "Physique",
      "Chimie",
      "Dessin Technique",
      "Travaux Pratiques",
      "Construction",
      "Électricité",
      "Mécanique",
    ],
    commercial: [
      "Mathématiques",
      "Français",
      "Économie",
      "Commerce",
      "Comptabilité",
      "Gestion",
      "Marketing",
      "Informatique",
    ],
  },
}

export function ManageClassSubjectsDialog({
  open,
  onOpenChange,
  classData,
  onSuccess
}: ManageClassSubjectsDialogProps) {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Get available subjects for this class's subsystem and branch
  const getAvailableSubjects = () => {
    return availableSubjects[classData.subsystem]?.[classData.branch] || []
  }

  // Get current subjects that are not in the class
  const getAvailableSubjectsForClass = () => {
    const allAvailable = getAvailableSubjects()
    return allAvailable.filter(subject => !classData.subjects.includes(subject))
  }

  // Filter subjects based on search query
  const filteredAvailableSubjects = getAvailableSubjectsForClass().filter(subject =>
    subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Initialize selected subjects when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSubjects([])
      setSearchQuery("")
    }
  }, [open])

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    )
  }

  const handleSelectAll = () => {
    if (selectedSubjects.length === filteredAvailableSubjects.length) {
      setSelectedSubjects([])
    } else {
      setSelectedSubjects(filteredAvailableSubjects)
    }
  }

  const handleRemoveSubject = (subjectToRemove: string) => {
    const updatedSubjects = classData.subjects.filter(subject => subject !== subjectToRemove)
    handleSaveSubjects(updatedSubjects)
  }

  const handleAddSubjects = () => {
    if (selectedSubjects.length === 0) {
      toast({
        title: "No subjects selected",
        description: "Please select at least one subject to add to the class.",
        variant: "destructive",
      })
      return
    }

    const updatedSubjects = [...classData.subjects, ...selectedSubjects]
    handleSaveSubjects(updatedSubjects)
  }

  const handleSaveSubjects = async (updatedSubjects: string[]) => {
    setIsSaving(true)
    try {
      // Here we would call the class management context to update subjects
      // For now, we'll simulate the update
      onSuccess(updatedSubjects)
      
      toast({
        title: "Subjects updated successfully",
        description: `Subjects for ${classData.name} have been updated.`,
      })
      
      setSelectedSubjects([])
      setSearchQuery("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error updating subjects",
        description: "Failed to update subjects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Manage Subjects for {classData.name}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-6">
          {/* Class Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{classData.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {classData.subsystem === "english" ? "English" : "French"} Subsystem • {classData.branch}
                  </p>
                </div>
                <Badge variant="outline">
                  {classData.subjects.length} subjects
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Subjects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Current Subjects</h3>
                <Badge variant="secondary">
                  {classData.subjects.length}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  {classData.subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">No subjects assigned</h4>
                      <p className="text-muted-foreground">
                        This class doesn't have any subjects assigned yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classData.subjects.map((subject) => (
                        <div key={subject} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="text-sm font-medium">{subject}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubject(subject)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Subjects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Add Subjects</h3>
                <Badge variant="outline">
                  {filteredAvailableSubjects.length} available
                </Badge>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Available Subjects</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search subjects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Select All */}
              {filteredAvailableSubjects.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedSubjects.length === filteredAvailableSubjects.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select all available subjects
                  </Label>
                </div>
              )}

              {/* Available Subjects */}
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[300px]">
                    {filteredAvailableSubjects.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">No subjects available</h4>
                        <p className="text-muted-foreground">
                          {searchQuery 
                            ? "No subjects match your search criteria."
                            : "All available subjects are already assigned to this class."
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredAvailableSubjects.map((subject) => (
                          <div key={subject} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-muted/50">
                            <Checkbox
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={() => handleSubjectToggle(subject)}
                            />
                            <span className="text-sm font-medium">{subject}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedSubjects.length > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {selectedSubjects.length} subject{selectedSubjects.length === 1 ? '' : 's'} will be added to {classData.name}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSubjects}
                disabled={selectedSubjects.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {selectedSubjects.length} Subject{selectedSubjects.length === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
