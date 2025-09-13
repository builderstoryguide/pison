-- Bulletproof Configuration Table Setup
-- This script creates the configuration table with proper error handling

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'Pison Academy',
    school_logo_url TEXT,
    school_logo_alt_text VARCHAR(255) DEFAULT 'School Logo',
    school_address TEXT,
    school_phone VARCHAR(50),
    school_email VARCHAR(255),
    school_website VARCHAR(255),
    school_motto TEXT,
    primary_color VARCHAR(7) DEFAULT '#1f2937',
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    academic_year VARCHAR(20) DEFAULT '2024-2025',
    currency VARCHAR(10) DEFAULT 'XOF',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Insert default configuration if none exists
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
) 
SELECT 
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
WHERE NOT EXISTS (SELECT 1 FROM app_configuration);

-- Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to update app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to insert app configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow admin users to delete app configuration" ON app_configuration;

-- Create new policies
CREATE POLICY "Allow authenticated users to read app configuration" ON app_configuration
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin users to update app configuration" ON app_configuration
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to insert app configuration" ON app_configuration
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to delete app configuration" ON app_configuration
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_app_configuration_updated_at ON app_configuration;
CREATE TRIGGER trigger_update_app_configuration_updated_at
    BEFORE UPDATE ON app_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_app_configuration_updated_at();

-- Verify the setup
SELECT 'Configuration table setup completed successfully' as status;
SELECT COUNT(*) as record_count FROM app_configuration;
SELECT school_name, primary_color, secondary_color FROM app_configuration LIMIT 1;