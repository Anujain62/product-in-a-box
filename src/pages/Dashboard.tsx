import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Trophy, BookOpen, Target, TrendingUp, Clock, Award, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserStats, useUserAchievements, useRecentActivity } from '@/hooks/useProfile';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: achievements } = useUserAchievements();
  const { data: recentActivity } = useRecentActivity();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  const quickStats = [
    { 
      label: 'Current Streak', 
      value: profile ? `${profile.current_streak} days` : '0 days', 
      icon: Flame, 
      color: 'text-warning' 
    },
    { 
      label: 'Total XP', 
      value: profile ? profile.total_xp.toLocaleString() : '0', 
      icon: Trophy, 
      color: 'text-primary' 
    },
    { 
      label: 'Lessons Completed', 
      value: stats?.lessonsCompleted?.toString() || '0', 
      icon: BookOpen, 
      color: 'text-info' 
    },
    { 
      label: 'Problems Solved', 
      value: stats?.problemsSolved?.toString() || '0', 
      icon: Target, 
      color: 'text-accent' 
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-primary">{profile?.full_name || user?.user_metadata?.full_name || 'Learner'}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickStats.map((stat) => {
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
                      {profileLoading || statsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <p className="text-2xl font-bold">{stat.value}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {recentActivity && recentActivity.length > 0 ? 'Recent Progress' : 'Continue Learning'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity: any) => (
                      <Link
                        key={activity.id}
                        to={`/courses/${activity.lessons?.courses?.subjects?.slug}/${activity.lessons?.courses?.slug}/${activity.lessons?.slug}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{activity.lessons?.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.lessons?.courses?.title} • {activity.lessons?.courses?.subjects?.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Start Your First Course</h3>
                    <p className="text-muted-foreground mb-4">Explore our courses and begin your journey</p>
                    <Button asChild>
                      <Link to="/courses">Browse Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" asChild>
                  <Link to="/my-sessions">View My Sessions</Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start" asChild>
                  <Link to="/mentors">Book a Mentor Session</Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start" asChild>
                  <Link to="/study-groups">Join a Study Group</Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start" asChild>
                  <Link to="/leaderboard">View Leaderboard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements && achievements.length > 0 ? (
                  <div className="space-y-2">
                    {achievements.slice(0, 3).map((ua: any) => (
                      <div key={ua.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        <span className="text-2xl">{ua.achievements?.icon || '🏆'}</span>
                        <div>
                          <p className="font-medium text-sm">{ua.achievements?.name}</p>
                          <p className="text-xs text-muted-foreground">+{ua.achievements?.xp_reward} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete lessons to earn achievements!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
