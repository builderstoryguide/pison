-- Migration: Add missing columns to app_configuration table
-- This script adds all the columns needed for the full app configuration functionality

-- Add missing columns (only if they don't exist)
DO $$ 
BEGIN
    -- School information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_logo_alt_text') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_logo_alt_text VARCHAR(255) DEFAULT 'School Logo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_address') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_address TEXT;
        -- Migrate existing address data if it exists
        UPDATE public.app_configuration SET school_address = address WHERE address IS NOT NULL AND school_address IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_phone') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_phone VARCHAR(50);
        -- Migrate existing contact_phone data if it exists
        UPDATE public.app_configuration SET school_phone = contact_phone WHERE contact_phone IS NOT NULL AND school_phone IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_email') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_email VARCHAR(255);
        -- Migrate existing contact_email data if it exists
        UPDATE public.app_configuration SET school_email = contact_email WHERE contact_email IS NOT NULL AND school_email IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_website') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_website VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'school_motto') THEN
        ALTER TABLE public.app_configuration ADD COLUMN school_motto TEXT;
    END IF;

    -- System settings columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'academic_year') THEN
        ALTER TABLE public.app_configuration ADD COLUMN academic_year VARCHAR(20) DEFAULT '2024-2025';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'currency') THEN
        ALTER TABLE public.app_configuration ADD COLUMN currency VARCHAR(10) DEFAULT 'XOF';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'timezone') THEN
        ALTER TABLE public.app_configuration ADD COLUMN timezone VARCHAR(50) DEFAULT 'Africa/Douala';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'language') THEN
        ALTER TABLE public.app_configuration ADD COLUMN language VARCHAR(10) DEFAULT 'en';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'date_format') THEN
        ALTER TABLE public.app_configuration ADD COLUMN date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'time_format') THEN
        ALTER TABLE public.app_configuration ADD COLUMN time_format VARCHAR(10) DEFAULT '24h';
    END IF;

    -- User tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'created_by') THEN
        ALTER TABLE public.app_configuration ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configuration' AND column_name = 'updated_by') THEN
        ALTER TABLE public.app_configuration ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Update existing rows with default values for new columns
UPDATE public.app_configuration
SET 
    school_logo_alt_text = COALESCE(school_logo_alt_text, 'School Logo'),
    academic_year = COALESCE(academic_year, '2024-2025'),
    currency = COALESCE(currency, 'XOF'),
    timezone = COALESCE(timezone, 'Africa/Douala'),
    language = COALESCE(language, 'en'),
    date_format = COALESCE(date_format, 'DD/MM/YYYY'),
    time_format = COALESCE(time_format, '24h')
WHERE 
    school_logo_alt_text IS NULL 
    OR academic_year IS NULL 
    OR currency IS NULL 
    OR timezone IS NULL 
    OR language IS NULL 
    OR date_format IS NULL 
    OR time_format IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.app_configuration.academic_year IS 'Current academic year in format YYYY-YYYY (e.g., 2024-2025)';
COMMENT ON COLUMN public.app_configuration.currency IS 'Currency code (e.g., XOF, USD, EUR)';
COMMENT ON COLUMN public.app_configuration.timezone IS 'Timezone identifier (e.g., Africa/Douala)';
COMMENT ON COLUMN public.app_configuration.language IS 'Default language code (e.g., en, fr)';
COMMENT ON COLUMN public.app_configuration.date_format IS 'Date format pattern (e.g., DD/MM/YYYY)';
COMMENT ON COLUMN public.app_configuration.time_format IS 'Time format (12h or 24h)';

