import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  problems_solved: number;
}

export function useLeaderboard(period: 'weekly' | 'monthly' | 'alltime' = 'alltime') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      // For now, fetch from profiles ordered by XP
      // In production, you'd use leaderboard_entries for period-specific rankings
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, total_xp, current_streak')
        .order('total_xp', { ascending: false })
        .limit(50);
      
      if (profilesError) throw profilesError;
      
      // Get problems solved count for each user
      const entries: LeaderboardEntry[] = await Promise.all(
        (profiles || []).map(async (profile, index) => {
          const { count } = await supabase
            .from('user_problem_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .eq('solved', true);
          
          return {
            rank: index + 1,
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            total_xp: profile.total_xp,
            current_streak: profile.current_streak,
            problems_solved: count || 0,
          };
        })
      );
      
      return entries;
    },
  });
}
