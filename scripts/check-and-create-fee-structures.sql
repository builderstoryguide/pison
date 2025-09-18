-- Check and create fee_structures table if it doesn't exist
-- This script ensures the fee_structures table and related tables are properly set up

-- Check if fee_structures table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structures') THEN
        RAISE NOTICE 'Creating fee_structures table...';
        
        -- Create fee_structures table
        CREATE TABLE fee_structures (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        
        RAISE NOTICE 'fee_structures table created successfully';
    ELSE
        RAISE NOTICE 'fee_structures table already exists';
    END IF;
END $$;

-- Check if fee_categories table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_categories') THEN
        RAISE NOTICE 'Creating fee_categories table...';
        
        -- Create fee_categories table
        CREATE TABLE fee_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default fee categories
        INSERT INTO fee_categories (name, code, description) VALUES
        ('Tuition Fees', 'TUITION', 'Basic tuition fees for the academic term'),
        ('Registration Fees', 'REGISTRATION', 'One-time registration fees'),
        ('Library Fees', 'LIBRARY', 'Library access and maintenance fees'),
        ('Laboratory Fees', 'LAB', 'Laboratory usage and equipment fees'),
        ('Sports Fees', 'SPORTS', 'Sports and physical education fees'),
        ('Examination Fees', 'EXAM', 'Examination and assessment fees'),
        ('Transportation Fees', 'TRANSPORT', 'School transportation fees'),
        ('Meal Fees', 'MEAL', 'School meal and cafeteria fees'),
        ('Uniform Fees', 'UNIFORM', 'School uniform and dress code fees'),
        ('Technology Fees', 'TECH', 'Computer and technology access fees')
        ON CONFLICT (code) DO NOTHING;
        
        RAISE NOTICE 'fee_categories table created successfully with default categories';
    ELSE
        RAISE NOTICE 'fee_categories table already exists';
    END IF;
END $$;

-- Check if fee_structure_items table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structure_items') THEN
        RAISE NOTICE 'Creating fee_structure_items table...';
        
        -- Create fee_structure_items table
        CREATE TABLE fee_structure_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
            fee_category_id UUID NOT NULL REFERENCES fee_categories(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            is_optional BOOLEAN DEFAULT false,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'fee_structure_items table created successfully';
    ELSE
        RAISE NOTICE 'fee_structure_items table already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year ON fee_structures(academic_year);
CREATE INDEX IF NOT EXISTS idx_fee_structures_term ON fee_structures(term);
CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON fee_structures(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_fee_structure_id ON fee_structure_items(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_fee_category_id ON fee_structure_items(fee_category_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fee_structures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_fee_structures_updated_at ON fee_structures;
CREATE TRIGGER update_fee_structures_updated_at 
    BEFORE UPDATE ON fee_structures 
    FOR EACH ROW EXECUTE FUNCTION update_fee_structures_updated_at();

DROP TRIGGER IF EXISTS update_fee_categories_updated_at ON fee_categories;
CREATE TRIGGER update_fee_categories_updated_at 
    BEFORE UPDATE ON fee_categories 
    FOR EACH ROW EXECUTE FUNCTION update_fee_structures_updated_at();

DROP TRIGGER IF EXISTS update_fee_structure_items_updated_at ON fee_structure_items;
CREATE TRIGGER update_fee_structure_items_updated_at 
    BEFORE UPDATE ON fee_structure_items 
    FOR EACH ROW EXECUTE FUNCTION update_fee_structures_updated_at();

-- Verify the setup
SELECT 'Fee structures setup completed successfully!' as status;

-- Show table information
SELECT 
    'fee_structures' as table_name,
    COUNT(*) as record_count
FROM fee_structures
UNION ALL
SELECT 
    'fee_categories' as table_name,
    COUNT(*) as record_count
FROM fee_categories
UNION ALL
SELECT 
    'fee_structure_items' as table_name,
    COUNT(*) as record_count
FROM fee_structure_items;
