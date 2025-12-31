-- Drop the foreign key constraint on leaderboard_entries.user_id to allow sample data
ALTER TABLE public.leaderboard_entries DROP CONSTRAINT IF EXISTS leaderboard_entries_user_id_fkey;