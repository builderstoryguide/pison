
-- Rename Administrator role to Manager (only when manager role does not exist)
UPDATE "UserRole"
SET slug = 'manager', name = 'Manager'
WHERE slug = 'administrator'
  AND NOT EXISTS (SELECT 1 FROM "UserRole" WHERE slug = 'manager');
