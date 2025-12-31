import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Mentor {
  id: string;
  user_id: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_sessions: number;
  is_available: boolean;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useMentors(search?: string) {
  return useQuery({
    queryKey: ['mentors', search],
    queryFn: async () => {
      const { data: mentors, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      
      // Get profile info for each mentor
      const mentorsWithProfiles = await Promise.all(
        (mentors || []).map(async (mentor: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', mentor.user_id)
            .maybeSingle();
          
          return {
            ...mentor,
            profile,
          };
        })
      );
      
      // Filter by search if provided
      if (search) {
        const searchLower = search.toLowerCase();
        return mentorsWithProfiles.filter((m: any) => 
          m.profile?.full_name?.toLowerCase().includes(searchLower) ||
          m.company?.toLowerCase().includes(searchLower) ||
          m.expertise?.some((e: string) => e.toLowerCase().includes(searchLower))
        );
      }
      
      return mentorsWithProfiles as Mentor[];
    },
  });
}

export function useMentorById(mentorId: string) {
  return useQuery({
    queryKey: ['mentor', mentorId],
    queryFn: async () => {
      const { data: mentor, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('id', mentorId)
        .maybeSingle();
      
      if (error) throw error;
      if (!mentor) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', mentor.user_id)
        .maybeSingle();
      
      return {
        ...mentor,
        profile,
      } as Mentor;
    },
    enabled: !!mentorId,
  });
}

export function useSessionTypes() {
  return useQuery({
    queryKey: ['sessionTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_types')
        .select('*')
        .order('duration_minutes');
      
      if (error) throw error;
      return data;
    },
  });
}
