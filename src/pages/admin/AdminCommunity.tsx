import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Pin, CheckCircle, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Thread {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  is_pinned: boolean;
  is_resolved: boolean;
  upvotes: number;
  created_at: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  monthly_price: number;
  is_active: boolean;
  created_at: string;
  member_count?: number;
}

export default function AdminCommunity() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [threadsRes, groupsRes] = await Promise.all([
        supabase
          .from('discussion_threads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('study_groups').select('*').order('created_at', { ascending: false }),
      ]);

      if (threadsRes.error) throw threadsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setThreads(threadsRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function togglePin(thread: Thread) {
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ is_pinned: !thread.is_pinned })
        .eq('id', thread.id);

      if (error) throw error;
      toast({ title: 'Success', description: thread.is_pinned ? 'Thread unpinned' : 'Thread pinned' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function toggleResolved(thread: Thread) {
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ is_resolved: !thread.is_resolved })
        .eq('id', thread.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Thread status updated' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function toggleGroupActive(group: StudyGroup) {
    try {
      const { error } = await supabase
        .from('study_groups')
        .update({ is_active: !group.is_active })
        .eq('id', group.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Group status updated' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  return (
    <AdminLayout title="Community" description="Manage discussions and study groups">
      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No discussions yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upvotes</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threads.map((thread) => (
                      <TableRow key={thread.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {thread.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                            <span className="font-medium truncate max-w-[300px]">{thread.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          User
                        </TableCell>
                        <TableCell>
                          <Badge variant={thread.is_resolved ? 'default' : 'secondary'}>
                            {thread.is_resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </TableCell>
                        <TableCell>{thread.upvotes}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(thread.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePin(thread)}
                            title={thread.is_pinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className={`h-4 w-4 ${thread.is_pinned ? 'text-primary' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleResolved(thread)}
                            title={thread.is_resolved ? 'Mark as open' : 'Mark as resolved'}
                          >
                            <CheckCircle
                              className={`h-4 w-4 ${thread.is_resolved ? 'text-success' : ''}`}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : groups.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No study groups yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Max Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>₹{group.monthly_price}/mo</TableCell>
                        <TableCell>{group.max_members}</TableCell>
                        <TableCell>
                          <Badge variant={group.is_active ? 'default' : 'secondary'}>
                            {group.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(group.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupActive(group)}
                          >
                            {group.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
