import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function CourseDetail() {
  const { subjectSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch subject and its courses
  const { data, isLoading } = useQuery({
    queryKey: ['subject-detail', subjectSlug],
    queryFn: async () => {
      const { data: subject } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', subjectSlug)
        .maybeSingle();

      if (!subject) throw new Error('Subject not found');

      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('subject_id', subject.id)
        .eq('is_published', true)
        .order('order_index');

      // For each course, get lessons
      const coursesWithLessons = await Promise.all(
        (courses || []).map(async (course) => {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id, title, slug, duration_minutes, xp_reward, order_index')
            .eq('course_id', course.id)
            .eq('is_published', true)
            .order('order_index');
          
          return { ...course, lessons: lessons || [] };
        })
      );

      return { subject, courses: coursesWithLessons };
    },
    enabled: !!subjectSlug,
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['subject-progress', subjectSlug, user?.id],
    queryFn: async () => {
      if (!user || !data?.courses) return { completed: [], totalLessons: 0 };

      const allLessonIds = data.courses.flatMap(c => c.lessons.map((l: { id: string }) => l.id));
      
      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('lesson_id', allLessonIds);

      return {
        completed: progress?.map(p => p.lesson_id) || [],
        totalLessons: allLessonIds.length,
      };
    },
    enabled: !!user && !!data?.courses,
  });

  const totalLessons = data?.courses.reduce((acc, c) => acc + c.lessons.length, 0) || 0;
  const totalDuration = data?.courses.reduce((acc, c) => acc + (c.duration_hours || 0), 0) || 0;
  const completedCount = userProgress?.completed.length || 0;
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  // Find first incomplete lesson for "Start Learning" button
  const getFirstIncompleteLessonUrl = () => {
    if (!data?.courses) return null;
    for (const course of data.courses) {
      for (const lesson of course.lessons) {
        if (!userProgress?.completed.includes(lesson.id)) {
          return `/courses/${subjectSlug}/${course.slug}/${lesson.slug}`;
        }
      }
    }
    // All complete, return first lesson
    const firstCourse = data.courses[0];
    const firstLesson = firstCourse?.lessons[0];
    if (firstCourse && firstLesson) {
      return `/courses/${subjectSlug}/${firstCourse.slug}/${firstLesson.slug}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Subject not found</h1>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </Layout>
    );
  }

  const { subject, courses } = data;

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/courses" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {subject.icon && (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                )}
                <Badge variant="secondary">Free Course</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{subject.name}</h1>
              <p className="text-muted-foreground text-lg">{subject.description}</p>
              <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> 
                  {totalLessons} Lessons
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 
                  {totalDuration}+ Hours
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> 
                  {courses.length} Courses
                </span>
              </div>
            </div>

            {/* Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Courses coming soon</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full" defaultValue="course-0">
                    {courses.map((course, idx) => {
                      const courseLessonIds = course.lessons.map((l: { id: string }) => l.id);
                      const completedInCourse = userProgress?.completed.filter(id => courseLessonIds.includes(id)).length || 0;
                      const courseProgress = course.lessons.length > 0 
                        ? (completedInCourse / course.lessons.length) * 100 
                        : 0;

                      return (
                        <AccordionItem key={course.id} value={`course-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                courseProgress === 100 
                                  ? "bg-success text-success-foreground" 
                                  : "bg-secondary text-muted-foreground"
                              )}>
                                {courseProgress === 100 ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div className="text-left flex-1">
                                <span className="font-medium block">{course.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {course.lessons.length} lessons • {course.duration_hours || 0}h
                                </span>
                              </div>
                              <Badge variant={
                                course.difficulty === 'beginner' ? 'default' :
                                course.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                              } className={cn(
                                "mr-2",
                                course.difficulty === 'beginner' && 'bg-success',
                                course.difficulty === 'intermediate' && 'bg-warning text-warning-foreground'
                              )}>
                                {course.difficulty}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {course.lessons.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Lessons coming soon
                                </p>
                              ) : (
                                course.lessons.map((lesson: { 
                                  id: string; 
                                  title: string; 
                                  slug: string; 
                                  duration_minutes: number | null;
                                  xp_reward: number;
                                }) => {
                                  const isCompleted = userProgress?.completed.includes(lesson.id);
                                  
                                  return (
                                    <Link
                                      key={lesson.id}
                                      to={`/courses/${subjectSlug}/${course.slug}/${lesson.slug}`}
                                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center",
                                          isCompleted 
                                            ? "bg-success text-success-foreground" 
                                            : "bg-primary/10 text-primary"
                                        )}>
                                          {isCompleted ? (
                                            <CheckCircle className="h-4 w-4" />
                                          ) : (
                                            <Play className="h-4 w-4" />
                                          )}
                                        </div>
                                        <div>
                                          <span className="block text-sm font-medium">{lesson.title}</span>
                                          <span className="text-xs text-muted-foreground flex items-center gap-2">
                                            {lesson.duration_minutes && (
                                              <span>{lesson.duration_minutes} min</span>
                                            )}
                                            <span className="text-primary flex items-center gap-0.5">
                                              <Zap className="w-3 h-3" />
                                              +{lesson.xp_reward} XP
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </Link>
                                  );
                                })
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div 
                  className="aspect-video rounded-lg flex items-center justify-center mb-6 relative overflow-hidden"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                  <div className="relative text-6xl">{subject.icon || '📚'}</div>
                </div>
                
                <Button 
                  className="w-full mb-4" 
                  size="lg"
                  onClick={() => {
                    const url = getFirstIncompleteLessonUrl();
                    if (url) navigate(url);
                  }}
                  disabled={!getFirstIncompleteLessonUrl()}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {completedCount > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Your Progress</span>
                      <span className="font-medium">{completedCount}/{totalLessons} lessons</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Duration</span>
                      <span>{totalDuration}+ hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courses</span>
                      <span>{courses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Lessons</span>
                      <span>{totalLessons}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
