-- Create Fee Structures Table
-- This script creates the fee_structures table if it doesn't exist

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structures') THEN
        -- Create the fee_structures table
        CREATE TABLE fee_structures (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            subsystem VARCHAR(50) NOT NULL CHECK (subsystem IN ('english', 'french')),
            level VARCHAR(100) NOT NULL,
            branch VARCHAR(100) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
            amount DECIMAL(10,2) NOT NULL,
            due_date DATE NOT NULL,
            term VARCHAR(50) NOT NULL CHECK (term IN ('first', 'second', 'third')),
            academic_year VARCHAR(20) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_fee_structures_subsystem ON fee_structures(subsystem);
        CREATE INDEX idx_fee_structures_level ON fee_structures(level);
        CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year);
        CREATE INDEX idx_fee_structures_is_active ON fee_structures(is_active);

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_fee_structures_updated_at 
            BEFORE UPDATE ON fee_structures 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Enable Row Level Security
        ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        -- Allow all authenticated users to read fee structures
        CREATE POLICY "Enable read access for all users" ON fee_structures
            FOR SELECT USING (true);

        -- Allow authenticated users to insert fee structures
        CREATE POLICY "Enable insert access for authenticated users" ON fee_structures
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        -- Allow authenticated users to update fee structures
        CREATE POLICY "Enable update access for authenticated users" ON fee_structures
            FOR UPDATE USING (auth.role() = 'authenticated');

        -- Allow authenticated users to delete fee structures
        CREATE POLICY "Enable delete access for authenticated users" ON fee_structures
            FOR DELETE USING (auth.role() = 'authenticated');

        RAISE NOTICE 'fee_structures table created successfully';
    ELSE
        RAISE NOTICE 'fee_structures table already exists';
    END IF;
END $$;

-- Verify table structure
SELECT 'Fee structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS policies on fee_structures table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';
