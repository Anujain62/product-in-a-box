import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      setMentors(data || []);
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
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : mentors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No mentors registered yet.</div>
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
                        <p className="font-medium">{mentor.title || 'Mentor'}</p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.company || 'Independent'}
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
