-- Drop the foreign key constraints on discussion tables to allow sample data
ALTER TABLE public.discussion_threads DROP CONSTRAINT IF EXISTS discussion_threads_author_id_fkey;
ALTER TABLE public.discussion_replies DROP CONSTRAINT IF EXISTS discussion_replies_author_id_fkey;