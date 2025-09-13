-- Create app_configuration table for storing school branding and settings
-- This table will store configuration that affects all users

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
    primary_color VARCHAR(7) DEFAULT '#1f2937', -- Hex color for primary theme
    secondary_color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color for secondary theme
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

-- Create a single default configuration record
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

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_configuration_school_name ON app_configuration(school_name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER trigger_update_app_configuration_updated_at
    BEFORE UPDATE ON app_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_app_configuration_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read configuration
CREATE POLICY "Allow authenticated users to read app configuration" ON app_configuration
    FOR SELECT
    TO authenticated
    USING (true);

-- Only allow admin users to update configuration
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

-- Only allow admin users to insert configuration
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

-- Only allow admin users to delete configuration
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

-- Add comments for documentation
COMMENT ON TABLE app_configuration IS 'Stores application-wide configuration settings including school branding and system preferences';
COMMENT ON COLUMN app_configuration.school_name IS 'The name of the school displayed throughout the application';
COMMENT ON COLUMN app_configuration.school_logo_url IS 'URL or path to the school logo image';
COMMENT ON COLUMN app_configuration.school_logo_alt_text IS 'Alternative text for the school logo for accessibility';
COMMENT ON COLUMN app_configuration.primary_color IS 'Primary color for the application theme (hex format)';
COMMENT ON COLUMN app_configuration.secondary_color IS 'Secondary color for the application theme (hex format)';
COMMENT ON COLUMN app_configuration.academic_year IS 'Current academic year';
COMMENT ON COLUMN app_configuration.currency IS 'Default currency for financial operations';
COMMENT ON COLUMN app_configuration.timezone IS 'Default timezone for the school';
COMMENT ON COLUMN app_configuration.language IS 'Default language for the application';
COMMENT ON COLUMN app_configuration.date_format IS 'Default date format for display';
COMMENT ON COLUMN app_configuration.time_format IS 'Default time format (12h or 24h)';
