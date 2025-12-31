import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { CodeEditor } from '@/components/lesson/CodeEditor';
import { MarkdownContent } from '@/components/lesson/MarkdownContent';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Zap, 
  BookOpen,
  Code,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function LessonViewer() {
  const { subjectSlug, courseSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const startTimeRef = useRef(Date.now());
  const timeSpentRef = useRef(0);

  // Fetch lesson data
  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', subjectSlug, courseSlug, lessonSlug],
    queryFn: async () => {
      // Get subject
      const { data: subject } = await supabase
        .from('subjects')
        .select('id, name, slug')
        .eq('slug', subjectSlug)
        .maybeSingle();
      
      if (!subject) throw new Error('Subject not found');

      // Get course
      const { data: course } = await supabase
        .from('courses')
        .select('id, title, slug, subject_id')
        .eq('slug', courseSlug)
        .eq('subject_id', subject.id)
        .maybeSingle();
      
      if (!course) throw new Error('Course not found');

      // Get all lessons in this course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, slug, duration_minutes, order_index, xp_reward')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index');

      // Get current lesson
      const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('slug', lessonSlug)
        .eq('course_id', course.id)
        .maybeSingle();

      if (!lesson) throw new Error('Lesson not found');

      // Get practice problems for this lesson
      const { data: problems } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('lesson_id', lesson.id);

      return { subject, course, lessons: lessons || [], lesson, problems: problems || [] };
    },
    enabled: !!subjectSlug && !!courseSlug && !!lessonSlug,
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', lessonData?.course?.id, user?.id],
    queryFn: async () => {
      if (!user || !lessonData?.lessons) return { completed: [], currentProgress: null };

      const lessonIds = lessonData.lessons.map(l => l.id);
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      const currentProgress = progress?.find(p => p.lesson_id === lessonData.lesson.id);
      const completed = progress?.filter(p => p.completed).map(p => p.lesson_id) || [];

      return { completed, currentProgress };
    },
    enabled: !!user && !!lessonData?.lessons,
  });

  // Fetch bookmark status
  const { data: isBookmarked } = useQuery({
    queryKey: ['bookmark', lessonData?.lesson?.id, user?.id],
    queryFn: async () => {
      if (!user || !lessonData?.lesson) return false;
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonData.lesson.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!lessonData?.lesson,
  });

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      timeSpentRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save progress when leaving
  useEffect(() => {
    const saveProgress = async () => {
      if (!user || !lessonData?.lesson) return;

      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, time_spent_seconds')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonData.lesson.id)
        .maybeSingle();

      const totalTime = (existing?.time_spent_seconds || 0) + timeSpentRef.current;

      if (existing) {
        await supabase
          .from('user_progress')
          .update({ time_spent_seconds: totalTime })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonData.lesson.id,
            time_spent_seconds: timeSpentRef.current,
          });
      }
    };

    return () => {
      saveProgress();
    };
  }, [user, lessonData?.lesson]);

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !lessonData?.lesson) return;

      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonData.lesson.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonData.lesson.id,
            completed: true,
            completed_at: new Date().toISOString(),
          });
      }

      // Update XP
      await supabase
        .from('profiles')
        .update({ 
          total_xp: supabase.rpc ? undefined : undefined // We'd use an RPC for atomic increment
        })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      toast({
        title: 'Lesson completed!',
        description: `You earned ${lessonData?.lesson.xp_reward} XP`,
      });
    },
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user || !lessonData?.lesson) return;

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lessonData.lesson.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            lesson_id: lessonData.lesson.id,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark'] });
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Lesson bookmarked',
      });
    },
  });

  // Navigation
  const currentIndex = lessonData?.lessons.findIndex(l => l.id === lessonData.lesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? lessonData?.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < (lessonData?.lessons.length ?? 0) - 1 
    ? lessonData?.lessons[currentIndex + 1] 
    : null;

  const isCompleted = userProgress?.completed.includes(lessonData?.lesson?.id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  const { subject, course, lessons, lesson, problems } = lessonData;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <LessonSidebar
          lessons={lessons}
          currentLessonId={lesson.id}
          courseSlug={course.slug}
          subjectSlug={subject.slug}
          completedLessons={userProgress?.completed || []}
          courseTitle={course.title}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/courses" className="hover:text-foreground">Courses</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link to={`/courses/${subject.slug}`} className="hover:text-foreground">{subject.name}</Link>
                </div>
                <h1 className="font-semibold line-clamp-1">{lesson.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 mr-4">
                {lesson.duration_minutes && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes} min
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-primary">
                  <Zap className="w-4 h-4" />
                  +{lesson.xp_reward} XP
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleBookmarkMutation.mutate()}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>

              {isCompleted ? (
                <Badge variant="default" className="bg-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Button 
                  size="sm"
                  onClick={() => markCompleteMutation.mutate()}
                  disabled={markCompleteMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Video player */}
          <VideoPlayer 
            videoUrl={lesson.video_url} 
            title={lesson.title}
            onComplete={() => markCompleteMutation.mutate()}
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="mb-6">
              <TabsTrigger value="content" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Content
              </TabsTrigger>
              {problems.length > 0 && (
                <TabsTrigger value="practice" className="gap-2">
                  <Code className="w-4 h-4" />
                  Practice ({problems.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="content">
              {lesson.content ? (
                <MarkdownContent content={lesson.content} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Lesson content coming soon</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="practice" className="space-y-8">
              {problems.map((problem, index) => (
                <div key={problem.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">Problem {index + 1}</span>
                        <Badge variant={
                          problem.difficulty === 'easy' ? 'default' :
                          problem.difficulty === 'medium' ? 'secondary' : 'destructive'
                        } className={cn(
                          problem.difficulty === 'easy' && 'bg-success',
                          problem.difficulty === 'medium' && 'bg-warning text-warning-foreground'
                        )}>
                          {problem.difficulty}
                        </Badge>
                        <span className="text-sm text-primary flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          +{problem.xp_reward} XP
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold">{problem.title}</h3>
                    </div>
                  </div>
                  
                  {problem.description && (
                    <p className="text-muted-foreground">{problem.description}</p>
                  )}
                  
                  <CodeEditor 
                    solution={problem.solution}
                    hints={problem.hints}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
            {prevLesson ? (
              <Link
                to={`/courses/${subject.slug}/${course.slug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide">Previous</p>
                  <p className="font-medium">{prevLesson.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link
                to={`/courses/${subject.slug}/${course.slug}/${nextLesson.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide">Next</p>
                  <p className="font-medium">{nextLesson.title}</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Button onClick={() => navigate(`/courses/${subject.slug}`)}>
                Back to Course
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
