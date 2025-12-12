# Bursar Financial Management Features

## Overview

The Bursar module provides comprehensive financial management capabilities for the school management system, allowing bursars to manage fee structures, record student payments, and generate financial reports.

## Features Implemented

### 1. Fee Structure Management

#### CRUD Operations
- **Create**: Bursars can create new fee structures for different classes and terms
- **Read**: View all fee structures with filtering and search capabilities
- **Update**: Modify existing fee structures (name, due date, items, status)
- **Delete**: Bursars and Admins can remove fee structures (with validation to prevent deletion of assigned structures)

#### Key Components
- **Fee Structure Table**: Displays all fee structures with class, academic year, term, and total amount
- **Search & Filter**: Filter by class, academic year, term, and status
- **Fee Items Management**: Add/remove fee categories and amounts
- **Status Management**: Activate/deactivate fee structures

#### API Endpoints
```
GET    /api/bursar/fee-structures          - List all fee structures
POST   /api/bursar/fee-structures          - Create new fee structure
GET    /api/bursar/fee-structures/[id]     - Get specific fee structure
PUT    /api/bursar/fee-structures/[id]     - Update fee structure
DELETE /api/bursar/fee-structures/[id]     - Delete fee structure
```

### 2. Payment Recording

#### Payment Management
- **Record Payments**: Record student payments with receipt generation
- **Payment History**: View all payment transactions
- **Payment Updates**: Modify payment details and cancel payments
- **Receipt Generation**: Automatic receipt number generation

#### Key Features
- **Student Fee Balance**: View current fee balances for all students
- **Payment Methods**: Support for multiple payment methods (Cash, Bank Transfer, Mobile Money, etc.)
- **Payment Validation**: Ensure payment amounts don't exceed outstanding balances
- **Status Tracking**: Track payment status (completed, pending, cancelled)

#### API Endpoints
```
GET    /api/bursar/payments                - List all payments
POST   /api/bursar/payments                - Record new payment
GET    /api/bursar/payments/[id]           - Get specific payment
PUT    /api/bursar/payments/[id]           - Update payment
DELETE /api/bursar/payments/[id]           - Cancel payment
```

### 3. Student Fee Management

#### Fee Assignment
- **Assign Fees**: Assign fee structures to individual students
- **Balance Tracking**: Automatic calculation of paid vs outstanding amounts
- **Status Updates**: Automatic status updates based on payment progress

#### API Endpoints
```
GET    /api/bursar/student-fees            - List student fee assignments
POST   /api/bursar/student-fees            - Create student fee assignment
```

### 4. Supporting Data Management

#### Fee Categories
- **Predefined Categories**: Tuition, Registration, Examination, Library, etc.
- **Mandatory vs Optional**: Distinguish between required and optional fees
- **Active/Inactive**: Manage fee category availability

#### Payment Methods
- **Multiple Methods**: Cash, Bank Transfer, Mobile Money, Cheque, Credit Card
- **Receipt Requirements**: Configure which methods require receipts
- **Active/Inactive**: Enable/disable payment methods

#### API Endpoints
```
GET    /api/bursar/fee-categories          - List fee categories
GET    /api/bursar/payment-methods         - List payment methods
```

## Database Schema

### Core Tables

#### fee_structures
```sql
- id (UUID, Primary Key)
- name (VARCHAR)
- class_id (UUID, Foreign Key)
- subsystem (ENUM: english, french)
- branch (ENUM: grammar, technical, commercial)
- academic_year (VARCHAR)
- term (ENUM: first, second, third)
- due_date (DATE)
- is_active (BOOLEAN)
- created_by (UUID, Foreign Key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### fee_structure_items
```sql
- id (UUID, Primary Key)
- fee_structure_id (UUID, Foreign Key)
- fee_category_id (UUID, Foreign Key)
- amount (DECIMAL)
- is_optional (BOOLEAN)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### student_fees
```sql
- id (UUID, Primary Key)
- student_id (UUID, Foreign Key)
- fee_structure_id (UUID, Foreign Key)
- total_amount (DECIMAL)
- paid_amount (DECIMAL)
- balance_amount (DECIMAL)
- status (ENUM: paid, partial, pending, overdue)
- due_date (DATE)
- last_payment_date (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### payments
```sql
- id (UUID, Primary Key)
- student_id (UUID, Foreign Key)
- student_fee_id (UUID, Foreign Key)
- receipt_number (VARCHAR, Unique)
- amount (DECIMAL)
- payment_method_id (UUID, Foreign Key)
- payment_date (DATE)
- academic_year (VARCHAR)
- term (ENUM: first, second, third)
- description (TEXT)
- reference_number (VARCHAR)
- collected_by (UUID, Foreign Key)
- status (ENUM: completed, pending, cancelled, refunded)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## User Interface Components

### 1. FeeStructureManagement Component
- **Location**: `components/bursar/fee-structure-management.tsx`
- **Features**:
  - Display fee structures in a table format
  - Search and filter functionality
  - Create, edit, and delete operations
  - Status management (active/inactive)
  - Fee items management

### 2. PaymentRecording Component
- **Location**: `components/bursar/payment-recording.tsx`
- **Features**:
  - Student fee balance display
  - Payment recording form
  - Payment history table
  - Receipt generation
  - Payment method selection

### 3. BursarDashboard Component
- **Location**: `components/bursar/bursar-dashboard.tsx`
- **Features**:
  - Financial statistics overview
  - Tabbed interface for different functions
  - Integration with fee structure and payment components
  - Quick access to key functions

## Business Logic

### Payment Processing
1. **Validation**: Ensure payment amount is valid and doesn't exceed balance
2. **Receipt Generation**: Automatically generate unique receipt numbers
3. **Balance Update**: Update student fee balance after payment
4. **Status Update**: Update fee status based on payment progress
5. **Audit Trail**: Record payment details and collector information

### Fee Structure Management
1. **Uniqueness**: Ensure one fee structure per class/academic year/term combination
2. **Validation**: Prevent deletion of fee structures assigned to students
3. **Cascading Updates**: Update related records when fee structures change
4. **Status Management**: Allow activation/deactivation of fee structures

### Student Fee Assignment
1. **Automatic Calculation**: Calculate total amounts from fee structure items
2. **Balance Tracking**: Maintain accurate paid vs outstanding amounts
3. **Status Updates**: Automatically update status based on payment progress
4. **Due Date Management**: Track and enforce payment due dates

## Security Considerations

### Authentication & Authorization
- All API endpoints require user authentication
- Role-based access control for bursar functions
- Audit trail for all financial transactions

### Data Validation
- Input validation for all financial amounts
- Validation of payment methods and fee categories
- Prevention of duplicate fee structures
- Protection against negative balances

### Transaction Integrity
- Database transactions for payment processing
- Rollback mechanisms for failed operations
- Consistent state management across related tables

## Error Handling

### Common Error Scenarios
1. **Duplicate Fee Structure**: Prevent creation of duplicate fee structures
2. **Invalid Payment Amount**: Validate payment amounts against outstanding balances
3. **Missing Required Fields**: Ensure all required fields are provided
4. **Database Constraints**: Handle foreign key and unique constraint violations

### User Feedback
- Toast notifications for success/error states
- Form validation with clear error messages
- Loading states for async operations
- Confirmation dialogs for destructive actions

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Bulk payment recording and fee assignment
2. **Advanced Reporting**: Detailed financial reports and analytics
3. **Payment Plans**: Installment payment plan management
4. **Fee Waivers**: Fee waiver and scholarship management
5. **Integration**: Integration with external payment gateways
6. **Notifications**: Automated payment reminders and notifications

### Technical Improvements
1. **Performance**: Optimize database queries and caching
2. **Scalability**: Handle large volumes of transactions
3. **Backup**: Automated backup and recovery procedures
4. **Monitoring**: Real-time monitoring and alerting

## Testing

### Test Scenarios
1. **Fee Structure CRUD**: Test all fee structure operations
2. **Payment Recording**: Test payment recording and validation
3. **Balance Calculations**: Verify accurate balance calculations
4. **Status Updates**: Test automatic status updates
5. **Error Handling**: Test error scenarios and edge cases

### Test Data
- Sample fee structures for different classes
- Test students with various fee statuses
- Mock payment transactions
- Different payment methods and amounts

## Deployment

### Prerequisites
1. Database setup with bursar tables
2. Sample data insertion
3. User role configuration
4. API endpoint configuration

### Configuration
1. Payment method setup
2. Fee category configuration
3. Receipt number format configuration
4. Currency and locale settings

## Support

### Documentation
- API documentation for all endpoints
- User guides for bursar functions
- Troubleshooting guides
- FAQ section

### Maintenance
- Regular database maintenance
- Performance monitoring
- Security updates
- Feature updates and bug fixes
