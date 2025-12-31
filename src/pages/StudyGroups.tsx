import { useNavigate } from 'react-router-dom';
import { Users, Crown, Calendar, Target } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudyGroups, useJoinStudyGroup } from '@/hooks/useStudyGroups';
import { CreateGroupDialog } from '@/components/study-groups/CreateGroupDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function StudyGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: groups, isLoading } = useStudyGroups();
  const joinGroup = useJoinStudyGroup();

  const handleJoin = async (groupId: string) => {
    if (!user) {
      toast({ title: 'Please login to join a group', variant: 'destructive' });
      return;
    }
    try {
      await joinGroup.mutateAsync(groupId);
      toast({ title: 'Successfully joined the group!' });
    } catch {
      toast({ title: 'Failed to join group', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <Badge variant="outline" className="mb-4"><Users className="h-3 w-3 mr-1" /> Cohort Learning</Badge>
            <h1 className="text-4xl font-bold mb-2">Study Groups</h1>
            <p className="text-muted-foreground">Join accountability groups for structured learning with peers</p>
          </div>
          <CreateGroupDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-12">
          {[
            { icon: Users, title: 'Peer Support', desc: 'Learn with like-minded people' },
            { icon: Calendar, title: 'Weekly Check-ins', desc: 'Stay accountable with regular meetups' },
            { icon: Target, title: 'Shared Goals', desc: 'Achieve targets together' },
            { icon: Crown, title: 'Expert Leaders', desc: 'Guided by experienced mentors' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/study-groups/${group.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                    {group.subject && <Badge variant="secondary">{group.subject.name}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {group.leader && (
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={group.leader.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10">{group.leader.full_name?.[0] || 'L'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">Led by {group.leader.full_name || 'Anonymous'}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.member_count}/{group.max_members}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">₹{group.monthly_price}<span className="text-muted-foreground font-normal">/mo</span></span>
                      <Button 
                        disabled={group.member_count >= group.max_members || group.is_member || joinGroup.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoin(group.id);
                        }}
                      >
                        {group.is_member ? 'Joined' : group.member_count >= group.max_members ? 'Full' : 'Join'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No study groups yet</h3>
            <p className="text-muted-foreground">Be the first to create a study group!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
