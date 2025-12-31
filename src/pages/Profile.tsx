import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Flame, Trophy, BookOpen, Settings, Camera } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <Layout><div className="container py-20 text-center">Loading...</div></Layout>;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(user.user_metadata?.full_name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold">{user.user_metadata?.full_name || 'User'}</h1>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  <Badge variant="secondary"><Flame className="h-3 w-3 mr-1 text-warning" /> 0 day streak</Badge>
                  <Badge variant="secondary"><Trophy className="h-3 w-3 mr-1 text-primary" /> 0 XP</Badge>
                </div>
              </div>
              <Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Edit Profile</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Stats */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="progress">
              <TabsList className="mb-6">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="progress">
                <Card>
                  <CardHeader><CardTitle>Course Progress</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start learning to see your progress here!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements">
                <Card>
                  <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Complete lessons to unlock achievements!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Your learning activity will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Courses Started</span><span className="font-bold">0</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lessons Completed</span><span className="font-bold">0</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Problems Solved</span><span className="font-bold">0</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mentor Sessions</span><span className="font-bold">0</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
              <CardContent>
                <Badge className="mb-2">Free Plan</Badge>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to Pro for advanced features</p>
                <Button className="w-full" variant="outline">Upgrade to Pro</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
