# Currency Migration to Dynamic Configuration

## Executive Summary

The application has been successfully migrated from a hardcoded XOF currency system to a **dynamic currency system** where the admin can configure the currency used throughout the entire application via the App Configuration settings.

## What Changed

### Before
- Currency was hardcoded to XOF (West African CFA Franc)
- All components used XOF formatting regardless of actual school needs
- Changing currency required code modifications

### After
- Currency is configured by admin in App Configuration
- All components automatically use the configured currency
- Supports multiple currencies: XOF, XAF, USD, EUR, GBP
- No code changes needed to switch currencies
- Easy to add support for new currencies

## Key Benefits

1. **Flexibility**: Schools in different regions can use their local currency
2. **User-Friendly**: Admin can change currency through the UI
3. **Consistency**: Single source of truth for currency throughout the app
4. **Maintainable**: Centralized currency configuration
5. **Backward Compatible**: Existing code continues to work (defaults to XOF)

## Implementation Details

### 1. Currency Utilities Enhanced

**File**: `lib/currency-utils.ts`

- All functions now accept an optional `currencyCode` parameter
- Default value is 'XOF' for backward compatibility
- Supports error handling for invalid currency codes

**Updated Functions**:
- `formatCurrency(amount, currencyCode?)`
- `formatAmount(amount, currencyCode?)`
- `formatCurrencyWithDecimals(amount, currencyCode?)`
- `formatCurrencyRange(min, max, currencyCode?)`
- `formatCurrencyForTable(amount, currencyCode?)`
- `formatCurrencyForCard(amount, currencyCode?)`
- `formatCurrencyForForm(amount, currencyCode?)`
- `formatCurrencyForPDF(amount, currencyCode?)`
- `formatCurrencyForReceipt(amount, currencyCode?)`
- `getCurrencySymbol(currencyCode?)`
- `getCurrencyName(currencyCode?)`

### 2. New Currency Formatter Hook

**File**: `lib/app-configuration-context-v2.tsx`

Added `useCurrencyFormatter()` hook that provides currency formatting functions that automatically use the global currency from app configuration.

**Usage Example**:
```typescript
const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter()
const formatted = formatCurrency(50000) // Automatically uses configured currency
```

### 3. Updated Components

The following components now use the `useCurrencyFormatter` hook:

#### Bursar Components
- `components/bursar/bursar-dashboard.tsx`
- `components/bursar/payment-recording.tsx`
- `components/bursar/fee-structure-management.tsx`
- `components/bursar/payment-details-dialog.tsx`

#### Reports
- `components/bursar/reports/revenue-report.tsx`
- `components/bursar/reports/outstanding-report.tsx`
- `components/bursar/reports/collection-report.tsx`

#### Admin Components
- `components/admin/enhanced-fee-structure-management.tsx`

#### Main Dashboard
- `components/dashboard.tsx`

### 4. PDF Generators Updated

**Files**: `lib/pdf-generator.ts`, `lib/simple-pdf-generator.ts`

All PDF generation methods now accept an optional `currencyCode` parameter:

```typescript
// PDFGenerator methods
generateFinancialReport(data, options, currencyCode?)
generatePaymentReport(payments, options, currencyCode?)
generateFeeStructureReport(feeStructures, options, currencyCode?)
generateOutstandingFeesReport(assignments, options, currencyCode?)

// SimplePDFGenerator methods (same signatures)
```

### 5. Documentation Created/Updated

- **New**: `docs/dynamic-currency-implementation.md` - Comprehensive guide
- **Updated**: `docs/currency-implementation.md` - Marked as legacy, references new doc

## How to Use

### For Administrators

1. Go to **Admin Dashboard** → **App Configuration**
2. Scroll to **System Settings** section
3. Select desired currency from **Currency** dropdown:
   - XOF - West African CFA Franc
   - XAF - Central African CFA Franc
   - USD - US Dollar
   - EUR - Euro
   - GBP - British Pound
4. Click **Save Configuration**
5. All currency displays throughout the app will immediately update

### For Developers

#### In React Components

```typescript
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

export function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter()
  
  return <div>{formatCurrency(amount)}</div>
}
```

#### In Server-Side Code

```typescript
import { formatCurrency } from '@/lib/currency-utils'

// Get currency from configuration
const currency = configuration.currency || 'XOF'

// Use with formatting
const formatted = formatCurrency(amount, currency)
```

#### In PDF Generation

```typescript
import { pdfGenerator } from '@/lib/pdf-generator'

const currency = useGlobalCurrency()
const pdf = await pdfGenerator.generateFinancialReport(data, options, currency)
```

## Migration Path for Existing Code

### No Changes Needed (Backward Compatible)
Existing code will continue to work with XOF as the default:

```typescript
formatCurrency(50000) // Still works, defaults to XOF
```

### Recommended Update
To use the dynamic currency, update to use the hook:

```typescript
// Before
import { formatCurrency } from '@/lib/currency-utils'
<div>{formatCurrency(amount)}</div>

// After
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'
const { formatCurrency } = useCurrencyFormatter()
<div>{formatCurrency(amount)}</div>
```

## Testing Checklist

- [x] Currency utilities accept and properly format with different currency codes
- [x] useCurrencyFormatter hook provides correct formatting functions
- [x] Components display currency from app configuration
- [x] PDF generators include currency in reports
- [x] Admin can change currency via UI
- [x] Currency persists in database
- [x] No linter errors introduced
- [x] Backward compatibility maintained
- [x] Documentation updated

## Technical Architecture

```
┌─────────────────────────────────────┐
│   App Configuration (Database)      │
│   - currency: 'XOF' | 'USD' | ...   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  AppConfigurationProvider (Context) │
│  - Loads configuration from DB       │
│  - Provides useGlobalCurrency()      │
│  - Provides useCurrencyFormatter()   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Currency Utilities                  │
│  - formatCurrency(amount, currency)  │
│  - Other formatting functions        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  UI Components                       │
│  - Use useCurrencyFormatter() hook   │
│  - Display formatted currency        │
└─────────────────────────────────────┘
```

## Database Schema

```sql
-- app_configuration table
currency VARCHAR(10) DEFAULT 'XOF'
```

Available values:
- 'XOF' - West African CFA Franc (default)
- 'XAF' - Central African CFA Franc
- 'USD' - US Dollar
- 'EUR' - Euro
- 'GBP' - British Pound

## Files Modified

### Core Libraries
- `lib/currency-utils.ts` - Enhanced with currency parameter support
- `lib/app-configuration-context-v2.tsx` - Added useCurrencyFormatter hook
- `lib/pdf-generator.ts` - Added currency parameter to all methods
- `lib/simple-pdf-generator.ts` - Added currency parameter to all methods

### Components (10 files)
- `components/bursar/bursar-dashboard.tsx`
- `components/bursar/payment-recording.tsx`
- `components/bursar/fee-structure-management.tsx`
- `components/bursar/payment-details-dialog.tsx`
- `components/bursar/reports/revenue-report.tsx`
- `components/bursar/reports/outstanding-report.tsx`
- `components/bursar/reports/collection-report.tsx`
- `components/admin/enhanced-fee-structure-management.tsx`
- `components/dashboard.tsx`

### Documentation (3 files)
- `docs/dynamic-currency-implementation.md` - NEW: Comprehensive guide
- `docs/currency-implementation.md` - Updated to reference new implementation
- `docs/CURRENCY_MIGRATION_SUMMARY.md` - This file

## Future Enhancements

Potential improvements:
1. Currency conversion/exchange rates
2. Multiple currency display
3. Locale-based number formatting
4. Custom currency symbols
5. Historical currency tracking
6. Configurable decimal precision per currency

## Support & Troubleshooting

### Currency Not Updating
1. Verify configuration is saved in database
2. Clear browser cache
3. Check that components use useCurrencyFormatter hook

### Invalid Currency Code
1. Check browser console for errors
2. Verify currency code is valid ISO 4217
3. Add new currency to getCurrencyName() mapping if needed

### PDF Generation Issues
1. Ensure currency parameter is passed to PDF methods
2. Check that PDF generator has access to configuration
3. Verify HTML output includes proper formatting

## Related Resources

- [Dynamic Currency Implementation Guide](./dynamic-currency-implementation.md)
- [App Configuration Documentation](./app-configuration.md)
- [Bursar Features Guide](./bursar-feature.md)

## Contact

For questions or issues:
1. Review documentation
2. Check source code comments
3. Contact development team

---

**Migration Date**: November 13, 2025
**Status**: ✅ Complete
**Backward Compatible**: Yes
**Breaking Changes**: None

