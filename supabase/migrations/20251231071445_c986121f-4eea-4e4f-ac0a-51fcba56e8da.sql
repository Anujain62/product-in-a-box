-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table (DSA, System Design, etc.)
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table (modules within subjects)
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    duration_hours INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(subject_id, slug)
);

-- Create lessons table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(course_id, slug)
);

-- Create patterns table for tagging
CREATE TABLE public.patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_patterns junction table
CREATE TABLE public.lesson_patterns (
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (lesson_id, pattern_id)
);

-- Create practice_problems table
CREATE TABLE public.practice_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    solution TEXT,
    hints TEXT[],
    xp_reward INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Create user_problem_attempts table
CREATE TABLE public.user_problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    problem_id UUID REFERENCES public.practice_problems(id) ON DELETE CASCADE NOT NULL,
    solved BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 1,
    solved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, problem_id)
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Create mentors table
CREATE TABLE public.mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    title TEXT,
    company TEXT,
    expertise TEXT[],
    bio TEXT,
    hourly_rate INTEGER,
    is_available BOOLEAN NOT NULL DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentor_availability table
CREATE TABLE public.mentor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_types table
CREATE TABLE public.session_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    base_price INTEGER NOT NULL DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentor_sessions table
CREATE TABLE public.mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_type_id UUID REFERENCES public.session_types(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
    price INTEGER NOT NULL,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_groups table
CREATE TABLE public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    max_members INTEGER NOT NULL DEFAULT 20,
    monthly_price INTEGER NOT NULL DEFAULT 99,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_group_members table
CREATE TABLE public.study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('member', 'moderator', 'leader')) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create discussion_threads table
CREATE TABLE public.discussion_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion_replies table
CREATE TABLE public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.discussion_threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    is_best_answer BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('webinar', 'workshop', 'contest', 'ama', 'other')) NOT NULL DEFAULT 'other',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    max_attendees INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_registrations table
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create subscriptions table for pro features
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT CHECK (plan IN ('free', 'pro', 'premium')) NOT NULL DEFAULT 'free',
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard_entries table (materialized weekly/monthly)
CREATE TABLE public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    period_type TEXT CHECK (period_type IN ('weekly', 'monthly', 'all_time')) NOT NULL,
    period_start DATE NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, period_type, period_start)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: users can view their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: public read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subjects, courses, lessons, patterns: public read, admin write
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Patterns are viewable by everyone" ON public.patterns FOR SELECT USING (true);
CREATE POLICY "Admins can manage patterns" ON public.patterns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lesson patterns are viewable by everyone" ON public.lesson_patterns FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson patterns" ON public.lesson_patterns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Practice problems are viewable by everyone" ON public.practice_problems FOR SELECT USING (true);
CREATE POLICY "Admins can manage practice problems" ON public.practice_problems FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User progress: users can manage their own
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own attempts" ON public.user_problem_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.user_problem_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON public.user_problem_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks: users can manage their own
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- Achievements: public read
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mentors: public read, mentors can update own
CREATE POLICY "Mentors are viewable by everyone" ON public.mentors FOR SELECT USING (true);
CREATE POLICY "Mentors can update own profile" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can become mentors" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'mentor'));

CREATE POLICY "Mentor availability is viewable by everyone" ON public.mentor_availability FOR SELECT USING (true);
CREATE POLICY "Mentors can manage own availability" ON public.mentor_availability FOR ALL USING (
    EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND user_id = auth.uid())
);

CREATE POLICY "Session types are viewable by everyone" ON public.session_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage session types" ON public.session_types FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Mentor sessions: participants can view/manage
CREATE POLICY "Participants can view sessions" ON public.mentor_sessions FOR SELECT USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND user_id = auth.uid())
);
CREATE POLICY "Students can book sessions" ON public.mentor_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update sessions" ON public.mentor_sessions FOR UPDATE USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND user_id = auth.uid())
);

-- Study groups: public read, members can interact
CREATE POLICY "Study groups are viewable by everyone" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group members are viewable by everyone" ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- Discussions: public read, authenticated write
CREATE POLICY "Threads are viewable by everyone" ON public.discussion_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.discussion_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update threads" ON public.discussion_threads FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Replies are viewable by everyone" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON public.discussion_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update replies" ON public.discussion_replies FOR UPDATE USING (auth.uid() = author_id);

-- Events: public read
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrations viewable by user" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions: users can view own
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Leaderboard: public read
CREATE POLICY "Leaderboard is viewable by everyone" ON public.leaderboard_entries FOR SELECT USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON public.discussion_threads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON public.discussion_replies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();