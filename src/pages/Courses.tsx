import { Link } from 'react-router-dom';
import { Code, Server, Layers, Cpu, Network, Database, Brain, ArrowRight, BookOpen, Clock, Users, LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubjectsWithStats } from '@/hooks/useCourseStats';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const iconMap: Record<string, LucideIcon> = {
  'Code': Code,
  'Server': Server,
  'Layers': Layers,
  'Cpu': Cpu,
  'Network': Network,
  'Database': Database,
  'Brain': Brain,
};

const getIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Code;
  return iconMap[iconName] || Code;
};

export default function Courses() {
  const { data: subjects, isLoading, error } = useSubjectsWithStats();

  // Real-time subscriptions for courses, subjects, and lessons
  useRealtimeSubscription({
    table: 'subjects',
    queryKey: ['subjects-with-stats'],
  });

  useRealtimeSubscription({
    table: 'courses',
    queryKey: ['subjects-with-stats'],
  });

  useRealtimeSubscription({
    table: 'lessons',
    queryKey: ['subjects-with-stats'],
  });

  return (
    <Layout>
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">100% Free Content</Badge>
          <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive, pattern-based curriculum designed for placements and real-world engineering
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load courses. Please try again.</p>
          </div>
        )}

        {/* Courses Grid */}
        {subjects && subjects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const Icon = getIcon(subject.icon);
              const colorClass = subject.color || 'primary';
              return (
                <Card key={subject.slug} className="group hover:shadow-lg transition-all hover:border-primary/30">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${colorClass}/10`}>
                      <Icon className={`h-6 w-6 text-${colorClass}`} />
                    </div>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {subject.lessonCount} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {subject.totalHours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> {subject.studentCount > 0 ? `${subject.studentCount}+` : '0'}
                      </span>
                    </div>
                    <Button className="w-full group-hover:bg-primary" variant="secondary" asChild>
                      <Link to={`/courses/${subject.slug}`}>
                        Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {subjects && subjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No courses available yet</h3>
            <p className="text-muted-foreground">Check back soon for new content!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
