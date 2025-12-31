import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMentorById, useSessionTypes } from '@/hooks/useMentors';
import { useMentorAvailability, useBookSession } from '@/hooks/useMentorBooking';
import { BookingCalendar } from '@/components/mentors/BookingCalendar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function MentorDetail() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: mentor, isLoading: mentorLoading } = useMentorById(mentorId || '');
  const { data: sessionTypes, isLoading: typesLoading } = useSessionTypes();
  const { data: availability } = useMentorAvailability(mentorId || '');
  const bookSession = useBookSession();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedSessionType, setSelectedSessionType] = useState<string | undefined>();

  const handleBookSession = async () => {
    if (!user) {
      toast.error('Please sign in to book a session');
      navigate('/auth');
      return;
    }

    if (!selectedDate || !selectedTime || !selectedSessionType || !mentorId) {
      toast.error('Please select date, time, and session type');
      return;
    }

    const sessionType = sessionTypes?.find(t => t.id === selectedSessionType);
    if (!sessionType) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const price = mentor?.hourly_rate 
      ? Math.round((mentor.hourly_rate / 60) * sessionType.duration_minutes)
      : sessionType.base_price;

    bookSession.mutate({
      mentorId,
      sessionTypeId: selectedSessionType,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: sessionType.duration_minutes,
      price,
    }, {
      onSuccess: () => {
        toast.success('Session booked successfully!');
        setSelectedDate(undefined);
        setSelectedTime(undefined);
        setSelectedSessionType(undefined);
      },
    });
  };

  if (mentorLoading || typesLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!mentor) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Mentor not found</h1>
          <Button onClick={() => navigate('/mentors')}>Back to Mentors</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate('/mentors')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Mentors
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Mentor Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {mentor.profile?.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold">{mentor.profile?.full_name || 'Mentor'}</h1>
                  <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Briefcase className="h-4 w-4" /> {mentor.title} @ {mentor.company}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    <span className="font-semibold text-lg">{mentor.rating || 0}</span>
                    <span className="text-muted-foreground">({mentor.total_sessions} sessions)</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-muted-foreground">{mentor.bio}</p>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise?.map((exp) => (
                      <Badge key={exp} variant="secondary">{exp}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t text-center">
                  <span className="text-3xl font-bold">₹{mentor.hourly_rate || 0}</span>
                  <span className="text-muted-foreground">/hour</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Select Session Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sessionTypes?.map((type) => {
                    const price = mentor?.hourly_rate 
                      ? Math.round((mentor.hourly_rate / 60) * type.duration_minutes)
                      : type.base_price;
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedSessionType(type.id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedSessionType === type.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{type.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                          </div>
                          {selectedSessionType === type.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-sm text-muted-foreground">{type.duration_minutes} min</span>
                          <span className="font-semibold">₹{price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  availability={availability || []}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={setSelectedTime}
                />
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedSessionType && selectedDate && selectedTime && (
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session Type:</span>
                      <span className="font-medium">
                        {sessionTypes?.find(t => t.id === selectedSessionType)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {selectedDate.toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t mt-3">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        ₹{mentor?.hourly_rate 
                          ? Math.round((mentor.hourly_rate / 60) * (sessionTypes?.find(t => t.id === selectedSessionType)?.duration_minutes || 60))
                          : sessionTypes?.find(t => t.id === selectedSessionType)?.base_price}
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleBookSession}
                    disabled={bookSession.isPending}
                  >
                    {bookSession.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
