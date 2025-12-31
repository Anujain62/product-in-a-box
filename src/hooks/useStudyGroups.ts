import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  max_members: number;
  monthly_price: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  member_count: number;
  leader?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  subject?: {
    name: string;
    slug: string;
  };
  is_member?: boolean;
}

export function useStudyGroups() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['studyGroups', user?.id],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          subjects (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get member counts and leader info for each group
      const groupsWithStats = await Promise.all(
        (groups || []).map(async (group: any) => {
          // Get member count
          const { count } = await supabase
            .from('study_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          // Get leader info
          let leader = null;
          if (group.created_by) {
            const { data: leaderProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', group.created_by)
              .maybeSingle();
            leader = leaderProfile;
          }
          
          // Check if current user is a member
          let is_member = false;
          if (user?.id) {
            const { data: membership } = await supabase
              .from('study_group_members')
              .select('id')
              .eq('group_id', group.id)
              .eq('user_id', user.id)
              .maybeSingle();
            is_member = !!membership;
          }
          
          return {
            ...group,
            member_count: count || 0,
            leader,
            subject: group.subjects,
            is_member,
          };
        })
      );
      
      return groupsWithStats as StudyGroup[];
    },
  });
}

export function useJoinStudyGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyGroups'] });
    },
  });
}

export function useLeaveStudyGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyGroups'] });
    },
  });
}

export function useCreateStudyGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; subject_id?: string; max_members?: number; monthly_price?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: group, error } = await supabase
        .from('study_groups')
        .insert({
          name: data.name,
          description: data.description || null,
          subject_id: data.subject_id || null,
          max_members: data.max_members || 20,
          monthly_price: data.monthly_price || 99,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-join as leader
      await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'leader',
        });
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyGroups'] });
    },
  });
}
