-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL, -- 'achievement', 'study_group_message', 'mentor_session', 'system'
    title TEXT NOT NULL,
    message TEXT,
    link TEXT, -- Optional link to navigate to
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB, -- Store additional data like achievement_id, group_id, etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System/triggers can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on achievement earned
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    achievement_name TEXT;
    achievement_icon TEXT;
BEGIN
    -- Get achievement details
    SELECT name, icon INTO achievement_name, achievement_icon
    FROM public.achievements
    WHERE id = NEW.achievement_id;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
        NEW.user_id,
        'achievement',
        'Achievement Unlocked!',
        'You earned the "' || achievement_name || '" achievement!',
        jsonb_build_object('achievement_id', NEW.achievement_id, 'icon', achievement_icon)
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for achievement notifications
CREATE TRIGGER on_achievement_earned
AFTER INSERT ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.notify_achievement_earned();

-- Create study group messages table
CREATE TABLE public.study_group_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in their groups
CREATE POLICY "Group members can view messages"
ON public.study_group_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.study_group_members
        WHERE group_id = study_group_messages.group_id
        AND user_id = auth.uid()
    )
);

-- Members can post messages
CREATE POLICY "Group members can post messages"
ON public.study_group_messages
FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.study_group_members
        WHERE group_id = study_group_messages.group_id
        AND user_id = auth.uid()
    )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;

-- Function to notify group members of new messages
CREATE OR REPLACE FUNCTION public.notify_group_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name TEXT;
    group_name TEXT;
    member_id UUID;
BEGIN
    -- Get sender name
    SELECT full_name INTO sender_name
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Get group name
    SELECT name INTO group_name
    FROM public.study_groups
    WHERE id = NEW.group_id;
    
    -- Notify all other group members
    FOR member_id IN
        SELECT user_id FROM public.study_group_members
        WHERE group_id = NEW.group_id AND user_id != NEW.user_id
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (
            member_id,
            'study_group_message',
            'New message in ' || group_name,
            COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
            '/study-groups',
            jsonb_build_object('group_id', NEW.group_id, 'message_id', NEW.id)
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Trigger for message notifications
CREATE TRIGGER on_group_message
AFTER INSERT ON public.study_group_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_group_message();