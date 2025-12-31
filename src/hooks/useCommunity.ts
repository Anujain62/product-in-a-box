import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DiscussionThread {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  subject_id: string | null;
  lesson_id: string | null;
  upvotes: number;
  is_pinned: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  subject?: {
    name: string;
    slug: string;
  };
  reply_count?: number;
}

export function useDiscussionThreads(filter: 'trending' | 'recent' | 'unanswered' = 'trending') {
  return useQuery({
    queryKey: ['discussionThreads', filter],
    queryFn: async () => {
      let query = supabase
        .from('discussion_threads')
        .select(`
          *,
          profiles!discussion_threads_author_id_fkey (
            full_name,
            avatar_url
          ),
          subjects (
            name,
            slug
          )
        `);
      
      if (filter === 'trending') {
        query = query.order('upvotes', { ascending: false });
      } else if (filter === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (filter === 'unanswered') {
        query = query.eq('is_resolved', false).order('created_at', { ascending: false });
      }
      
      query = query.limit(20);
      
      const { data: threads, error } = await query;
      if (error) throw error;
      
      // Get reply counts
      const threadsWithCounts = await Promise.all(
        (threads || []).map(async (thread: any) => {
          const { count } = await supabase
            .from('discussion_replies')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);
          
          return {
            ...thread,
            author: thread.profiles,
            subject: thread.subjects,
            reply_count: count || 0,
          };
        })
      );
      
      return threadsWithCounts as DiscussionThread[];
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { title: string; content: string; subject_id?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: thread, error } = await supabase
        .from('discussion_threads')
        .insert({
          title: data.title,
          content: data.content,
          subject_id: data.subject_id || null,
          author_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussionThreads'] });
    },
  });
}

export function useTopContributors() {
  return useQuery({
    queryKey: ['topContributors'],
    queryFn: async () => {
      // Get users with most replies and upvotes
      const { data: replies, error } = await supabase
        .from('discussion_replies')
        .select('author_id');
      
      if (error) throw error;
      
      // Count replies per user
      const counts: Record<string, number> = {};
      replies?.forEach((r: any) => {
        counts[r.author_id] = (counts[r.author_id] || 0) + 1;
      });
      
      // Get top 5 users
      const topUserIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);
      
      if (topUserIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', topUserIds);
      
      return topUserIds.map(userId => {
        const profile = profiles?.find((p: any) => p.user_id === userId);
        return {
          user_id: userId,
          full_name: profile?.full_name || 'Anonymous',
          avatar_url: profile?.avatar_url,
          points: counts[userId] * 10,
        };
      });
    },
  });
}
