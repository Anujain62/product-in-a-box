import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Crown, Calendar, Settings } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useStudyGroupDetail, useStudyGroupMembers, useCheckMembership } from '@/hooks/useStudyGroupDetail';
import { useJoinStudyGroup, useLeaveStudyGroup } from '@/hooks/useStudyGroups';
import { GroupChat } from '@/components/study-groups/GroupChat';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function StudyGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: group, isLoading: groupLoading } = useStudyGroupDetail(groupId!);
  const { data: members, isLoading: membersLoading } = useStudyGroupMembers(groupId!);
  const { data: membership } = useCheckMembership(groupId!);
  const joinMutation = useJoinStudyGroup();
  const leaveMutation = useLeaveStudyGroup();

  const isMember = !!membership;
  const isLeader = membership?.role === 'leader';
  const isCreator = user?.id === group?.created_by;

  const handleJoin = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await joinMutation.mutateAsync(groupId!);
      toast({ title: 'Successfully joined the group!' });
    } catch {
      toast({ title: 'Failed to join group', variant: 'destructive' });
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync(groupId!);
      toast({ title: 'Left the group' });
      navigate('/study-groups');
    } catch {
      toast({ title: 'Failed to leave group', variant: 'destructive' });
    }
  };

  if (groupLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Group not found</h1>
          <Button onClick={() => navigate('/study-groups')}>Back to Study Groups</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <Button variant="ghost" onClick={() => navigate('/study-groups')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Study Groups
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {group.subject && <Badge variant="secondary">{group.subject.name}</Badge>}
            </div>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isMember && (
              <Button 
                onClick={handleJoin}
                disabled={joinMutation.isPending || (members?.length || 0) >= group.max_members}
              >
                {joinMutation.isPending ? 'Joining...' : `Join - ₹${group.monthly_price}/mo`}
              </Button>
            )}
            {isMember && !isCreator && (
              <Button 
                variant="outline" 
                onClick={handleLeave}
                disabled={leaveMutation.isPending}
              >
                Leave Group
              </Button>
            )}
            {isCreator && (
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Chat */}
          <div className="lg:col-span-3">
            {isMember ? (
              <GroupChat groupId={groupId!} />
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Join to Access Chat</h3>
                  <p className="text-muted-foreground mb-4">Become a member to chat with the group</p>
                  <Button onClick={handleJoin} disabled={joinMutation.isPending}>
                    Join Group
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Members */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members?.length || 0}/{group.max_members})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {membersLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                ) : members && members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {member.profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {member.profile?.full_name || 'Anonymous'}
                          </span>
                          {member.role === 'leader' && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Group Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Fee</span>
                  <span className="font-semibold">₹{group.monthly_price}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span>{members?.length || 0} / {group.max_members}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
