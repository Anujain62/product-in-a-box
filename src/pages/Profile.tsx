import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Flame, Trophy, BookOpen, Settings, Camera, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile, useUserStats, useUserAchievements, useRecentActivity } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: achievements } = useUserAchievements();
  const { data: recentActivity } = useRecentActivity();
  const updateProfile = useUpdateProfile();
  
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      toast({ title: 'Profile updated successfully!' });
      setEditOpen(false);
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  };

  if (authLoading || !user) {
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
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(profile?.full_name || user.user_metadata?.full_name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center md:text-left flex-1">
                {profileLoading ? (
                  <>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold">{profile?.full_name || user.user_metadata?.full_name || 'User'}</h1>
                    <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                      <Mail className="h-4 w-4" /> {user.email}
                    </p>
                    {profile?.bio && (
                      <p className="text-muted-foreground mt-2">{profile.bio}</p>
                    )}
                  </>
                )}
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  <Badge variant="secondary">
                    <Flame className="h-3 w-3 mr-1 text-warning" /> 
                    {profile?.current_streak || 0} day streak
                  </Badge>
                  <Badge variant="secondary">
                    <Trophy className="h-3 w-3 mr-1 text-primary" /> 
                    {profile?.total_xp?.toLocaleString() || 0} XP
                  </Badge>
                </div>
              </div>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleUpdateProfile} 
                      className="w-full"
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                    {recentActivity && recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.map((activity: any) => (
                          <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CheckCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.lessons?.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.lessons?.courses?.subjects?.name} • {activity.lessons?.courses?.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start learning to see your progress here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements">
                <Card>
                  <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
                  <CardContent>
                    {achievements && achievements.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {achievements.map((ua: any) => (
                          <div key={ua.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                            <span className="text-4xl">{ua.achievements?.icon || '🏆'}</span>
                            <div>
                              <p className="font-semibold">{ua.achievements?.name}</p>
                              <p className="text-sm text-muted-foreground">{ua.achievements?.description}</p>
                              <Badge variant="secondary" className="mt-2">+{ua.achievements?.xp_reward} XP</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Complete lessons to unlock achievements!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                  <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((activity: any) => (
                          <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Completed: {activity.lessons?.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(activity.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your learning activity will appear here</p>
                      </div>
                    )}
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
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courses Started</span>
                      <span className="font-bold">{stats?.coursesStarted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons Completed</span>
                      <span className="font-bold">{stats?.lessonsCompleted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Problems Solved</span>
                      <span className="font-bold">{stats?.problemsSolved || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mentor Sessions</span>
                      <span className="font-bold">{stats?.mentorSessions || 0}</span>
                    </div>
                  </>
                )}
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
