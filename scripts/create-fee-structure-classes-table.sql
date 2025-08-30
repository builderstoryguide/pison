-- Create Fee Structure Classes Junction Table
-- This script creates a table to link fee structures with multiple classes

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structure_classes') THEN
        -- Create the fee_structure_classes junction table
        CREATE TABLE fee_structure_classes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Ensure unique combination of fee structure and class
            UNIQUE(fee_structure_id, class_id)
        );

        -- Create indexes for better performance
        CREATE INDEX idx_fee_structure_classes_fee_structure_id ON fee_structure_classes(fee_structure_id);
        CREATE INDEX idx_fee_structure_classes_class_id ON fee_structure_classes(class_id);
        CREATE INDEX idx_fee_structure_classes_created_at ON fee_structure_classes(created_at);

        -- Enable Row Level Security
        ALTER TABLE fee_structure_classes ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        -- Allow all authenticated users to read fee structure classes
        CREATE POLICY "Enable read access for all users" ON fee_structure_classes
            FOR SELECT USING (true);

        -- Allow authenticated users to insert fee structure classes
        CREATE POLICY "Enable insert access for authenticated users" ON fee_structure_classes
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        -- Allow authenticated users to update fee structure classes
        CREATE POLICY "Enable update access for authenticated users" ON fee_structure_classes
            FOR UPDATE USING (auth.role() = 'authenticated');

        -- Allow authenticated users to delete fee structure classes
        CREATE POLICY "Enable delete access for authenticated users" ON fee_structure_classes
            FOR DELETE USING (auth.role() = 'authenticated');

        RAISE NOTICE 'fee_structure_classes table created successfully';
    ELSE
        RAISE NOTICE 'fee_structure_classes table already exists';
    END IF;
END $$;

-- Create a view to easily query fee structures with their associated classes
CREATE OR REPLACE VIEW fee_structures_with_classes AS
SELECT 
    fs.id as fee_structure_id,
    fs.name as fee_structure_name,
    COALESCE(fs.subsystem, 'english') as subsystem,
    COALESCE(fs.level, '') as level,
    COALESCE(fs.branch, 'grammar') as branch,
    fs.amount,
    fs.due_date,
    COALESCE(fs.term, 'first') as term,
    COALESCE(fs.academic_year, '2024-2025') as academic_year,
    COALESCE(fs.description, '') as description,
    COALESCE(fs.is_active, true) as is_active,
    COALESCE(fs.created_at, NOW()) as fee_structure_created_at,
    COALESCE(fs.updated_at, NOW()) as fee_structure_updated_at,
    array_agg(c.id) FILTER (WHERE c.id IS NOT NULL) as class_ids,
    array_agg(c.class_name) FILTER (WHERE c.class_name IS NOT NULL) as class_names,
    array_agg(c.class_level) FILTER (WHERE c.class_level IS NOT NULL) as class_levels,
    array_agg(c.stream) FILTER (WHERE c.stream IS NOT NULL) as class_streams,
    array_agg(c.subsystem) FILTER (WHERE c.subsystem IS NOT NULL) as class_subsystems,
    COUNT(c.id) as class_count
FROM fee_structures fs
LEFT JOIN fee_structure_classes fsc ON fs.id = fsc.fee_structure_id
LEFT JOIN classes c ON fsc.class_id = c.id
GROUP BY fs.id, fs.name, fs.subsystem, fs.level, fs.branch, fs.amount, fs.due_date, fs.term, fs.academic_year, fs.description, fs.is_active, fs.created_at, fs.updated_at;

-- Verify table structure
SELECT 'Fee structure classes table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structure_classes' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS policies on fee_structure_classes table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structure_classes';

-- Show the view structure
SELECT 'Fee structures with classes view structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures_with_classes' 
ORDER BY ordinal_position;
