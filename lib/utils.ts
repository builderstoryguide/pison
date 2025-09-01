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
