-- Add class_id column to fee_structures table
-- This allows fee structures to be linked to specific classes

-- Add class_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_structures' 
        AND column_name = 'class_id'
    ) THEN
        ALTER TABLE public.fee_structures 
        ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added class_id column to fee_structures table';
    ELSE
        RAISE NOTICE 'class_id column already exists in fee_structures table';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON public.fee_structures(class_id);

-- Make level column nullable since class_id can now be used instead
-- (Keep level for backward compatibility and cases where class_id is not set)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_structures' 
        AND column_name = 'level'
    ) THEN
        -- Check if level has NOT NULL constraint
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'fee_structures'
            AND ccu.column_name = 'level'
            AND tc.constraint_type = 'CHECK'
        ) THEN
            -- Level might have a check constraint, but we'll make it nullable
            ALTER TABLE public.fee_structures 
            ALTER COLUMN level DROP NOT NULL;
            
            RAISE NOTICE 'Made level column nullable in fee_structures table';
        END IF;
    END IF;
END $$;

-- Verify the changes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_structures' 
        AND column_name = 'class_id'
    ) THEN
        RAISE NOTICE '✓ class_id column successfully added to fee_structures table';
    ELSE
        RAISE EXCEPTION 'Failed to add class_id column to fee_structures table';
    END IF;
END $$;

