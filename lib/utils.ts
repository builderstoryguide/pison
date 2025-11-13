import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate initials from a user's name
 * @param name - The full name of the user
 * @returns The initials (e.g., "JS" for "James Smith")
 */
export function generateInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'U'
  }
  
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) // Limit to 2 characters
}

/**
 * Get the display name for a student's class
 * Prefers class_name over class ID for better readability
 * @param student - Student object with class and class_name properties
 * @returns The class name to display, or empty string if neither is available
 */
export function getStudentClassName(student: { class?: string; class_name?: string }): string {
  // Prefer class_name if available (human-readable)
  if (student.class_name) {
    return student.class_name
  }
  
  // Fall back to class if available
  if (student.class) {
    // If class looks like a UUID, it's probably an ID, so return empty or a placeholder
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class)
    if (!isUUID) {
      // It's probably already a class name
      return student.class
    }
  }
  
  return ''
}