# Dynamic Currency Implementation

## Overview

This document describes the implementation of dynamic currency formatting in the school management application. All currency displays throughout the application now automatically use the currency set by the admin in the App Configuration.

## Key Features

- **Centralized Configuration**: Currency is set once in App Configuration and automatically applied throughout the app
- **Multiple Currency Support**: Supports XOF, USD, EUR, GBP, XAF, and other ISO currency codes
- **Type-Safe**: TypeScript interfaces ensure proper usage
- **Backward Compatible**: Existing code continues to work with default values
- **Flexible**: Easy to add support for new currencies

## Architecture

### 1. App Configuration Storage

Currency is stored in the `app_configuration` table in the database:

```sql
-- Currency column in app_configuration table
currency VARCHAR(10) DEFAULT 'XOF'
```

Supported currencies:
- **XOF**: West African CFA Franc (default)
- **XAF**: Central African CFA Franc
- **USD**: US Dollar
- **EUR**: Euro
- **GBP**: British Pound

### 2. Currency Utility Functions (`lib/currency-utils.ts`)

The core currency formatting functions now accept an optional `currencyCode` parameter:

#### Main Functions

```typescript
// Format with specified currency (or default to XOF)
formatCurrency(amount: number, currencyCode?: string): string

// Format without currency symbol
formatAmount(amount: number, currencyCode?: string): string

// Format with decimals
formatCurrencyWithDecimals(amount: number, currencyCode?: string): string

// Format range
formatCurrencyRange(min: number, max: number, currencyCode?: string): string
```

#### Context-Specific Functions

```typescript
// Optimized for different display contexts
formatCurrencyForTable(amount: number, currencyCode?: string): string
formatCurrencyForCard(amount: number, currencyCode?: string): string
formatCurrencyForForm(amount: number, currencyCode?: string): string
formatCurrencyForPDF(amount: number, currencyCode?: string): string
formatCurrencyForReceipt(amount: number, currencyCode?: string): string
```

#### Utility Functions

```typescript
// Get currency information
getCurrencySymbol(currencyCode?: string): string
getCurrencyName(currencyCode?: string): string

// Validation
isValidCurrency(amount: number): boolean

// Parsing
parseCurrency(currencyString: string): number
```

### 3. Global Currency Hook (`lib/app-configuration-context-v2.tsx`)

Two hooks are available for accessing and formatting with the global currency:

#### useGlobalCurrency()

Returns the current currency code from app configuration:

```typescript
const currency = useGlobalCurrency() // Returns 'XOF', 'USD', etc.
```

#### useCurrencyFormatter()

Returns an object with currency formatting functions that automatically use the global currency:

```typescript
const {
  formatCurrency,
  formatAmount,
  formatCurrencyWithDecimals,
  formatCurrencyRange,
  formatCurrencyForTable,
  formatCurrencyForCard,
  formatCurrencyForForm,
  formatCurrencyForPDF,
  formatCurrencyForReceipt,
  getCurrencySymbol,
  getCurrencyName,
  currency
} = useCurrencyFormatter()

// Usage - currency is automatically applied
const formattedAmount = formatCurrency(50000) // "XOF 50,000" or "USD 50,000" depending on config
```

## Usage Guide

### For React Components

Use the `useCurrencyFormatter` hook in any React component:

```typescript
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

export function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter()
  
  return (
    <div>
      <p>Total: {formatCurrency(50000)}</p>
    </div>
  )
}
```

### For Server-Side Code

Import the currency utilities and pass the currency code:

```typescript
import { formatCurrency } from '@/lib/currency-utils'

// Get currency from app configuration
const currency = configuration.currency || 'XOF'

// Use with formatting functions
const formattedAmount = formatCurrency(50000, currency)
```

### For PDF Generators

PDF generator methods accept an optional `currencyCode` parameter:

```typescript
import { pdfGenerator } from '@/lib/pdf-generator'

// Generate PDF with specific currency
const pdfBuffer = await pdfGenerator.generateFinancialReport(
  reportData,
  pdfOptions,
  'USD' // Currency code
)
```

## Migration Guide

### Existing Components

Most components will work without changes since the default value is 'XOF'. To use the dynamic currency:

**Before:**
```typescript
import { formatCurrency } from '@/lib/currency-utils'

export function MyComponent() {
  return <div>{formatCurrency(amount)}</div>
}
```

**After:**
```typescript
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

export function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter()
  return <div>{formatCurrency(amount)}</div>
}
```

### PDF Generators

**Before:**
```typescript
const pdf = await pdfGenerator.generateFinancialReport(data, options)
```

**After:**
```typescript
const currency = useGlobalCurrency()
const pdf = await pdfGenerator.generateFinancialReport(data, options, currency)
```

## Updated Components

The following components have been updated to use the dynamic currency:

### UI Components
- `components/bursar/bursar-dashboard.tsx`
- `components/bursar/payment-recording.tsx`
- `components/bursar/fee-structure-management.tsx`
- `components/bursar/payment-details-dialog.tsx`
- `components/dashboard.tsx`

### Report Components
- `components/bursar/reports/revenue-report.tsx`
- `components/bursar/reports/outstanding-report.tsx`
- `components/bursar/reports/collection-report.tsx`

### Admin Components
- `components/admin/enhanced-fee-structure-management.tsx`

### PDF Generators
- `lib/pdf-generator.ts`
- `lib/simple-pdf-generator.ts`

## Setting Currency

### Via Admin UI

1. Navigate to Admin Dashboard > App Configuration
2. Scroll to System Settings section
3. Select desired currency from the Currency dropdown
4. Click "Save Configuration"
5. All currency displays throughout the app will immediately use the new currency

### Via API

```typescript
// Update configuration
const response = await fetch('/api/configuration-v2', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currency: 'USD'
  })
})
```

### Via Database

```sql
UPDATE app_configuration 
SET currency = 'EUR', updated_at = NOW() 
WHERE id = (SELECT id FROM app_configuration LIMIT 1);
```

## Benefits

1. **Consistency**: All currency displays use the same format from a single source
2. **Flexibility**: Easy to support multiple currencies for different schools
3. **Maintainability**: Single point of change for currency configuration
4. **User-Friendly**: Admin can change currency without code changes
5. **Type Safety**: TypeScript ensures proper usage
6. **Performance**: Efficient formatting with memoization in hooks
7. **Backward Compatible**: Existing code continues to work

## Technical Details

### Currency Formatting

The implementation uses JavaScript's `Intl.NumberFormat` API for proper currency formatting:

```typescript
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currencyCode,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(amount)
```

### Error Handling

If an invalid currency code is provided, the function logs an error and returns a fallback format:

```typescript
try {
  return new Intl.NumberFormat(locale, { ... }).format(amount)
} catch (error) {
  console.error(`Invalid currency code: ${currencyCode}`, error)
  return `${currencyCode} ${amount.toLocaleString(locale)}`
}
```

### Memoization

The `useCurrencyFormatter` hook uses `useMemo` to optimize performance:

```typescript
const formatter = useMemo(() => {
  // Create formatter functions
  return { formatCurrency, formatAmount, ... }
}, [currency]) // Only recreate when currency changes
```

## Future Enhancements

Potential improvements for the currency system:

1. **Locale-Based Formatting**: Use different number formats based on locale
2. **Currency Conversion**: Support displaying amounts in multiple currencies
3. **Historical Rates**: Track currency exchange rates over time
4. **Custom Currency Symbols**: Allow custom symbols for specific currencies
5. **Decimal Precision**: Configurable decimal places per currency
6. **Currency Validation**: Enhanced validation for currency values

## Troubleshooting

### Currency Not Updating

1. Check that app configuration has been saved properly
2. Verify the currency value in the database
3. Clear browser cache and reload the application
4. Check that components are using `useCurrencyFormatter` hook

### Formatting Issues

1. Ensure the currency code is a valid ISO 4217 code
2. Check browser console for error messages
3. Verify that the `Intl` API is supported in the browser

### PDF Generation Issues

1. Ensure the currency parameter is passed to PDF generation methods
2. Check that the PDF generator has access to the currency configuration
3. Verify the generated HTML includes proper currency formatting

## Related Documentation

- [Currency Update Summary](./currency-update-summary.md)
- [Original Currency Implementation](./currency-implementation.md)
- [App Configuration Guide](./app-configuration.md)

## Support

For questions or issues with currency implementation, please:
1. Check this documentation
2. Review the source code in `lib/currency-utils.ts` and `lib/app-configuration-context-v2.tsx`
3. Contact the development team

