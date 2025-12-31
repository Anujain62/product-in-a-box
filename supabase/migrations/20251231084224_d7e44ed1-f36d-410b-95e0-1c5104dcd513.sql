-- Function to increment XP for a user
CREATE OR REPLACE FUNCTION public.increment_xp(p_user_id uuid, p_xp integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET total_xp = total_xp + p_xp,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

-- Function to update streak when user completes activity
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_date date;
    current_date_val date := CURRENT_DATE;
BEGIN
    SELECT last_activity_date INTO last_date
    FROM public.profiles
    WHERE user_id = p_user_id;
    
    IF last_date IS NULL OR last_date < current_date_val - interval '1 day' THEN
        -- Streak broken or first activity
        UPDATE public.profiles
        SET current_streak = 1,
            last_activity_date = current_date_val,
            updated_at = now()
        WHERE user_id = p_user_id;
    ELSIF last_date = current_date_val - interval '1 day' THEN
        -- Continue streak
        UPDATE public.profiles
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = current_date_val,
            updated_at = now()
        WHERE user_id = p_user_id;
    -- If last_date = current_date, do nothing (already counted today)
    END IF;
END;
$$;

-- Function to complete a lesson and award XP
CREATE OR REPLACE FUNCTION public.complete_lesson(p_user_id uuid, p_lesson_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lesson_xp integer;
    already_completed boolean;
BEGIN
    -- Check if already completed
    SELECT completed INTO already_completed
    FROM public.user_progress
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
    
    IF already_completed IS TRUE THEN
        RETURN;
    END IF;
    
    -- Get lesson XP reward
    SELECT xp_reward INTO lesson_xp
    FROM public.lessons
    WHERE id = p_lesson_id;
    
    -- Upsert progress
    INSERT INTO public.user_progress (user_id, lesson_id, completed, completed_at)
    VALUES (p_user_id, p_lesson_id, true, now())
    ON CONFLICT (user_id, lesson_id) 
    DO UPDATE SET completed = true, completed_at = now();
    
    -- Award XP
    IF lesson_xp IS NOT NULL AND lesson_xp > 0 THEN
        PERFORM public.increment_xp(p_user_id, lesson_xp);
    END IF;
    
    -- Update streak
    PERFORM public.update_streak(p_user_id);
END;
$$;

-- Add unique constraint for user_progress to enable upsert
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_lesson_unique UNIQUE (user_id, lesson_id);