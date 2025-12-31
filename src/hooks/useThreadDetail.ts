import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ThreadWithDetails {
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
  user_has_upvoted?: boolean;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  subject?: {
    name: string;
    slug: string;
  };
}

export interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  upvotes: number;
  is_best_answer: boolean;
  created_at: string;
  updated_at: string;
  user_has_upvoted?: boolean;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useThread(threadId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const { data: thread, error } = await supabase
        .from('discussion_threads')
        .select(`
          *,
          subjects (
            name,
            slug
          )
        `)
        .eq('id', threadId)
        .single();
      
      if (error) throw error;

      // Get author profile separately
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', thread.author_id)
        .single();
      
      // Check if user has upvoted (we'll track this in localStorage for simplicity)
      const upvotedThreads = JSON.parse(localStorage.getItem('upvotedThreads') || '{}');
      const userKey = user?.id || 'anonymous';
      
      return {
        ...thread,
        author: authorProfile,
        subject: thread.subjects,
        user_has_upvoted: upvotedThreads[userKey]?.includes(threadId) || false,
      } as ThreadWithDetails;
    },
    enabled: !!threadId,
  });
}

export function useThreadReplies(threadId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['threadReplies', threadId],
    queryFn: async () => {
      const { data: replies, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('is_best_answer', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Get author profiles for all replies
      const authorIds = [...new Set(replies.map(r => r.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Check if user has upvoted replies
      const upvotedReplies = JSON.parse(localStorage.getItem('upvotedReplies') || '{}');
      const userKey = user?.id || 'anonymous';
      
      return replies.map((reply) => ({
        ...reply,
        author: profileMap.get(reply.author_id) || null,
        user_has_upvoted: upvotedReplies[userKey]?.includes(reply.id) || false,
      })) as Reply[];
    },
    enabled: !!threadId,
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: reply, error } = await supabase
        .from('discussion_replies')
        .insert({
          thread_id: threadId,
          content,
          author_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return reply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['discussionThreads'] });
      toast.success('Reply posted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to post reply: ' + error.message);
    },
  });
}

export function useUpvoteThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      const userKey = user?.id || 'anonymous';
      const upvotedThreads = JSON.parse(localStorage.getItem('upvotedThreads') || '{}');
      
      if (!upvotedThreads[userKey]) {
        upvotedThreads[userKey] = [];
      }
      
      const hasUpvoted = upvotedThreads[userKey].includes(threadId);
      
      // Get current upvotes
      const { data: currentThread } = await supabase
        .from('discussion_threads')
        .select('upvotes')
        .eq('id', threadId)
        .single();
      
      if (!currentThread) throw new Error('Thread not found');
      
      const newUpvotes = hasUpvoted 
        ? Math.max(0, currentThread.upvotes - 1)
        : currentThread.upvotes + 1;
      
      await supabase
        .from('discussion_threads')
        .update({ upvotes: newUpvotes })
        .eq('id', threadId);
      
      // Update localStorage
      if (hasUpvoted) {
        upvotedThreads[userKey] = upvotedThreads[userKey].filter((id: string) => id !== threadId);
      } else {
        upvotedThreads[userKey].push(threadId);
      }
      
      localStorage.setItem('upvotedThreads', JSON.stringify(upvotedThreads));
      return !hasUpvoted;
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['discussionThreads'] });
    },
  });
}

export function useUpvoteReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ replyId, threadId }: { replyId: string; threadId: string }) => {
      const userKey = user?.id || 'anonymous';
      const upvotedReplies = JSON.parse(localStorage.getItem('upvotedReplies') || '{}');
      
      if (!upvotedReplies[userKey]) {
        upvotedReplies[userKey] = [];
      }
      
      const hasUpvoted = upvotedReplies[userKey].includes(replyId);
      
      // Get current upvotes
      const { data: currentReply } = await supabase
        .from('discussion_replies')
        .select('upvotes')
        .eq('id', replyId)
        .single();
      
      if (!currentReply) throw new Error('Reply not found');
      
      const newUpvotes = hasUpvoted 
        ? Math.max(0, currentReply.upvotes - 1)
        : currentReply.upvotes + 1;
      
      await supabase
        .from('discussion_replies')
        .update({ upvotes: newUpvotes })
        .eq('id', replyId);
      
      // Update localStorage
      if (hasUpvoted) {
        upvotedReplies[userKey] = upvotedReplies[userKey].filter((id: string) => id !== replyId);
      } else {
        upvotedReplies[userKey].push(replyId);
      }
      
      localStorage.setItem('upvotedReplies', JSON.stringify(upvotedReplies));
      return { hasUpvoted: !hasUpvoted, threadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies', data.threadId] });
    },
  });
}

export function useMarkBestAnswer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ threadId, replyId }: { threadId: string; replyId: string }) => {
      // First, unmark any existing best answer
      await supabase
        .from('discussion_replies')
        .update({ is_best_answer: false })
        .eq('thread_id', threadId);
      
      // Mark the new best answer
      const { error } = await supabase
        .from('discussion_replies')
        .update({ is_best_answer: true })
        .eq('id', replyId);
      
      if (error) throw error;
      
      // Mark thread as resolved
      await supabase
        .from('discussion_threads')
        .update({ is_resolved: true })
        .eq('id', threadId);
      
      return { threadId, replyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['thread', data.threadId] });
      queryClient.invalidateQueries({ queryKey: ['threadReplies', data.threadId] });
      queryClient.invalidateQueries({ queryKey: ['discussionThreads'] });
      toast.success('Best answer marked!');
    },
    onError: (error) => {
      toast.error('Failed to mark best answer: ' + error.message);
    },
  });
}
