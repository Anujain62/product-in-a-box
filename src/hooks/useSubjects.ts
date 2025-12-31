import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
  is_published: boolean;
}

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      
      if (error) throw error;
      return data as Subject[];
    },
  });
}

export function useSubjectBySlug(slug: string) {
  return useQuery({
    queryKey: ['subject', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subject | null;
    },
    enabled: !!slug,
  });
}
