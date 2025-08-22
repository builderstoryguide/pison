# Teacher Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the teachers table in the school management system. The schema is designed to store all necessary information about teachers while maintaining data integrity and performance.

## Table Structure

### Table Name: `teachers`

The teachers table stores comprehensive information about all teachers in the school system, including personal details, professional qualifications, employment information, and contact details.

## Schema Definition

```sql
CREATE TABLE teachers (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal information
    title VARCHAR(20) CHECK (title IN ('Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    nationality VARCHAR(100),
    id_number VARCHAR(50),
    
    -- Address information
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Cameroon',
    
    -- Professional information
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    subjects TEXT[] DEFAULT '{}',
    classes TEXT[] DEFAULT '{}',
    qualifications TEXT[] DEFAULT '{}',
    experience TEXT,
    specialization VARCHAR(255),
    department VARCHAR(100),
    
    -- Employment details
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'temporary')),
    salary DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    contract_renewal_date DATE,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(255),
    emergency_contact_address TEXT,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated', 'retired')),
    is_verified BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (start_date <= end_date OR end_date IS NULL),
    CONSTRAINT valid_salary CHECK (salary >= 0 OR salary IS NULL),
    CONSTRAINT valid_phone CHECK (phone ~ '^[+]?[0-9\s\-\(\)]+$' OR phone IS NULL),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

## Field Descriptions

### Primary Identification
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key, auto-generated | PRIMARY KEY |
| `teacher_id` | VARCHAR(50) | Unique teacher identifier | UNIQUE, NOT NULL |

### Personal Information
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `title` | VARCHAR(20) | Honorific title | CHECK (Mr., Mrs., Ms., Dr., Prof.) |
| `first_name` | VARCHAR(100) | Teacher's first name | NOT NULL |
| `last_name` | VARCHAR(100) | Teacher's last name | NOT NULL |
| `email` | VARCHAR(255) | Email address | UNIQUE, NOT NULL, Email format |
| `phone` | VARCHAR(20) | Phone number | Phone format validation |
| `date_of_birth` | DATE | Date of birth | Optional |
| `gender` | VARCHAR(10) | Gender identity | CHECK (male, female, other) |
| `nationality` | VARCHAR(100) | Nationality | Optional |
| `id_number` | VARCHAR(50) | National ID number | Optional |

### Address Information
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `address` | TEXT | Full address | Optional |
| `city` | VARCHAR(100) | City | Optional |
| `region` | VARCHAR(100) | Region/State | Optional |
| `postal_code` | VARCHAR(20) | Postal code | Optional |
| `country` | VARCHAR(100) | Country | 'Cameroon' |

### Professional Information
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `subsystem` | VARCHAR(20) | Educational subsystem | NOT NULL |
| `subjects` | TEXT[] | Array of subjects taught | '{}' |
| `classes` | TEXT[] | Array of assigned classes | '{}' |
| `qualifications` | TEXT[] | Array of qualifications | '{}' |
| `experience` | TEXT | Teaching experience | Optional |
| `specialization` | VARCHAR(255) | Area of specialization | Optional |
| `department` | VARCHAR(100) | Department assignment | Optional |

### Employment Details
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `employment_type` | VARCHAR(20) | Type of employment | CHECK (full-time, part-time, contract, temporary) |
| `salary` | DECIMAL(10,2) | Monthly salary | >= 0 |
| `start_date` | DATE | Employment start date | Optional |
| `end_date` | DATE | Employment end date | Optional |
| `contract_renewal_date` | DATE | Contract renewal date | Optional |

### Emergency Contact
| Field | Type | Description |
|-------|------|-------------|
| `emergency_contact_name` | VARCHAR(255) | Emergency contact person name |
| `emergency_contact_relationship` | VARCHAR(100) | Relationship to teacher |
| `emergency_contact_phone` | VARCHAR(20) | Emergency contact phone |
| `emergency_contact_email` | VARCHAR(255) | Emergency contact email |
| `emergency_contact_address` | TEXT | Emergency contact address |

### Status and Metadata
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `status` | VARCHAR(20) | Current status | 'active' |
| `is_verified` | BOOLEAN | Email verification status | false |
| `profile_completed` | BOOLEAN | Profile completion status | false |

### Timestamps
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation time | NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update time | NOW() |

## Indexes

### Performance Indexes
```sql
-- Primary search indexes
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_name ON teachers(last_name, first_name);
CREATE INDEX idx_teachers_subsystem ON teachers(subsystem);
CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_employment_type ON teachers(employment_type);

-- Composite indexes for common queries
CREATE INDEX idx_teachers_subsystem_status ON teachers(subsystem, status);
CREATE INDEX idx_teachers_employment_status ON teachers(employment_type, status);
CREATE INDEX idx_teachers_created_at ON teachers(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_teachers_subjects_gin ON teachers USING GIN(subjects);
CREATE INDEX idx_teachers_qualifications_gin ON teachers USING GIN(qualifications);
CREATE INDEX idx_teachers_classes_gin ON teachers USING GIN(classes);
```

## Constraints

### Data Validation Constraints
- **Email Format**: Must be a valid email address
- **Phone Format**: Must be a valid phone number format
- **Salary**: Must be non-negative
- **Dates**: End date must be after start date (if both provided)
- **Enumerated Values**: Title, gender, subsystem, employment_type, and status have specific allowed values

### Business Logic Constraints
- **Teacher ID Uniqueness**: Each teacher must have a unique identifier
- **Email Uniqueness**: Each teacher must have a unique email address
- **Required Fields**: First name, last name, email, subsystem, and employment type are mandatory

## Triggers

### Automatic Timestamp Updates
```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_teachers_updated_at();
```

## Functions

### Teacher ID Generation
```sql
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    counter INTEGER := 1;
    new_teacher_id VARCHAR(50);
    exists_already BOOLEAN;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    LOOP
        new_teacher_id := 'TCH' || current_year || LPAD(counter::TEXT, 3, '0');
        
        SELECT EXISTS(SELECT 1 FROM teachers WHERE teacher_id = new_teacher_id) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN new_teacher_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Statistics Function
```sql
CREATE OR REPLACE FUNCTION get_teacher_statistics()
RETURNS TABLE(
    total_teachers BIGINT,
    active_teachers BIGINT,
    english_subsystem BIGINT,
    french_subsystem BIGINT,
    full_time BIGINT,
    part_time BIGINT,
    contract_teachers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_teachers,
        COUNT(*) FILTER (WHERE status = 'active') as active_teachers,
        COUNT(*) FILTER (WHERE subsystem = 'english') as english_subsystem,
        COUNT(*) FILTER (WHERE subsystem = 'french') as french_subsystem,
        COUNT(*) FILTER (WHERE employment_type = 'full-time') as full_time,
        COUNT(*) FILTER (WHERE employment_type = 'part-time') as part_time,
        COUNT(*) FILTER (WHERE employment_type = 'contract') as contract_teachers
    FROM teachers;
END;
$$ LANGUAGE plpgsql;
```

## Views

### Active Teachers View
```sql
CREATE OR REPLACE VIEW active_teachers_view AS
SELECT 
    id,
    teacher_id,
    title,
    first_name,
    last_name,
    email,
    phone,
    subsystem,
    subjects,
    classes,
    employment_type,
    status,
    created_at
FROM teachers 
WHERE status = 'active'
ORDER BY last_name, first_name;
```

### Teacher Contacts View
```sql
CREATE OR REPLACE VIEW teacher_contacts_view AS
SELECT 
    id,
    teacher_id,
    title || ' ' || first_name || ' ' || last_name as full_name,
    email,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_email
FROM teachers
WHERE status IN ('active', 'inactive')
ORDER BY last_name, first_name;
```

## Sample Data

### Example Teacher Record
```sql
INSERT INTO teachers (
    teacher_id, title, first_name, last_name, email, phone, 
    date_of_birth, gender, nationality, subsystem, 
    subjects, qualifications, experience, employment_type, 
    salary, start_date, status
) VALUES (
    'TCH2024001', 'Mr.', 'John', 'Doe', 'john.doe@school.com', '+237612345678',
    '1985-03-15', 'male', 'Cameroonian', 'english',
    ARRAY['Mathematics', 'Physics'], ARRAY['BSc Mathematics', 'PGCE'], '5 years',
    'full-time', 150000.00, '2024-01-15', 'active'
);
```

## Common Queries

### Get All Active Teachers
```sql
SELECT * FROM active_teachers_view;
```

### Get Teachers by Subsystem
```sql
SELECT * FROM teachers WHERE subsystem = 'english' AND status = 'active';
```

### Get Teacher Statistics
```sql
SELECT * FROM get_teacher_statistics();
```

### Search Teachers by Name
```sql
SELECT * FROM teachers 
WHERE LOWER(first_name) LIKE LOWER('%john%') 
   OR LOWER(last_name) LIKE LOWER('%doe%');
```

### Get Teachers by Subject
```sql
SELECT * FROM teachers 
WHERE 'Mathematics' = ANY(subjects) AND status = 'active';
```

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on teachers table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policy for admins to access all teachers
CREATE POLICY admin_teachers_policy ON teachers
    FOR ALL TO admin_role
    USING (true);

-- Policy for teachers to access only their own record
CREATE POLICY teacher_self_policy ON teachers
    FOR SELECT TO teacher_role
    USING (auth.uid()::text = id::text);
```

### Data Encryption
- Sensitive data like salary should be encrypted at rest
- Personal information should be handled according to data protection regulations
- Audit trails should be maintained for all changes

## Migration and Maintenance

### Adding New Fields
```sql
-- Example: Adding a new field
ALTER TABLE teachers ADD COLUMN bio TEXT;
ALTER TABLE teachers ADD COLUMN profile_picture_url VARCHAR(500);
```

### Updating Constraints
```sql
-- Example: Adding a new constraint
ALTER TABLE teachers ADD CONSTRAINT valid_age 
CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years');
```

### Backup and Recovery
- Regular backups should be performed
- Point-in-time recovery should be available
- Data retention policies should be implemented

## Performance Optimization

### Query Optimization Tips
1. Use indexes for frequently queried columns
2. Use GIN indexes for array columns
3. Use composite indexes for multi-column queries
4. Consider partitioning for large datasets
5. Use views for complex, frequently-used queries

### Monitoring
- Monitor query performance
- Track index usage
- Monitor table size and growth
- Set up alerts for performance issues

## Conclusion

The teachers table schema provides a comprehensive foundation for managing teacher data in the school management system. It includes proper validation, indexing, and security measures while maintaining flexibility for future enhancements.
