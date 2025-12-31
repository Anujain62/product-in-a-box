import { ChevronRight, Check, Play, Lock, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number | null;
  order_index: number;
}

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseSlug: string;
  subjectSlug: string;
  completedLessons: string[];
  courseTitle: string;
}

export function LessonSidebar({ 
  lessons, 
  currentLessonId, 
  courseSlug,
  subjectSlug,
  completedLessons,
  courseTitle 
}: LessonSidebarProps) {
  const progressPercent = lessons.length > 0 
    ? (completedLessons.length / lessons.length) * 100 
    : 0;

  return (
    <div className="w-80 border-r border-border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link 
          to={`/courses/${subjectSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to course
        </Link>
        <h2 className="font-semibold mt-2 line-clamp-2">{courseTitle}</h2>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Lessons list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isCurrent = lesson.id === currentLessonId;
            const isLocked = false; // Could implement sequential unlocking

            return (
              <Link
                key={lesson.id}
                to={`/courses/${subjectSlug}/${courseSlug}/${lesson.slug}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all",
                  isCurrent 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-secondary/50",
                  isLocked && "opacity-50 pointer-events-none"
                )}
              >
                {/* Status icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
                  isCompleted 
                    ? "bg-success text-success-foreground" 
                    : isCurrent 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Play className="w-3 h-3 ml-0.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Lesson info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium line-clamp-2",
                    isCurrent && "text-primary"
                  )}>
                    {lesson.title}
                  </p>
                  {lesson.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_minutes} min
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
