import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  lessonCount: number;
  totalHours: number;
  studentCount: number;
}

export function useSubjectsWithStats() {
  return useQuery({
    queryKey: ['subjectsWithStats'],
    queryFn: async () => {
      // Get subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      
      if (subjectsError) throw subjectsError;
      
      // For each subject, get stats
      const subjectsWithStats: SubjectWithStats[] = await Promise.all(
        (subjects || []).map(async (subject) => {
          // Get courses for this subject
          const { data: courses } = await supabase
            .from('courses')
            .select('id, duration_hours')
            .eq('subject_id', subject.id)
            .eq('is_published', true);
          
          const courseIds = courses?.map(c => c.id) || [];
          
          // Get lesson count
          let lessonCount = 0;
          if (courseIds.length > 0) {
            const { count } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .in('course_id', courseIds)
              .eq('is_published', true);
            lessonCount = count || 0;
          }
          
          // Calculate total hours
          const totalHours = courses?.reduce((sum, c) => sum + (c.duration_hours || 0), 0) || 0;
          
          // Get student count (unique users who have progress in this subject's courses)
          let studentCount = 0;
          if (courseIds.length > 0) {
            const { data: lessonIds } = await supabase
              .from('lessons')
              .select('id')
              .in('course_id', courseIds);
            
            if (lessonIds && lessonIds.length > 0) {
              const { data: progress } = await supabase
                .from('user_progress')
                .select('user_id')
                .in('lesson_id', lessonIds.map(l => l.id));
              
              studentCount = new Set(progress?.map(p => p.user_id)).size;
            }
          }
          
          return {
            id: subject.id,
            name: subject.name,
            slug: subject.slug,
            description: subject.description,
            icon: subject.icon,
            color: subject.color,
            lessonCount,
            totalHours,
            studentCount,
          };
        })
      );
      
      return subjectsWithStats;
    },
  });
}
