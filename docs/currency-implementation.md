# XOF Currency Implementation

## Overview

This document outlines the centralized XOF (West African CFA franc) currency implementation in the school management application. All currency displays throughout the application now consistently use XOF formatting.

## Implementation Details

### 1. Centralized Currency Utility (`lib/currency-utils.ts`)

The application now uses a centralized currency utility that provides consistent XOF formatting across all components.

#### Key Functions:

- **`formatCurrency(amount: number)`**: Formats amount with XOF symbol (default)
- **`formatXOF(amount: number, options)`**: Advanced formatting with options
- **`formatAmount(amount: number)`**: Formats amount without currency symbol
- **`formatCurrencyWithDecimals(amount: number)`**: Formats with decimal places
- **`parseCurrency(currencyString: string)`**: Parses currency strings to numbers
- **`isValidCurrency(amount: number)`**: Validates currency values

#### Usage Examples:

```typescript
import { formatCurrency, formatXOF, formatAmount } from '@/lib/currency-utils'

// Basic formatting
formatCurrency(50000) // "XOF 50,000"

// With options
formatXOF(50000, { showSymbol: false, showDecimals: true }) // "50,000.00"

// Without symbol
formatAmount(50000) // "50,000"
```

### 2. Updated Components

The following components have been updated to use the centralized currency utility:

#### Bursar Components:
- `components/bursar/payment-recording.tsx`
- `components/bursar/bursar-dashboard.tsx`
- `components/bursar/fee-structure-management.tsx`
- `components/bursar/payment-details-dialog.tsx`

#### Report Components:
- `components/bursar/reports/revenue-report.tsx`
- `components/bursar/reports/outstanding-report.tsx`
- `components/bursar/reports/collection-report.tsx`

#### PDF Generators:
- `lib/pdf-generator.ts`
- `lib/simple-pdf-generator.ts`

#### Context Providers:
- `lib/financial-context.tsx`

### 3. Currency Format Specifications

#### Default Format:
- **Currency Code**: XOF (West African CFA franc)
- **Symbol**: XOF
- **Locale**: en-US
- **Decimal Places**: 0 (no decimals)
- **Thousands Separator**: Comma (,)

#### Examples:
```typescript
// Input: 50000
// Output: "XOF 50,000"

// Input: 125000
// Output: "XAF 125,000"

// Input: 1000000
// Output: "XAF 1,000,000"
```

### 4. Specialized Formatting Functions

#### For Different Display Contexts:

- **`formatCurrencyForTable(amount)`**: Optimized for table displays
- **`formatCurrencyForCard(amount)`**: Optimized for card/dashboard displays
- **`formatCurrencyForForm(amount)`**: Optimized for form inputs
- **`formatCurrencyForPDF(amount)`**: Optimized for PDF reports
- **`formatCurrencyForReceipt(amount)`**: Optimized for receipt displays

#### Utility Functions:

- **`formatCurrencyRange(min, max)`**: Formats amount ranges
- **`formatCurrencyPercentage(amount, total)`**: Formats percentages
- **`getCurrencySymbol()`**: Returns XAF symbol
- **`getCurrencyName()`**: Returns full currency name

### 5. Database Integration

All financial data in the database is stored as decimal values without currency formatting. The currency formatting is applied at the presentation layer using the centralized utility.

#### Database Schema:
```sql
-- Fee structures
amount DECIMAL(10,2) NOT NULL

-- Payments
amount DECIMAL(10,2) NOT NULL

-- Student fee assignments
total_amount DECIMAL(10,2) NOT NULL
paid_amount DECIMAL(10,2) DEFAULT 0
balance_amount DECIMAL(10,2) NOT NULL
```

### 6. Benefits of Centralized Implementation

1. **Consistency**: All currency displays use the same format
2. **Maintainability**: Single point of change for currency formatting
3. **Localization Ready**: Easy to switch to different currencies if needed
4. **Type Safety**: TypeScript interfaces ensure proper usage
5. **Performance**: Optimized formatting functions
6. **Flexibility**: Multiple formatting options for different contexts

### 7. Migration from Previous Implementation

The previous implementation had currency formatting scattered across multiple components using `Intl.NumberFormat` directly. This has been replaced with the centralized utility.

#### Before:
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount)
}
```

#### After:
```typescript
import { formatCurrency } from '@/lib/currency-utils'
// Use formatCurrency(amount) directly
```

### 8. Testing Currency Formatting

To test the currency formatting, you can use the utility functions directly:

```typescript
import { formatCurrency, formatXAF, parseCurrency } from '@/lib/currency-utils'

// Test basic formatting
console.log(formatCurrency(50000)) // "XAF 50,000"

// Test parsing
console.log(parseCurrency("XAF 50,000")) // 50000

// Test validation
console.log(isValidCurrency(50000)) // true
console.log(isValidCurrency(-100)) // false
```

### 9. Future Enhancements

The centralized currency utility is designed to support future enhancements:

1. **Multi-currency Support**: Easy to add support for other currencies
2. **Locale-specific Formatting**: Support for different locales
3. **Exchange Rate Integration**: Real-time exchange rate calculations
4. **Currency Conversion**: Automatic conversion between currencies
5. **Custom Formatting**: User-defined currency formats

### 10. Best Practices

1. **Always use the centralized utility**: Don't create local currency formatting functions
2. **Use appropriate formatting functions**: Choose the right function for the context
3. **Validate currency values**: Use `isValidCurrency()` before formatting
4. **Handle edge cases**: Always handle null, undefined, or invalid values
5. **Test formatting**: Verify currency displays in different contexts

## Conclusion

The centralized XAF currency implementation ensures consistent currency formatting throughout the school management application. All financial displays now properly show amounts in Central African CFA franc (XAF) with appropriate formatting for different contexts.
