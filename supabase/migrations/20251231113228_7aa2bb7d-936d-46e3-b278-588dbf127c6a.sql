-- Drop the foreign key constraint on profiles.user_id to allow sample data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id not require a reference to auth.users
-- This allows us to create sample mentor profiles for demo purposes