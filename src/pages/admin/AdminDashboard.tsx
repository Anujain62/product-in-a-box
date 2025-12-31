import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Calendar,
  MessageSquare,
  Trophy,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalSubjects: number;
  totalCourses: number;
  totalLessons: number;
  totalMentors: number;
  totalSessions: number;
  totalStudyGroups: number;
  totalDiscussions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSubjects: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalMentors: 0,
    totalSessions: 0,
    totalStudyGroups: 0,
    totalDiscussions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: usersCount },
          { count: subjectsCount },
          { count: coursesCount },
          { count: lessonsCount },
          { count: mentorsCount },
          { count: sessionsCount },
          { count: groupsCount },
          { count: discussionsCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('mentors').select('*', { count: 'exact', head: true }),
          supabase.from('mentor_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('study_groups').select('*', { count: 'exact', head: true }),
          supabase.from('discussion_threads').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalUsers: usersCount || 0,
          totalSubjects: subjectsCount || 0,
          totalCourses: coursesCount || 0,
          totalLessons: lessonsCount || 0,
          totalMentors: mentorsCount || 0,
          totalSessions: sessionsCount || 0,
          totalStudyGroups: groupsCount || 0,
          totalDiscussions: discussionsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-info' },
    { label: 'Courses', value: stats.totalCourses, icon: GraduationCap, color: 'text-accent' },
    { label: 'Lessons', value: stats.totalLessons, icon: TrendingUp, color: 'text-warning' },
    { label: 'Mentors', value: stats.totalMentors, icon: Trophy, color: 'text-success' },
    { label: 'Sessions', value: stats.totalSessions, icon: Calendar, color: 'text-info' },
    { label: 'Study Groups', value: stats.totalStudyGroups, icon: Users, color: 'text-accent' },
    { label: 'Discussions', value: stats.totalDiscussions, icon: MessageSquare, color: 'text-warning' },
  ];

  return (
    <AdminLayout title="Dashboard" description="Overview of your platform">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-secondary rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Activity feed will be populated as users interact with the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Use the sidebar to manage content, users, and settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
