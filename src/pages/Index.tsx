import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Trophy, Zap, Code, Server, Layers, Cpu, Network, Database, Brain, CheckCircle, Star, Calendar, Clock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';

const subjects = [
  { name: 'DSA', slug: 'dsa', icon: Code, color: 'bg-dsa/10 text-dsa border-dsa/20', description: 'Pattern-based problem solving' },
  { name: 'System Design', slug: 'system-design', icon: Server, color: 'bg-system-design/10 text-system-design border-system-design/20', description: 'Scalable distributed systems' },
  { name: 'LLD', slug: 'lld', icon: Layers, color: 'bg-lld/10 text-lld border-lld/20', description: 'SOLID & design patterns' },
  { name: 'OS', slug: 'os', icon: Cpu, color: 'bg-os/10 text-os border-os/20', description: 'Core operating systems' },
  { name: 'CN', slug: 'cn', icon: Network, color: 'bg-cn/10 text-cn border-cn/20', description: 'Networking fundamentals' },
  { name: 'DBMS', slug: 'dbms', icon: Database, color: 'bg-dbms/10 text-dbms border-dbms/20', description: 'Database management' },
  { name: 'AI/ML', slug: 'aiml', icon: Brain, color: 'bg-aiml/10 text-aiml border-aiml/20', description: 'Applied machine learning' },
];

const features = [
  { icon: BookOpen, title: '100% Free Courses', description: 'All learning content is completely free. No paywalls for education.' },
  { icon: Zap, title: 'Pattern-Based Learning', description: 'Master reusable patterns that apply across multiple problems.' },
  { icon: Users, title: 'Mentor Connect', description: 'Book 1-on-1 sessions with industry professionals.' },
  { icon: Trophy, title: 'Community & Leaderboards', description: 'Compete, collaborate, and grow with fellow learners.' },
];

const stats = [
  { value: '7+', label: 'Core Subjects' },
  { value: '500+', label: 'Video Lessons' },
  { value: '1000+', label: 'Practice Problems' },
  { value: '50+', label: 'Industry Mentors' },
];

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  is_premium: boolean;
}

export default function Index() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(4);
      
      setEvents(data || []);
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 pattern-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Star className="h-4 w-4" />
              <span>Free-to-Learn Platform</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Master Tech with{' '}
              <span className="gradient-text">Babua Premier League</span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Pattern-based learning for DSA, System Design, and core CS subjects. 
              100% free courses. Pay only for optional premium features.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="glow-primary" asChild>
                <Link to="/auth?tab=signup">
                  Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Master All Core Subjects</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Comprehensive curriculum covering everything you need for placements and beyond
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <Link key={subject.slug} to={`/courses/${subject.slug}`}>
                  <Card className={`h-full border transition-all hover:scale-[1.02] hover:shadow-lg ${subject.color}`}>
                    <CardContent className="p-6">
                      <Icon className="h-10 w-10 mb-4" />
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <p className="text-sm opacity-80 mt-1">{subject.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Why Babua Premier League?</h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Upcoming Events</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Join webinars, workshops, and live sessions with industry experts
            </p>
          </div>
          
          {loadingEvents ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events scheduled</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {events.map((event) => (
                <Card key={event.id} className="glass-card hover:scale-[1.02] transition-transform">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={event.event_type === 'webinar' ? 'default' : event.event_type === 'workshop' ? 'secondary' : 'outline'}>
                        {event.event_type}
                      </Badge>
                      {event.is_premium && (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.starts_at), 'MMM d')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(event.starts_at), 'h:mm a')}</span>
                      </div>
                    </div>
                    {event.max_attendees && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {event.max_attendees} spots available
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Student-Friendly Monetization</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We don't sell courses. All learning is free. Here's how we sustain the platform:
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: '1-on-1 Mentorship', desc: 'Book sessions with industry experts for interviews, career advice' },
              { title: 'Study Groups', desc: 'Join premium cohorts with accountability partners and weekly check-ins' },
              { title: 'Pro Features', desc: 'Advanced analytics, custom study plans, offline access' },
              { title: 'Community Perks', desc: 'Premium Discord, AMAs, early access, merchandise' },
            ].map((item) => (
              <Card key={item.title} className="glass-card">
                <CardContent className="p-6">
                  <CheckCircle className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Start Your Journey?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join thousands of students mastering tech skills with pattern-based learning
          </p>
          <Button size="lg" className="mt-8 glow-primary" asChild>
            <Link to="/auth?tab=signup">Get Started for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
