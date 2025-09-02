/**
 * Phone number utilities for Cameroon phone numbers
 * Ensures all phone numbers follow the +237 6XXXXXXXX format
 */

/**
 * Formats a phone number to ensure it starts with +237 6
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '+237 6'
  
  // Remove any invalid characters
  let formatted = phone.replace(/[^0-9\s\+\-\(\)]/g, '')
  
  // Ensure it starts with +237 6
  if (!formatted.startsWith('+237 6')) {
    formatted = '+237 6'
  }
  
  return formatted
}

/**
 * Validates if a phone number follows the Cameroon mobile format
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneFormat(phone: string): boolean {
  if (!phone) return false
  
  // Check if phone matches Cameroon mobile format: +237 6XXXXXXXX
  const phoneRegex = /^\+237\s?6\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Formats a phone number for database storage
 * @param phone - The phone number to format
 * @returns Phone number formatted for database
 */
export function formatPhoneForDatabase(phone: string): string {
  if (!phone) return '+237 6'
  
  // Remove all non-numeric characters except + and spaces
  let formatted = phone.replace(/[^0-9\s\+]/g, '')
  
  // Ensure it starts with +237
  if (!formatted.startsWith('+237')) {
    formatted = '+237' + formatted.replace(/^\+/, '')
  }
  
  // Ensure it's at least 13 characters (+237 + 9 digits)
  if (formatted.length < 13) {
    formatted = formatted + '0'.repeat(13 - formatted.length)
  }
  
  return formatted
}

/**
 * Gets the default phone number prefix for Cameroon
 * @returns The default phone prefix
 */
export function getDefaultPhonePrefix(): string {
  return '+237 6'
}

/**
 * Checks if a phone number needs the prefix added
 * @param phone - The phone number to check
 * @returns True if prefix needs to be added
 */
export function needsPhonePrefix(phone: string): boolean {
  return !phone || !phone.startsWith('+237 6')
}
