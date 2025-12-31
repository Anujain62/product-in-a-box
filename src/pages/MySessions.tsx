import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { Calendar, Clock, User, Video, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserSessions, useUpdateSessionStatus } from '@/hooks/useMentorBooking';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: X },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle },
};

export default function MySessions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useUserSessions();
  const updateStatus = useUpdateSessionStatus();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCancelSession = async (sessionId: string) => {
    try {
      await updateStatus.mutateAsync({ sessionId, status: 'cancelled' });
      toast.success('Session cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  const upcomingSessions = sessions?.filter(
    (s: any) => ['pending', 'confirmed'].includes(s.status) && isFuture(new Date(s.scheduled_at))
  ) || [];

  const todaySessions = sessions?.filter(
    (s: any) => ['pending', 'confirmed'].includes(s.status) && isToday(new Date(s.scheduled_at))
  ) || [];

  const pastSessions = sessions?.filter(
    (s: any) => s.status === 'completed' || s.status === 'cancelled' || isPast(new Date(s.scheduled_at))
  ) || [];

  const SessionCard = ({ session }: { session: any }) => {
    const scheduledDate = new Date(session.scheduled_at);
    const status = statusConfig[session.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const canCancel = ['pending', 'confirmed'].includes(session.status) && isFuture(scheduledDate);

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Date sidebar */}
            <div className="bg-primary/10 p-4 md:p-6 flex flex-row md:flex-col items-center justify-center gap-2 md:min-w-[100px]">
              <span className="text-3xl font-bold text-primary">{format(scheduledDate, 'd')}</span>
              <span className="text-sm text-muted-foreground uppercase">{format(scheduledDate, 'MMM')}</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {session.session_type?.name || 'Mentoring Session'}
                    </h3>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {session.mentor?.profile && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{session.mentor.profile.full_name}</span>
                      {session.mentor.title && (
                        <span className="text-sm">• {session.mentor.title}</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(scheduledDate, 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(scheduledDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span>{session.duration_minutes} min</span>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{session.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this session with {session.mentor?.profile?.full_name || 'your mentor'}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Session</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Yes, Cancel'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
    <div className="text-center py-12">
      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg mb-2">{message}</h3>
      {action}
    </div>
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Sessions</h1>
            <p className="text-muted-foreground mt-1">View and manage your mentoring sessions</p>
          </div>
          <Button asChild>
            <Link to="/mentors">Book New Session</Link>
          </Button>
        </div>

        {/* Today's Sessions Alert */}
        {todaySessions.length > 0 && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    You have {todaySessions.length} session{todaySessions.length > 1 ? 's' : ''} today!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Next session at {format(new Date(todaySessions[0].scheduled_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Clock className="h-4 w-4" />
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session: any) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <EmptyState 
                message="No upcoming sessions"
                action={
                  <Button asChild className="mt-4">
                    <Link to="/mentors">Book a Session</Link>
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pastSessions.length > 0 ? (
              <div className="space-y-4">
                {pastSessions.map((session: any) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <EmptyState message="No past sessions yet" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
