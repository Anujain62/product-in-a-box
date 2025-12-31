-- Drop the foreign key constraint on mentors.user_id to allow sample data
ALTER TABLE public.mentors DROP CONSTRAINT IF EXISTS mentors_user_id_fkey;