import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StudyGroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface StudyGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface StudyGroupDetail {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  max_members: number;
  monthly_price: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  subject?: {
    name: string;
    slug: string;
  };
}

export function useStudyGroupDetail(groupId: string) {
  return useQuery({
    queryKey: ['studyGroupDetail', groupId],
    queryFn: async () => {
      const { data: group, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          subjects (
            name,
            slug
          )
        `)
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      
      return {
        ...group,
        subject: group.subjects,
      } as StudyGroupDetail;
    },
    enabled: !!groupId,
  });
}

export function useStudyGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['studyGroupMembers', groupId],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      // Get profiles for all members
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return members.map(member => ({
        ...member,
        profile: profileMap.get(member.user_id) || null,
      })) as StudyGroupMember[];
    },
    enabled: !!groupId,
  });
}

export function useStudyGroupMessages(groupId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['studyGroupMessages', groupId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('study_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      // Get profiles for all message authors
      const userIds = [...new Set(messages.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return messages.map(message => ({
        ...message,
        profile: profileMap.get(message.user_id) || null,
      })) as StudyGroupMessage[];
    },
    enabled: !!groupId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Get the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();
          
          const newMessage: StudyGroupMessage = {
            ...payload.new as any,
            profile: profile || null,
          };
          
          // Update the cache with the new message
          queryClient.setQueryData<StudyGroupMessage[]>(
            ['studyGroupMessages', groupId],
            (old) => old ? [...old, newMessage] : [newMessage]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  return query;
}

export function useSendGroupMessage() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: message, error } = await supabase
        .from('study_group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return message;
    },
    onError: (error) => {
      toast.error('Failed to send message: ' + error.message);
    },
  });
}

export function useCheckMembership(groupId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['groupMembership', groupId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: membership, error } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return membership;
    },
    enabled: !!groupId && !!user?.id,
  });
}
