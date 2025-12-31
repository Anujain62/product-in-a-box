-- Function to grant achievement to user (prevents duplicates)
CREATE OR REPLACE FUNCTION public.grant_achievement(p_user_id uuid, p_achievement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if not already earned
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger function: Check for "First Steps" achievement (first lesson completed)
CREATE OR REPLACE FUNCTION public.check_first_lesson_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_id uuid;
  lesson_count integer;
BEGIN
  -- Only check when a lesson is marked as completed
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Get the "First Steps" achievement ID
    SELECT id INTO achievement_id
    FROM public.achievements
    WHERE name = 'First Steps';
    
    IF achievement_id IS NOT NULL THEN
      -- Check if this is their first completed lesson
      SELECT COUNT(*) INTO lesson_count
      FROM public.user_progress
      WHERE user_id = NEW.user_id AND completed = true;
      
      -- Grant if this is the first or only completed lesson
      IF lesson_count <= 1 THEN
        PERFORM public.grant_achievement(NEW.user_id, achievement_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Check streak achievements (7-day and 30-day)
CREATE OR REPLACE FUNCTION public.check_streak_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_achievement_id uuid;
  month_achievement_id uuid;
BEGIN
  -- Check for 7-day streak achievement
  IF NEW.current_streak >= 7 THEN
    SELECT id INTO week_achievement_id
    FROM public.achievements
    WHERE name = 'Week Warrior';
    
    IF week_achievement_id IS NOT NULL THEN
      PERFORM public.grant_achievement(NEW.user_id, week_achievement_id);
    END IF;
  END IF;
  
  -- Check for 30-day streak achievement
  IF NEW.current_streak >= 30 THEN
    SELECT id INTO month_achievement_id
    FROM public.achievements
    WHERE name = 'Month Master';
    
    IF month_achievement_id IS NOT NULL THEN
      PERFORM public.grant_achievement(NEW.user_id, month_achievement_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Check problems solved achievements (10 and 50 problems)
CREATE OR REPLACE FUNCTION public.check_problems_solved_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beginner_achievement_id uuid;
  crusher_achievement_id uuid;
  solved_count integer;
BEGIN
  -- Only check when a problem is marked as solved
  IF NEW.solved = true AND (OLD IS NULL OR OLD.solved = false) THEN
    -- Count total solved problems
    SELECT COUNT(*) INTO solved_count
    FROM public.user_problem_attempts
    WHERE user_id = NEW.user_id AND solved = true;
    
    -- Check for 10 problems solved (DSA Beginner)
    IF solved_count >= 10 THEN
      SELECT id INTO beginner_achievement_id
      FROM public.achievements
      WHERE name = 'DSA Beginner';
      
      IF beginner_achievement_id IS NOT NULL THEN
        PERFORM public.grant_achievement(NEW.user_id, beginner_achievement_id);
      END IF;
    END IF;
    
    -- Check for 50 problems solved (Problem Crusher)
    IF solved_count >= 50 THEN
      SELECT id INTO crusher_achievement_id
      FROM public.achievements
      WHERE name = 'Problem Crusher';
      
      IF crusher_achievement_id IS NOT NULL THEN
        PERFORM public.grant_achievement(NEW.user_id, crusher_achievement_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Check study group achievement (joining a group)
CREATE OR REPLACE FUNCTION public.check_study_group_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_id uuid;
BEGIN
  -- Get the "Study Buddy" achievement ID
  SELECT id INTO achievement_id
  FROM public.achievements
  WHERE name = 'Study Buddy';
  
  IF achievement_id IS NOT NULL THEN
    PERFORM public.grant_achievement(NEW.user_id, achievement_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Check mentor session achievement (first session completed)
CREATE OR REPLACE FUNCTION public.check_mentor_session_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_id uuid;
BEGIN
  -- Only check when session is marked as completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    SELECT id INTO achievement_id
    FROM public.achievements
    WHERE name = 'Mentor Connect';
    
    IF achievement_id IS NOT NULL THEN
      -- Grant to the student
      PERFORM public.grant_achievement(NEW.student_id, achievement_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_lesson_completed
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_first_lesson_achievement();

CREATE TRIGGER on_streak_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
  EXECUTE FUNCTION public.check_streak_achievements();

CREATE TRIGGER on_problem_solved
  AFTER INSERT OR UPDATE ON public.user_problem_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_problems_solved_achievements();

CREATE TRIGGER on_study_group_joined
  AFTER INSERT ON public.study_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_study_group_achievement();

CREATE TRIGGER on_mentor_session_completed
  AFTER UPDATE ON public.mentor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mentor_session_achievement();

-- Add unique constraint on user_achievements to prevent duplicates
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id);