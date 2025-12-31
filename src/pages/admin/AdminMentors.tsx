import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Star, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateMentorDialog } from '@/components/admin/CreateMentorDialog';

interface Mentor {
  id: string;
  user_id: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_sessions: number;
  is_available: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMentors();
  }, []);

  async function fetchMentors() {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each mentor
      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const mentorsWithProfiles = data.map(mentor => ({
          ...mentor,
          profiles: profiles?.find(p => p.user_id === mentor.user_id) || null,
        }));
        setMentors(mentorsWithProfiles);
      } else {
        setMentors([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({ title: 'Error', description: 'Failed to fetch mentors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(mentor: Mentor) {
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ is_available: !mentor.is_available })
        .eq('id', mentor.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Availability updated' });
      fetchMentors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  return (
    <AdminLayout title="Mentors" description="Manage mentor profiles and availability">
      <div className="flex justify-end mb-6">
        <CreateMentorDialog onSuccess={fetchMentors} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : mentors.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No mentors registered yet.</p>
              <p className="text-sm text-muted-foreground">
                Click "Add Mentor" to create the first mentor profile.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentors.map((mentor) => (
                  <TableRow key={mentor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {mentor.profiles?.full_name || mentor.title || 'Mentor'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.title} {mentor.company && `at ${mentor.company}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise?.slice(0, 3).map((exp) => (
                          <Badge key={exp} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                        {mentor.expertise && mentor.expertise.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{mentor.expertise.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₹{mentor.hourly_rate || 0}/hr</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span>{mentor.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{mentor.total_sessions}</TableCell>
                    <TableCell>
                      <Switch
                        checked={mentor.is_available}
                        onCheckedChange={() => toggleAvailability(mentor)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
