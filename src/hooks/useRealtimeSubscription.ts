import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'subjects' | 'courses' | 'lessons' | 'practice_problems' | 'events' | 'mentors' | 'profiles' | 'mentor_sessions';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  queryKey: string[];
  enabled?: boolean;
}

export function useRealtimeSubscription({ table, queryKey, enabled = true }: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Realtime update on ${table}:`, payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, queryClient, enabled]);
}

// Hook for multiple tables at once
export function useMultipleRealtimeSubscriptions(
  subscriptions: { table: TableName; queryKey: string[] }[],
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channels = subscriptions.map(({ table, queryKey }) => {
      return supabase
        .channel(`realtime-${table}-${queryKey.join('-')}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [subscriptions, queryClient, enabled]);
}
