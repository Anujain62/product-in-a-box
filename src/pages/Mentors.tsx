import { useState } from 'react';
import { Search, Star, Clock, Calendar, Filter, MapPin, Briefcase } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sampleMentors = [
  { id: 1, name: 'Rahul Sharma', title: 'SDE-3 @ Google', company: 'Google', expertise: ['DSA', 'System Design'], rating: 4.9, sessions: 150, rate: 1499, avatar: '', bio: 'Ex-Microsoft, 8+ years experience' },
  { id: 2, name: 'Priya Verma', title: 'Senior Engineer @ Amazon', company: 'Amazon', expertise: ['System Design', 'LLD'], rating: 4.8, sessions: 120, rate: 1299, avatar: '', bio: 'Ex-Flipkart, specializes in HLD' },
  { id: 3, name: 'Amit Kumar', title: 'Staff Engineer @ Meta', company: 'Meta', expertise: ['DSA', 'OS', 'CN'], rating: 4.9, sessions: 200, rate: 1999, avatar: '', bio: '10+ years, multiple FAANG offers' },
  { id: 4, name: 'Sneha Patel', title: 'Tech Lead @ Microsoft', company: 'Microsoft', expertise: ['DBMS', 'System Design'], rating: 4.7, sessions: 85, rate: 999, avatar: '', bio: 'Database specialist, Azure expert' },
];

export default function Mentors() {
  const [search, setSearch] = useState('');

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

        {/* Search */}
        <div className="flex gap-4 mb-8 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, company, or expertise..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
        </div>

        {/* Mentors Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {sampleMentors.map((mentor) => (
            <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{mentor.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> {mentor.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="font-medium">{mentor.rating}</span>
                      <span className="text-muted-foreground">({mentor.sessions} sessions)</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">{mentor.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {mentor.expertise.map((exp) => (
                    <Badge key={exp} variant="secondary">{exp}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold">₹{mentor.rate}</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                  <Button><Calendar className="h-4 w-4 mr-2" /> Book Session</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
