/**
 * Currency Utilities
 * Centralized currency formatting for the school management application
 * Supports dynamic currency based on app configuration
 */

/**
 * Format amount with specified currency
 * @param amount - The amount to format
 * @param currencyCode - The ISO currency code (e.g., 'XOF', 'USD', 'EUR')
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatWithCurrency(
  amount: number,
  currencyCode: string = 'XOF',
  options: {
    showSymbol?: boolean
    showDecimals?: boolean
    locale?: string
  } = {}
): string {
  const {
    showSymbol = true,
    showDecimals = false,
    locale = 'en-US'
  } = options

  try {
    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount)
  } catch (error) {
    // Fallback if currency code is invalid
    console.error(`Invalid currency code: ${currencyCode}`, error)
    return `${currencyCode} ${amount.toLocaleString(locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })}`
  }
}

/**
 * Format amount as XOF currency (backward compatibility)
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatXOF(
  amount: number,
  options: {
    showSymbol?: boolean
    showDecimals?: boolean
    locale?: string
  } = {}
): string {
  return formatWithCurrency(amount, 'XOF', options)
}

/**
 * Format amount with symbol (uses XOF by default for backward compatibility)
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: false })
}

/**
 * Format amount without symbol
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted number string without currency symbol
 */
export function formatAmount(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: false, showDecimals: false })
}

/**
 * Format amount with decimals
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string with decimals
 */
export function formatCurrencyWithDecimals(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: true })
}

/**
 * Parse currency string to number
 * @param currencyString - The currency string to parse
 * @returns Parsed number or 0 if invalid
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString) return 0
  
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = currencyString.replace(/[^\d.,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Validate if amount is a valid currency value
 * @param amount - The amount to validate
 * @returns True if valid, false otherwise
 */
export function isValidCurrency(amount: number): boolean {
  return !isNaN(amount) && isFinite(amount) && amount >= 0
}

/**
 * Get currency symbol for a given currency code
 * @param currencyCode - The currency code (defaults to XOF)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string = 'XOF'): string {
  return currencyCode
}

/**
 * Get currency name
 * @param currencyCode - The currency code (defaults to XOF)
 * @returns Full currency name
 */
export function getCurrencyName(currencyCode: string = 'XOF'): string {
  const currencyNames: { [key: string]: string } = {
    'XOF': 'West African CFA franc',
    'XAF': 'Central African CFA franc',
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
  }
  return currencyNames[currencyCode] || currencyCode
}

/**
 * Format range of amounts
 * @param minAmount - Minimum amount
 * @param maxAmount - Maximum amount
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted range string
 */
export function formatCurrencyRange(minAmount: number, maxAmount: number, currencyCode: string = 'XOF'): string {
  if (minAmount === maxAmount) {
    return formatCurrency(minAmount, currencyCode)
  }
  return `${formatCurrency(minAmount, currencyCode)} - ${formatCurrency(maxAmount, currencyCode)}`
}

/**
 * Format percentage of total
 * @param amount - The amount
 * @param total - The total amount
 * @returns Formatted percentage string
 */
export function formatCurrencyPercentage(amount: number, total: number): string {
  if (total === 0) return '0%'
  const percentage = (amount / total) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Format currency for display in tables
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string optimized for table display
 */
export function formatCurrencyForTable(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for display in cards/dashboards
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string optimized for card display
 */
export function formatCurrencyForCard(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for display in forms
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string optimized for form display
 */
export function formatCurrencyForForm(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: false, showDecimals: false })
}

/**
 * Format currency for PDF reports
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string optimized for PDF display
 */
export function formatCurrencyForPDF(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for receipts
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (defaults to XOF)
 * @returns Formatted currency string optimized for receipt display
 */
export function formatCurrencyForReceipt(amount: number, currencyCode: string = 'XOF'): string {
  return formatWithCurrency(amount, currencyCode, { showSymbol: true, showDecimals: false })
}

// Export default function for backward compatibility
export default formatCurrency
