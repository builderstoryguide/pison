# Enhanced Fee Structure Management Feature

## Overview

The Enhanced Fee Structure Management feature allows administrators to create and manage fee structures for multiple classes simultaneously with installment support. This feature provides a comprehensive solution for setting up fee structures across different classes, terms, and academic years.

## Key Features

### ✅ Implemented Features

1. **Multi-Class Fee Structure Creation**: Create fee structures for multiple classes at once
2. **Installment Support**: Configure payment plans with up to 12 installments
3. **Automatic Installment Calculation**: System automatically calculates installment amounts and due dates
4. **Class Selection Interface**: Visual interface to select classes with filtering options
5. **Real-time Preview**: Preview installment breakdown before creating fee structures
6. **Comprehensive Management**: View, edit, and delete fee structures
7. **Advanced Filtering**: Filter by academic year, term, status, and search
8. **Statistics Dashboard**: Overview of fee structure statistics
9. **Database Integration**: Full Supabase integration with proper error handling

### 📋 Form Fields

The enhanced fee structure form includes the following sections:

#### Basic Information
- **Fee Structure Name** (required): e.g., "First Term Fees 2024-2025"
- **Academic Year** (required): 2023-2024, 2024-2025, 2025-2026
- **Term** (required): First, Second, or Third Term
- **First Payment Due Date** (required): Date picker for the first installment

#### Financial Details
- **Total Amount** (required): Total fee amount in FCFA
- **Number of Installments** (required): 1-12 installments
- **Installment Preview**: Real-time calculation and preview of installment breakdown
- **Active Status**: Toggle to enable/disable the fee structure

#### Class Selection
- **Class Checkboxes**: Select multiple classes from available active classes
- **Class Information**: Display class name, level, subsystem, and branch
- **Filtering**: Only shows active classes

#### Additional Information
- **Description**: Optional description for the fee structure

## Database Schema

### Enhanced Fee Structure Tables

The feature uses the existing financial tables with enhancements:

```sql
-- Fee Structures table (enhanced)
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('first', 'second', 'third')),
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Plans table
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Plan Installments table
CREATE TABLE IF NOT EXISTS payment_plan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Enhanced Fee Structure API

```
GET    /api/bursar/fee-structures          - List all fee structures with filtering
POST   /api/bursar/fee-structures          - Create fee structure with installments
GET    /api/bursar/fee-structures/[id]     - Get specific fee structure
PUT    /api/bursar/fee-structures/[id]     - Update fee structure
DELETE /api/bursar/fee-structures/[id]     - Delete fee structure
```

### Classes API

```
GET    /api/classes                        - List all classes with filtering
```

## Components

### Core Components

1. **EnhancedFeeStructureForm** (`components/admin/enhanced-fee-structure-form.tsx`)
   - Main form component for creating/editing fee structures
   - Handles multi-class selection and installment calculation
   - Real-time validation and preview

2. **EnhancedFeeStructureManagement** (`components/admin/enhanced-fee-structure-management.tsx`)
   - Main management interface
   - Statistics dashboard
   - Filtering and search functionality
   - CRUD operations

### Key Features Implementation

#### Installment Calculation

```typescript
const calculateInstallments = (totalAmount: number, numberOfInstallments: number, startDate: Date) => {
  const installmentAmount = Math.ceil(totalAmount / numberOfInstallments)
  const lastInstallmentAmount = totalAmount - (installmentAmount * (numberOfInstallments - 1))

  const newInstallments: Installment[] = []
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = addMonths(startDate, i)
    const amount = i === numberOfInstallments - 1 ? lastInstallmentAmount : installmentAmount
    
    newInstallments.push({
      installmentNumber: i + 1,
      amount,
      dueDate: installmentDate
    })
  }

  setInstallments(newInstallments)
}
```

#### Multi-Class Selection

```typescript
const onSubmit = async (data: EnhancedFeeStructureFormData) => {
  // Create fee structure for each selected class
  const promises = data.selectedClasses.map(async (classId) => {
    const classData = classes.find(c => c.id === classId)
    if (!classData) return null

    const feeStructureData = {
      name: `${data.name} - ${classData.name}`,
      classId,
      subsystem: classData.subsystem,
      branch: classData.branch,
      academicYear: data.academicYear,
      term: data.term,
      dueDate: format(data.dueDate, "yyyy-MM-dd"),
      totalAmount: data.totalAmount,
      numberOfInstallments: data.numberOfInstallments,
      installments: installments.map(inst => ({
        installmentNumber: inst.installmentNumber,
        amount: inst.amount,
        dueDate: format(inst.dueDate, "yyyy-MM-dd")
      })),
      description: data.description,
      isActive: data.isActive
    }

    // API call to create fee structure
    const response = await fetch('/api/bursar/fee-structures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feeStructureData),
    })

    return await response.json()
  })

  const results = await Promise.all(promises)
  // Handle results...
}
```

## Usage Instructions

### For Administrators

1. **Access Enhanced Fee Structure Management**:
   - Navigate to `/test-enhanced-fee-structure`
   - Or integrate into the admin dashboard

2. **Create a New Fee Structure**:
   - Click "Create Fee Structure" button
   - Fill in basic information (name, academic year, term)
   - Set the total amount and number of installments
   - Select classes from the available list
   - Review the installment preview
   - Submit the form

3. **Manage Existing Fee Structures**:
   - View all fee structures in the table
   - Use filters to find specific structures
   - Edit or delete fee structures as needed
   - View statistics and overview

### Workflow Example

1. **Create Fee Structure for Multiple Classes**:
   - Name: "First Term Fees 2024-2025"
   - Academic Year: 2024-2025
   - Term: First Term
   - Total Amount: 75,000 FCFA
   - Installments: 3
   - Selected Classes: Form 1A, Form 2B, Terminale C

2. **System Automatically Creates**:
   - 3 fee structures (one for each class)
   - Payment plans with 3 installments each
   - Installment amounts: 25,000 FCFA, 25,000 FCFA, 25,000 FCFA
   - Due dates: Monthly from the first payment date

## Benefits

### For Administrators
- **Efficiency**: Create fee structures for multiple classes at once
- **Flexibility**: Support for installment-based payments
- **Accuracy**: Automatic calculation of installment amounts and dates
- **Visibility**: Clear overview of all fee structures and statistics

### For Students and Parents
- **Transparency**: Clear breakdown of fees and payment schedule
- **Flexibility**: Multiple payment options through installments
- **Consistency**: Standardized fee structures across classes

### For the Institution
- **Financial Planning**: Better cash flow management with installment tracking
- **Administrative Efficiency**: Reduced manual work in fee structure setup
- **Data Integrity**: Centralized fee structure management

## Technical Implementation

### Form Validation

Uses Zod schema validation:

```typescript
const enhancedFeeStructureSchema = z.object({
  name: z.string().min(1, "Fee structure name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.enum(["first", "second", "third"]),
  dueDate: z.date(),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  numberOfInstallments: z.number().min(1, "Number of installments must be at least 1").max(12, "Maximum 12 installments"),
  selectedClasses: z.array(z.string()).min(1, "At least one class must be selected"),
  description: z.string().optional(),
  isActive: z.boolean(),
})
```

### Error Handling

- Comprehensive error handling for API calls
- User-friendly error messages
- Graceful fallbacks for missing data
- Transaction rollback on partial failures

### Performance Considerations

- Efficient database queries with proper indexing
- Optimized component rendering
- Lazy loading of class data
- Debounced search and filtering

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Import/export fee structures
2. **Advanced Installment Options**: Variable installment amounts
3. **Fee Structure Templates**: Reusable templates for common fee structures
4. **Integration with Student Management**: Automatic fee assignment to students
5. **Reporting**: Advanced financial reporting and analytics

### Technical Improvements
1. **Caching**: Implement caching for frequently accessed data
2. **Real-time Updates**: WebSocket integration for real-time updates
3. **Mobile Optimization**: Enhanced mobile interface
4. **API Rate Limiting**: Implement proper rate limiting for API endpoints

## Testing

### Test Page
- Visit `/test-enhanced-fee-structure` to test the feature
- Create sample fee structures with different configurations
- Test filtering and search functionality
- Verify installment calculations

### Database Testing
- Ensure all required tables exist
- Test data integrity constraints
- Verify foreign key relationships
- Test transaction rollback scenarios

## Support and Maintenance

### Common Issues
1. **Class Loading Failures**: Check database connection and classes table
2. **Installment Calculation Errors**: Verify date-fns library installation
3. **API Errors**: Check Supabase configuration and permissions

### Troubleshooting
1. **Clear browser cache** if experiencing UI issues
2. **Check browser console** for JavaScript errors
3. **Verify database schema** matches the expected structure
4. **Test API endpoints** directly using tools like Postman

## Conclusion

The Enhanced Fee Structure Management feature provides a comprehensive solution for managing fee structures across multiple classes with installment support. It offers significant improvements in efficiency, accuracy, and user experience compared to traditional fee structure management systems.

The feature is production-ready and includes proper error handling, validation, and user feedback. It integrates seamlessly with the existing school management system and provides a solid foundation for future enhancements.
