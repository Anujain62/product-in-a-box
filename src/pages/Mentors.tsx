import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Calendar, Briefcase, Circle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMentors } from '@/hooks/useMentors';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export default function Mentors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('all');
  const { data: mentors, isLoading } = useMentors(search);

  // Real-time subscription for mentors
  useRealtimeSubscription({
    table: 'mentors',
    queryKey: ['mentors'],
  });

  // Get all unique expertise tags
  const allExpertise = Array.from(
    new Set(mentors?.flatMap((m) => m.expertise || []) || [])
  ).sort();

  // Filter by expertise
  const filteredMentors = mentors?.filter((mentor) => {
    if (expertiseFilter === 'all') return true;
    return mentor.expertise?.includes(expertiseFilter);
  });

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">1-on-1 Mentorship</Badge>
          <h1 className="text-4xl font-bold mb-4">Connect with Industry Experts</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Book personalized sessions for mock interviews, resume reviews, and career guidance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, company, or expertise..." 
              className="pl-10" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Expertise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expertise</SelectItem>
              {allExpertise.map((exp) => (
                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMentors && filteredMentors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredMentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {mentor.profile?.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Availability indicator */}
                      <Circle 
                        className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 ${
                          mentor.is_available 
                            ? 'text-green-500 fill-green-500' 
                            : 'text-muted-foreground fill-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{mentor.profile?.full_name || 'Mentor'}</h3>
                        {mentor.is_available && (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">
                            Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {mentor.title} @ {mentor.company}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-medium">{mentor.rating || 0}</span>
                        <span className="text-muted-foreground">({mentor.total_sessions} sessions)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.expertise?.slice(0, 4).map((exp) => (
                      <Badge key={exp} variant="secondary">{exp}</Badge>
                    ))}
                    {mentor.expertise && mentor.expertise.length > 4 && (
                      <Badge variant="outline">+{mentor.expertise.length - 4}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div>
                      <span className="text-2xl font-bold">₹{mentor.hourly_rate || 0}</span>
                      <span className="text-muted-foreground">/session</span>
                    </div>
                    <Button 
                      onClick={() => navigate(`/mentors/${mentor.id}`)}
                      disabled={!mentor.is_available}
                    >
                      <Calendar className="h-4 w-4 mr-2" /> 
                      {mentor.is_available ? 'Book Session' : 'Unavailable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No mentors found</h3>
            <p className="text-muted-foreground">
              {search || expertiseFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Check back soon for expert mentors!'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
