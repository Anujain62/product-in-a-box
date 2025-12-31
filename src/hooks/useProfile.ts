import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'full_name' | 'bio' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useUserStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get lesson progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id);
      
      if (progressError) throw progressError;
      
      // Get problem attempts
      const { data: problems, error: problemsError } = await supabase
        .from('user_problem_attempts')
        .select('problem_id, solved')
        .eq('user_id', user.id)
        .eq('solved', true);
      
      if (problemsError) throw problemsError;
      
      // Get mentor sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('mentor_sessions')
        .select('id')
        .eq('student_id', user.id);
      
      if (sessionsError) throw sessionsError;
      
      // Get unique courses started
      const { data: courses, error: coursesError } = await supabase
        .from('user_progress')
        .select('lesson_id, lessons!inner(course_id)')
        .eq('user_id', user.id);
      
      if (coursesError) throw coursesError;
      
      const uniqueCourses = new Set(courses?.map((c: any) => c.lessons?.course_id)).size;
      
      return {
        lessonsCompleted: progress?.filter(p => p.completed).length || 0,
        problemsSolved: problems?.length || 0,
        mentorSessions: sessions?.length || 0,
        coursesStarted: uniqueCourses,
      };
    },
    enabled: !!user?.id,
  });
}

export function useUserAchievements() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userAchievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            xp_reward
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useRecentActivity() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recentActivity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          id,
          completed,
          completed_at,
          lessons (
            id,
            title,
            slug,
            courses (
              title,
              slug,
              subjects (
                name,
                slug
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
