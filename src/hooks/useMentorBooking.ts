import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
}

export function useMentorAvailability(mentorId: string) {
  return useQuery({
    queryKey: ['mentorAvailability', mentorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('day_of_week');
      
      if (error) throw error;
      return data as MentorAvailability[];
    },
    enabled: !!mentorId,
  });
}

export function useMentorSessions(mentorId: string) {
  return useQuery({
    queryKey: ['mentorSessions', mentorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('mentor_id', mentorId)
        .gte('scheduled_at', new Date().toISOString())
        .in('status', ['pending', 'confirmed']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!mentorId,
  });
}

interface BookSessionParams {
  mentorId: string;
  sessionTypeId: string;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  notes?: string;
}

export function useBookSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: BookSessionParams) => {
      if (!user) throw new Error('Must be logged in to book a session');

      const { data, error } = await supabase
        .from('mentor_sessions')
        .insert({
          mentor_id: params.mentorId,
          student_id: user.id,
          session_type_id: params.sessionTypeId,
          scheduled_at: params.scheduledAt,
          duration_minutes: params.durationMinutes,
          price: params.price,
          notes: params.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorSessions', variables.mentorId] });
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
    },
  });
}

export function useUserSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userSessions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('mentor_sessions')
        .select(`
          *,
          session_type:session_types(*)
        `)
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      // Fetch mentor info for each session
      const sessionsWithMentors = await Promise.all(
        (data || []).map(async (session: any) => {
          const { data: mentor } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', session.mentor_id)
            .maybeSingle();

          let mentorProfile = null;
          if (mentor) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', mentor.user_id)
              .maybeSingle();
            mentorProfile = profile;
          }

          return {
            ...session,
            mentor: mentor ? { ...mentor, profile: mentorProfile } : null,
          };
        })
      );

      return sessionsWithMentors;
    },
    enabled: !!user,
  });
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from('mentor_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      queryClient.invalidateQueries({ queryKey: ['mentorSessions'] });
    },
  });
}
