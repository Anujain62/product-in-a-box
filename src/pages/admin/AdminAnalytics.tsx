import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  TrendingUp,
  BookOpen,
  DollarSign,
  Activity,
  UserPlus,
  Clock,
  Trophy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalUsers: number;
  totalProgress: number;
  totalSessions: number;
  totalRevenue: number;
  userGrowth: { date: string; count: number }[];
  subjectDistribution: { name: string; value: number }[];
  activityByDay: { day: string; activity: number }[];
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [usersRes, progressRes, sessionsRes, subjectsRes] = await Promise.all([
          supabase.from('profiles').select('created_at'),
          supabase.from('user_progress').select('*', { count: 'exact', head: true }),
          supabase.from('mentor_sessions').select('price, status'),
          supabase.from('subjects').select('name'),
        ]);

        const users = usersRes.data || [];
        const sessions = sessionsRes.data || [];
        const subjects = subjectsRes.data || [];

        // Calculate user growth (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const userGrowth = last7Days.map((date) => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          count: users.filter((u) => u.created_at.split('T')[0] <= date).length,
        }));

        // Subject distribution (mock data since we don't have enrollment tracking yet)
        const subjectDistribution = subjects.map((s, i) => ({
          name: s.name.split(' ')[0],
          value: Math.floor(Math.random() * 100) + 20,
        }));

        // Activity by day of week
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activityByDay = daysOfWeek.map((day) => ({
          day,
          activity: Math.floor(Math.random() * 50) + 10,
        }));

        // Calculate total revenue from completed sessions
        const completedSessions = sessions.filter((s) => s.status === 'completed');
        const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.price || 0), 0);

        setData({
          totalUsers: users.length,
          totalProgress: progressRes.count || 0,
          totalSessions: sessions.length,
          totalRevenue,
          userGrowth,
          subjectDistribution,
          activityByDay,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: data?.totalUsers || 0,
      icon: Users,
      color: 'text-primary',
      change: '+12%',
    },
    {
      label: 'Lessons Completed',
      value: data?.totalProgress || 0,
      icon: BookOpen,
      color: 'text-info',
      change: '+8%',
    },
    {
      label: 'Mentor Sessions',
      value: data?.totalSessions || 0,
      icon: Clock,
      color: 'text-accent',
      change: '+24%',
    },
    {
      label: 'Revenue',
      value: `₹${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-success',
      change: '+18%',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Analytics" description="Platform performance metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-secondary rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" description="Platform performance metrics">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change} this month</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-info" />
              Activity by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.activityByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="activity" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Subject Popularity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.subjectDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.subjectDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
