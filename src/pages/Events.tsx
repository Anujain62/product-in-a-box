import { useState, useEffect } from 'react';
import { Calendar, Clock, Crown, Users } from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  is_premium: boolean;
  created_at: string;
}

interface Registration {
  event_id: string;
}

export default function Events() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events with React Query
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
  });

  // Real-time subscription for events
  useRealtimeSubscription({
    table: 'events',
    queryKey: ['events'],
  });

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user?.id);
    
    setRegistrations(data || []);
  };

  const isRegistered = (eventId: string) => {
    return registrations.some(r => r.event_id === eventId);
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to register for events',
        variant: 'destructive',
      });
      return;
    }

    setRegistering(eventId);
    
    if (isRegistered(eventId)) {
      // Unregister
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to unregister from event',
          variant: 'destructive',
        });
      } else {
        setRegistrations(prev => prev.filter(r => r.event_id !== eventId));
        toast({
          title: 'Unregistered',
          description: 'You have been removed from this event',
        });
      }
    } else {
      // Register
      const { error } = await supabase
        .from('event_registrations')
        .insert({ event_id: eventId, user_id: user.id });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to register for event',
          variant: 'destructive',
        });
      } else {
        setRegistrations(prev => [...prev, { event_id: eventId }]);
        toast({
          title: 'Registered!',
          description: 'You have successfully registered for this event',
        });
      }
    }
    
    setRegistering(null);
  };

  const upcomingEvents = events.filter(e => !isPast(new Date(e.starts_at)));
  const pastEvents = events.filter(e => isPast(new Date(e.starts_at)));

  const EventCard = ({ event, isPastEvent = false }: { event: Event; isPastEvent?: boolean }) => {
    const startsAt = new Date(event.starts_at);
    const isStartingSoon = !isPastEvent && startsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

    return (
      <Card className={`transition-all hover:shadow-md ${isPastEvent ? 'opacity-70' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant={event.event_type === 'webinar' ? 'default' : event.event_type === 'workshop' ? 'secondary' : 'outline'}>
                  {event.event_type}
                </Badge>
                {event.is_premium && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {isPastEvent && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Completed
                  </Badge>
                )}
                {isStartingSoon && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                    Starts {formatDistanceToNow(startsAt, { addSuffix: true })}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-xl mb-2">{event.title}</h3>
              <p className="text-muted-foreground mb-4">{event.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(startsAt, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{format(startsAt, 'h:mm a')}</span>
                  {event.ends_at && (
                    <span>- {format(new Date(event.ends_at), 'h:mm a')}</span>
                  )}
                </div>
                {event.max_attendees && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.max_attendees} spots</span>
                  </div>
                )}
              </div>
            </div>
            
            {!isPastEvent && (
              <Button
                variant={isRegistered(event.id) ? 'secondary' : 'default'}
                onClick={() => handleRegister(event.id)}
                disabled={registering === event.id}
                className="shrink-0"
              >
                {registering === event.id ? (
                  'Loading...'
                ) : isRegistered(event.id) ? (
                  'Registered ✓'
                ) : (
                  'Register'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold md:text-5xl">Events</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join webinars, workshops, and live sessions to accelerate your learning
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                      <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No upcoming events</h3>
                <p>Check back soon for new events!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {pastEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No past events</h3>
                <p>Events you've attended will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} isPastEvent />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
