-- Check if the app_configuration table exists and has data
-- Run this in your Supabase SQL Editor

-- 1. Check if table exists and show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'app_configuration' 
ORDER BY ordinal_position;

-- 2. Check if there's any data in the table
SELECT COUNT(*) as record_count FROM app_configuration;

-- 3. Show all records in the table
SELECT * FROM app_configuration;

-- 4. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'app_configuration';

-- 5. If no data exists, insert default configuration
INSERT INTO app_configuration (
    school_name,
    school_logo_url,
    school_logo_alt_text,
    school_address,
    school_phone,
    school_email,
    school_website,
    school_motto,
    primary_color,
    secondary_color,
    academic_year,
    currency,
    timezone,
    language,
    date_format,
    time_format
) VALUES (
    'Pison Academy',
    '/placeholder-logo.svg',
    'Pison Academy Logo',
    'Douala, Cameroon',
    '+237 123 456 789',
    'info@pisonacademy.cm',
    'https://pisonacademy.cm',
    'Excellence in Education',
    '#1f2937',
    '#3b82f6',
    '2024-2025',
    'XOF',
    'Africa/Douala',
    'en',
    'DD/MM/YYYY',
    '24h'
) ON CONFLICT DO NOTHING;

-- 6. Verify the insert worked
SELECT * FROM app_configuration;
