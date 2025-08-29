-- Update gender constraint to only allow 'male' or 'female'
-- Run this script in your Supabase SQL Editor

-- First, update any existing 'other' values to NULL or a default value
UPDATE users SET gender = NULL WHERE gender = 'other';

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

-- Add the new constraint that only allows 'male' or 'female'
ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (gender IN ('male', 'female'));

-- Also update the user_profiles table if it exists
DO $$
BEGIN
    -- Check if user_profiles table exists and has a gender column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'gender'
    ) THEN
        -- Update any existing 'other' values to NULL
        EXECUTE 'UPDATE user_profiles SET gender = NULL WHERE gender = ''other''';
        
        -- Drop existing constraint if it exists
        EXECUTE 'ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_gender_check';
        
        -- Add new constraint
        EXECUTE 'ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_gender_check CHECK (gender IN (''male'', ''female''))';
    END IF;
END $$;

-- Verify the changes
SELECT 'Users table gender constraint updated successfully' as status;
