# Currency Formatting - Quick Reference

## TL;DR

All currency in the app now uses the currency set by the admin in **App Configuration** → **System Settings** → **Currency**.

## For React Components

Use the `useCurrencyFormatter` hook:

```typescript
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

export function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter()
  
  return (
    <div>
      <p>Amount: {formatCurrency(50000)}</p>
      {/* Will display: "XOF 50,000" or "USD 50,000" based on config */}
    </div>
  )
}
```

## Available Functions from useCurrencyFormatter()

```typescript
const {
  formatCurrency,              // Format with symbol: "XOF 50,000"
  formatAmount,                // Without symbol: "50,000"
  formatCurrencyWithDecimals, // With decimals: "XOF 50,000.00"
  formatCurrencyRange,        // Range: "XOF 10,000 - XOF 20,000"
  formatCurrencyForTable,     // Table display
  formatCurrencyForCard,      // Card/dashboard display
  formatCurrencyForForm,      // Form display
  formatCurrencyForPDF,       // PDF report display
  formatCurrencyForReceipt,   // Receipt display
  getCurrencySymbol,          // Get symbol: "XOF"
  getCurrencyName,            // Get name: "West African CFA Franc"
  currency                    // Current currency code
} = useCurrencyFormatter()
```

## For Server-Side / API

```typescript
import { formatCurrency } from '@/lib/currency-utils'

// Pass currency code explicitly
const formatted = formatCurrency(amount, 'USD')
```

## For PDF Generation

```typescript
import { pdfGenerator } from '@/lib/pdf-generator'
import { useGlobalCurrency } from '@/lib/app-configuration-context-v2'

const currency = useGlobalCurrency()
const pdf = await pdfGenerator.generateFinancialReport(data, options, currency)
```

## Supported Currencies

| Code | Currency Name |
|------|--------------|
| XOF  | West African CFA Franc (default) |
| XAF  | Central African CFA Franc |
| USD  | US Dollar |
| EUR  | Euro |
| GBP  | British Pound |

## Examples

### Basic Usage

```typescript
const { formatCurrency } = useCurrencyFormatter()

formatCurrency(50000)                    // "XOF 50,000"
formatCurrency(1234.56)                  // "XOF 1,235"
formatCurrencyWithDecimals(1234.56)      // "XOF 1,234.56"
formatAmount(50000)                      // "50,000"
formatCurrencyRange(10000, 20000)        // "XOF 10,000 - XOF 20,000"
```

### In Tables

```typescript
<TableCell>{formatCurrencyForTable(payment.amount)}</TableCell>
```

### In Cards/Dashboards

```typescript
<div className="text-2xl font-bold">
  {formatCurrencyForCard(totalRevenue)}
</div>
```

### In Forms

```typescript
<Input 
  placeholder={`Amount (${getCurrencySymbol()})`}
  value={formatCurrencyForForm(amount)} 
/>
```

## Common Patterns

### Dashboard Stats

```typescript
export function Dashboard() {
  const { formatCurrency } = useCurrencyFormatter()
  const stats = useFinancialStats()
  
  return (
    <Card>
      <CardTitle>Revenue</CardTitle>
      <CardContent>
        <p className="text-3xl">{formatCurrency(stats.revenue)}</p>
      </CardContent>
    </Card>
  )
}
```

### Payment Tables

```typescript
export function PaymentList({ payments }) {
  const { formatCurrency } = useCurrencyFormatter()
  
  return (
    <Table>
      <TableBody>
        {payments.map(payment => (
          <TableRow key={payment.id}>
            <TableCell>{payment.student}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Reports

```typescript
export function RevenueReport() {
  const { formatCurrency, getCurrencyName } = useCurrencyFormatter()
  
  return (
    <div>
      <h2>Revenue Report</h2>
      <p>All amounts in {getCurrencyName()}</p>
      <p>Total: {formatCurrency(totalRevenue)}</p>
    </div>
  )
}
```

### PDF Generation

```typescript
export async function generateReceipt(paymentData) {
  const currency = useGlobalCurrency()
  
  const pdf = await pdfGenerator.generateFinancialReport(
    paymentData,
    { format: 'A4' },
    currency
  )
  
  return pdf
}
```

## Changing Currency (Admin)

1. Navigate to **Admin Dashboard**
2. Click **App Configuration**
3. Scroll to **System Settings**
4. Select currency from dropdown
5. Click **Save Configuration**
6. All displays update automatically

## Migration from Old Code

### Before (Hardcoded XOF)
```typescript
import { formatCurrency } from '@/lib/currency-utils'

export function MyComponent() {
  return <div>{formatCurrency(amount)}</div>
}
```

### After (Dynamic Currency)
```typescript
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'

export function MyComponent() {
  const { formatCurrency } = useCurrencyFormatter()
  return <div>{formatCurrency(amount)}</div>
}
```

## Common Mistakes

❌ **Don't**: Import formatCurrency directly without passing currency
```typescript
import { formatCurrency } from '@/lib/currency-utils'
formatCurrency(amount) // Uses default XOF
```

✅ **Do**: Use the hook for automatic currency
```typescript
const { formatCurrency } = useCurrencyFormatter()
formatCurrency(amount) // Uses configured currency
```

❌ **Don't**: Hardcode currency symbols
```typescript
<p>XOF {amount.toLocaleString()}</p>
```

✅ **Do**: Use formatting functions
```typescript
<p>{formatCurrency(amount)}</p>
```

## Troubleshooting

### Currency not updating?
- Clear browser cache
- Check database: `SELECT currency FROM app_configuration`
- Verify component uses `useCurrencyFormatter` hook

### Wrong format?
- Check browser supports `Intl.NumberFormat`
- Verify currency code is valid ISO 4217

### PDF shows wrong currency?
- Ensure currency parameter is passed to PDF generator
- Check that PDF method receives currency from config

## Need More Details?

See [Dynamic Currency Implementation Guide](./dynamic-currency-implementation.md) for comprehensive documentation.

---

**Quick Start**: Use `useCurrencyFormatter()` hook in all React components that display currency!

