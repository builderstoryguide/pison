/**
 * Password utility functions for user management
 */

/**
 * Generates a secure default password for new users
 * Format: Role@Year + 4 random alphanumeric characters
 * Example: Teacher@2024Xy9z
 */
export function generateDefaultPassword(role: string, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1)
  return `${capitalizedRole}@${currentYear}${randomChars}`
}

/**
 * Generates a temporary password for password resets
 * Format: Temp@Year + 6 random alphanumeric characters
 * Example: Temp@2024Xy9zAb
 */
export function generateTemporaryPassword(year?: number): string {
  const currentYear = year || new Date().getFullYear()
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `Temp@${currentYear}${randomChars}`
}

/**
 * Validates password strength
 * Returns an object with isValid boolean and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }
  
  return { isValid: true }
}

/**
 * Generates a password hint based on the user's information
 * This helps users remember their default password
 */
export function generatePasswordHint(userName: string, role: string, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  const firstName = userName.split(' ')[0].toLowerCase()
  return `Hint: ${role}@${currentYear} + 4 random characters. Your name starts with "${firstName.charAt(0).toUpperCase()}"`
}
