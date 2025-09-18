// Password generation utilities for admin use

export interface PasswordOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
  excludeSimilar?: boolean
}

export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options

  let charset = ''
  
  if (includeLowercase) {
    charset += 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (includeUppercase) {
    charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (includeNumbers) {
    charset += '0123456789'
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  // Remove similar characters if requested
  if (excludeSimilar) {
    charset = charset.replace(/[0O1lI]/g, '')
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included')
  }

  let password = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
}

export function generateDefaultPassword(role: string, year: number = new Date().getFullYear()): string {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1)
  const randomChars = generateSecurePassword({
    length: 4,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false
  })
  
  return `${capitalizedRole}@${year}${randomChars}`
}

export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain uppercase letters')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain numbers')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain special characters')
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  }
}
