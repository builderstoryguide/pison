-- Add synchronization triggers for classes table
-- These triggers keep old and new columns in sync during the migration period
-- This ensures backward compatibility while transitioning to new column names

-- 1) Trigger to sync old columns from new columns on INSERT
CREATE OR REPLACE FUNCTION public.sync_classes_columns_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If new columns are set but old columns are NULL, sync from new to old
  IF NEW.class_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.class_name;
  END IF;
  
  IF NEW.class_level IS NOT NULL AND NEW.level IS NULL THEN
    NEW.level := NEW.class_level;
  END IF;
  
  IF NEW.stream IS NOT NULL AND NEW.section IS NULL THEN
    NEW.section := NEW.stream;
  END IF;
  
  IF NEW.current_enrollment IS NOT NULL AND NEW.student_count IS NULL THEN
    NEW.student_count := NEW.current_enrollment;
  END IF;
  
  -- If old columns are set but new columns are NULL, sync from old to new
  IF NEW.name IS NOT NULL AND NEW.class_name IS NULL THEN
    NEW.class_name := NEW.name;
  END IF;
  
  IF NEW.level IS NOT NULL AND NEW.class_level IS NULL THEN
    NEW.class_level := NEW.level;
  END IF;
  
  IF NEW.section IS NOT NULL AND NEW.stream IS NULL THEN
    NEW.stream := NEW.section;
  END IF;
  
  IF NEW.student_count IS NOT NULL AND NEW.current_enrollment IS NULL THEN
    NEW.current_enrollment := NEW.student_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger to sync old columns from new columns on UPDATE
CREATE OR REPLACE FUNCTION public.sync_classes_columns_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync from new columns to old columns (prefer new columns)
  IF NEW.class_name IS DISTINCT FROM OLD.class_name THEN
    NEW.name := NEW.class_name;
  ELSIF NEW.name IS DISTINCT FROM OLD.name AND (NEW.class_name IS NULL OR NEW.class_name = '') THEN
    NEW.class_name := NEW.name;
  END IF;
  
  IF NEW.class_level IS DISTINCT FROM OLD.class_level THEN
    NEW.level := NEW.class_level;
  ELSIF NEW.level IS DISTINCT FROM OLD.level AND (NEW.class_level IS NULL OR NEW.class_level = '') THEN
    NEW.class_level := NEW.level;
  END IF;
  
  IF NEW.stream IS DISTINCT FROM OLD.stream THEN
    NEW.section := NEW.stream;
  ELSIF NEW.section IS DISTINCT FROM OLD.section AND (NEW.stream IS NULL OR NEW.stream = '') THEN
    NEW.stream := NEW.section;
  END IF;
  
  IF NEW.current_enrollment IS DISTINCT FROM OLD.current_enrollment THEN
    NEW.student_count := NEW.current_enrollment;
  ELSIF NEW.student_count IS DISTINCT FROM OLD.student_count AND (NEW.current_enrollment IS NULL) THEN
    NEW.current_enrollment := NEW.student_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_classes_sync_on_insert ON public.classes;
DROP TRIGGER IF EXISTS trg_classes_sync_on_update ON public.classes;

-- 4) Create triggers
CREATE TRIGGER trg_classes_sync_on_insert
  BEFORE INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_classes_columns_on_insert();

CREATE TRIGGER trg_classes_sync_on_update
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_classes_columns_on_update();

