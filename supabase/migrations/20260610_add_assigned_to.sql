-- =======================================================
-- ADD ASSIGNED_TO COLUMN TO TASKS TABLE
-- =======================================================
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to uuid CONSTRAINT tasks_assigned_to_fkey REFERENCES public.profiles(id) ON DELETE SET NULL;
