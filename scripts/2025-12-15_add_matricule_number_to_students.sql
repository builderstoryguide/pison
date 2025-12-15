-- Add matricule_number column to students table
-- This column stores a unique identification number entered manually

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'matricule_number'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN matricule_number VARCHAR(100);
    END IF;
END $$;

-- Create unique index on matricule_number if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_matricule_number 
ON public.students(matricule_number) 
WHERE matricule_number IS NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN public.students.matricule_number IS 'Unique identification number entered manually for the student';
