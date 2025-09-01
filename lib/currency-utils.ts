/**
 * Currency Utilities for XOF (West African CFA franc)
 * Centralized currency formatting for the school management application
 */

/**
 * Format amount as XOF currency
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
  const {
    showSymbol = true,
    showDecimals = false,
    locale = 'en-US'
  } = options

  return new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'XOF',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Format amount as XOF with symbol (default)
 * @param amount - The amount to format
 * @returns Formatted currency string with XOF symbol
 */
export function formatCurrency(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: false })
}

/**
 * Format amount as XOF without symbol
 * @param amount - The amount to format
 * @returns Formatted number string without currency symbol
 */
export function formatAmount(amount: number): string {
  return formatXOF(amount, { showSymbol: false, showDecimals: false })
}

/**
 * Format amount as XOF with decimals
 * @param amount - The amount to format
 * @returns Formatted currency string with decimals
 */
export function formatCurrencyWithDecimals(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: true })
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
 * Get currency symbol for XOF
 * @returns XOF currency symbol
 */
export function getCurrencySymbol(): string {
  return 'XOF'
}

/**
 * Get currency name
 * @returns Full currency name
 */
export function getCurrencyName(): string {
  return 'West African CFA franc'
}

/**
 * Format range of amounts
 * @param minAmount - Minimum amount
 * @param maxAmount - Maximum amount
 * @returns Formatted range string
 */
export function formatCurrencyRange(minAmount: number, maxAmount: number): string {
  if (minAmount === maxAmount) {
    return formatCurrency(minAmount)
  }
  return `${formatCurrency(minAmount)} - ${formatCurrency(maxAmount)}`
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
 * @returns Formatted currency string optimized for table display
 */
export function formatCurrencyForTable(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for display in cards/dashboards
 * @param amount - The amount to format
 * @returns Formatted currency string optimized for card display
 */
export function formatCurrencyForCard(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for display in forms
 * @param amount - The amount to format
 * @returns Formatted currency string optimized for form display
 */
export function formatCurrencyForForm(amount: number): string {
  return formatXOF(amount, { showSymbol: false, showDecimals: false })
}

/**
 * Format currency for PDF reports
 * @param amount - The amount to format
 * @returns Formatted currency string optimized for PDF display
 */
export function formatCurrencyForPDF(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: false })
}

/**
 * Format currency for receipts
 * @param amount - The amount to format
 * @returns Formatted currency string optimized for receipt display
 */
export function formatCurrencyForReceipt(amount: number): string {
  return formatXOF(amount, { showSymbol: true, showDecimals: false })
}

// Export default function for backward compatibility
export default formatCurrency
