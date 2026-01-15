-- Fix notifications table to reference public.users instead of auth.users
-- This is necessary because auth.users is empty in this dev environment

BEGIN;

-- Drop the old constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;

-- Add the new constraint referencing public.users
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_recipient_id_fkey 
FOREIGN KEY (recipient_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

COMMIT;
