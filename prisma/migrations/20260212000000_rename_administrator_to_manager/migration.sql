-- Rename Administrator role to Manager
UPDATE "UserRole"
SET slug = 'manager', name = 'Manager'
WHERE slug = 'administrator';
