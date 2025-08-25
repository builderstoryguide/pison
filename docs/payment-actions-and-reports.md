# Payment Actions and Report Generation Features

## Overview

This document outlines the implementation of payment transaction quick actions and comprehensive financial report generation capabilities for the Bursar module.

## Payment Transaction Quick Actions

### Features Implemented

#### 1. View Details
- **Component**: `PaymentDetailsDialog`
- **Location**: `components/bursar/payment-details-dialog.tsx`
- **Functionality**: 
  - Displays comprehensive payment information in a modal dialog
  - Shows student details, payment method, amount, date, and status
  - Includes additional information like description, reference number, and notes
  - Provides visual status indicators with appropriate badges

#### 2. Print Receipt
- **Functionality**:
  - Generates formatted HTML receipt with school branding
  - Opens print dialog in new window
  - Includes all payment details in professional layout
  - Supports print-specific CSS styling

#### 3. Download Receipt
- **Functionality**:
  - Downloads receipt as HTML file
  - Generates unique filename with receipt number
  - Maintains formatting and styling
  - Can be opened in any web browser

### Implementation Details

#### Payment Details Dialog Structure
```typescript
interface Payment {
  id: string
  studentName: string
  studentNumber: string
  receiptNumber: string
  amount: number
  paymentMethodName: string
  paymentDate: string
  status: string
  description?: string
  referenceNumber?: string
  notes?: string
  collectorName?: string
  createdAt: string
}
```

#### Receipt Generation
- Uses HTML template with embedded CSS
- Includes school branding and official receipt styling
- Supports print media queries for optimal printing
- Generates unique receipt numbers automatically

## Financial Report Generation

### Database Setup

#### 1. Database Views and Functions
**File**: `scripts/bursar-reports-setup.sql`

##### Collection Report View
```sql
CREATE OR REPLACE VIEW collection_report_view AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    pm.name as payment_method,
    COUNT(p.id) as total_transactions,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as average_amount,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.collected_by) as unique_collectors
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'completed'
GROUP BY month, pm.name, pm.code
ORDER BY month DESC, total_amount DESC;
```

##### Outstanding Balances View
```sql
CREATE OR REPLACE VIEW outstanding_balances_view AS
SELECT 
    s.first_name, s.last_name, s.student_id,
    c.name as class_name,
    fs.name as fee_structure_name,
    sf.total_amount, sf.paid_amount, sf.balance_amount,
    CASE 
        WHEN sf.due_date < CURRENT_DATE AND sf.balance_amount > 0 THEN 'overdue'
        WHEN sf.balance_amount > 0 THEN 'outstanding'
        ELSE 'paid'
    END as payment_status,
    CASE 
        WHEN sf.due_date < CURRENT_DATE AND sf.balance_amount > 0 
        THEN CURRENT_DATE - sf.due_date 
        ELSE 0 
    END as days_overdue
FROM student_fees sf
JOIN students s ON sf.student_id = s.id
JOIN classes c ON s.class_id = c.id
JOIN fee_structures fs ON sf.fee_structure_id = fs.id
WHERE sf.balance_amount > 0
ORDER BY days_overdue DESC, sf.balance_amount DESC;
```

##### Revenue Trends View
```sql
CREATE OR REPLACE VIEW revenue_trends_view AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    c.name as class_name,
    fc.name as fee_category,
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_payment,
    COUNT(DISTINCT p.student_id) as unique_students
FROM payments p
JOIN student_fees sf ON p.student_fee_id = sf.id
JOIN fee_structures fs ON sf.fee_structure_id = fs.id
JOIN classes c ON fs.class_id = c.id
JOIN fee_structure_items fsi ON fs.id = fsi.fee_structure_id
JOIN fee_categories fc ON fsi.fee_category_id = fc.id
WHERE p.status = 'completed'
GROUP BY month, c.name, fc.name, fc.code
ORDER BY month DESC, total_revenue DESC;
```

#### 2. Database Functions
- `generate_collection_report()` - Generates collection reports with filtering
- `generate_outstanding_report()` - Generates outstanding balances reports
- `generate_revenue_report()` - Generates revenue trends reports
- `refresh_financial_summary()` - Refreshes materialized views

#### 3. Performance Optimizations
- Database indexes on frequently queried columns
- Materialized view for financial summary data
- Automatic refresh triggers on payment updates

### API Routes

#### 1. Collection Report API
**Endpoint**: `GET /api/bursar/reports/collection`
**Parameters**:
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `paymentMethodId` (optional): Filter by payment method
- `format` (optional): 'json' or 'csv' for export

#### 2. Outstanding Report API
**Endpoint**: `GET /api/bursar/reports/outstanding`
**Parameters**:
- `classId` (optional): Filter by class
- `academicYear` (optional): Filter by academic year
- `term` (optional): Filter by term
- `status` (optional): Filter by payment status
- `format` (optional): 'json' or 'csv' for export

#### 3. Revenue Report API
**Endpoint**: `GET /api/bursar/reports/revenue`
**Parameters**:
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `classId` (optional): Filter by class
- `feeCategoryId` (optional): Filter by fee category
- `format` (optional): 'json' or 'csv' for export

### Report Components

#### 1. Collection Report Component
**File**: `components/bursar/reports/collection-report.tsx`
**Features**:
- Date range filtering
- Payment method filtering
- Summary statistics cards
- Detailed data table
- CSV and JSON export options

#### 2. Outstanding Report Component
**File**: `components/bursar/reports/outstanding-report.tsx`
**Features**:
- Class, academic year, and term filtering
- Status-based filtering (outstanding/overdue)
- Summary statistics with overdue tracking
- Detailed student balance table
- Export functionality

#### 3. Revenue Report Component
**File**: `components/bursar/reports/revenue-report.tsx`
**Features**:
- Date range and class filtering
- Fee category filtering
- Revenue trend analysis
- Top performer identification
- Comprehensive data visualization

### Integration with Dashboard

#### Updated Bursar Dashboard
**File**: `components/bursar/bursar-dashboard.tsx`
**Changes**:
- Integrated payment details dialog
- Added report components as tabs
- Enhanced payment transaction actions
- Improved navigation between reports

#### New Tab Structure
1. **Overview** - Financial dashboard overview
2. **Fee Structures** - Fee structure management
3. **Payment Recording** - Student payment recording
4. **Reports** - General reports overview
5. **Collection Report** - Detailed collection analysis
6. **Outstanding Report** - Outstanding balances analysis
7. **Revenue Report** - Revenue trends analysis

## Usage Instructions

### Payment Actions

#### Viewing Payment Details
1. Navigate to Payment Transactions tab
2. Click the actions menu (three dots) for any payment
3. Select "View Details"
4. Review payment information in the modal dialog

#### Printing Receipts
1. Open payment details dialog
2. Click "Print Receipt" button
3. Review print preview
4. Confirm printing

#### Downloading Receipts
1. Open payment details dialog
2. Click "Download Receipt" button
3. File will be downloaded automatically
4. Open in web browser for viewing

### Report Generation

#### Collection Report
1. Navigate to Collection Report tab
2. Set date range filters (optional)
3. Select payment method filter (optional)
4. Click "Generate Report"
5. Review summary statistics and detailed data
6. Export as CSV or JSON if needed

#### Outstanding Report
1. Navigate to Outstanding Report tab
2. Set class, academic year, and term filters (optional)
3. Select status filter (optional)
4. Click "Generate Report"
5. Review outstanding balances and overdue information
6. Export data as needed

#### Revenue Report
1. Navigate to Revenue Report tab
2. Set date range and class filters (optional)
3. Select fee category filter (optional)
4. Click "Generate Report"
5. Review revenue trends and top performers
6. Export for further analysis

## Technical Specifications

### Database Requirements
- PostgreSQL 12+ with advanced features
- Proper indexing for performance
- Materialized view support
- Function and trigger capabilities

### Frontend Requirements
- React 18+ with TypeScript
- Shadcn UI components
- Lucide React icons
- Toast notifications

### API Requirements
- Next.js 13+ with App Router
- Supabase client integration
- Proper error handling
- CSV export functionality

## Security Considerations

### Data Access
- All reports require authentication
- User permissions checked for sensitive data
- Audit trail for report generation
- Secure file downloads

### Data Privacy
- Student information protected
- Payment details encrypted
- Access logs maintained
- GDPR compliance considerations

## Performance Optimizations

### Database
- Optimized queries with proper joins
- Indexed columns for fast filtering
- Materialized views for summary data
- Connection pooling

### Frontend
- Lazy loading of report components
- Debounced filter inputs
- Efficient state management
- Optimized re-renders

### API
- Cached responses where appropriate
- Efficient data transformation
- Streaming for large datasets
- Proper error handling

## Future Enhancements

### Planned Features
1. **Chart Visualizations** - Add charts and graphs to reports
2. **Scheduled Reports** - Automated report generation and email delivery
3. **Advanced Filtering** - More granular filter options
4. **Report Templates** - Customizable report layouts
5. **PDF Export** - Direct PDF generation for reports
6. **Real-time Updates** - Live data updates in reports

### Technical Improvements
1. **Caching Strategy** - Implement Redis caching for reports
2. **Background Jobs** - Use queue system for large reports
3. **API Rate Limiting** - Protect against abuse
4. **Data Archiving** - Historical data management
5. **Audit Logging** - Comprehensive activity tracking

## Troubleshooting

### Common Issues

#### Report Generation Fails
- Check database connectivity
- Verify user permissions
- Review filter parameters
- Check for data consistency

#### Export Not Working
- Verify browser download settings
- Check file size limits
- Ensure proper MIME types
- Review network connectivity

#### Performance Issues
- Check database indexes
- Review query optimization
- Monitor server resources
- Consider data partitioning

### Support
For technical support or feature requests, please refer to the main project documentation or contact the development team.

