import { Users, Crown, Calendar, Target, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const studyGroups = [
  { id: 1, name: 'DSA Grinders', subject: 'DSA', members: 18, maxMembers: 20, price: 99, leader: 'Rahul S.', goal: 'Solve 100 problems in 30 days', progress: 65 },
  { id: 2, name: 'System Design Masters', subject: 'System Design', members: 12, maxMembers: 15, price: 199, leader: 'Priya V.', goal: 'Design 10 systems together', progress: 40 },
  { id: 3, name: 'Placement Warriors', subject: 'All Subjects', members: 25, maxMembers: 30, price: 149, leader: 'Amit K.', goal: 'Get placed in top companies', progress: 80 },
  { id: 4, name: 'OS & CN Study Circle', subject: 'OS, CN', members: 10, maxMembers: 15, price: 79, leader: 'Sneha P.', goal: 'Complete OS & CN in 4 weeks', progress: 50 },
];

export default function StudyGroups() {
  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <Badge variant="outline" className="mb-4"><Users className="h-3 w-3 mr-1" /> Cohort Learning</Badge>
            <h1 className="text-4xl font-bold mb-2">Study Groups</h1>
            <p className="text-muted-foreground">Join accountability groups for structured learning with peers</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" /> Create Group</Button>
        </div>

        {/* Benefits */}
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

        {/* Groups */}
        <div className="grid gap-6 md:grid-cols-2">
          {studyGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>{group.goal}</CardDescription>
                  </div>
                  <Badge variant="secondary">{group.subject}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="h-6 w-6"><AvatarFallback className="text-xs bg-primary/10">{group.leader[0]}</AvatarFallback></Avatar>
                  <span className="text-sm text-muted-foreground">Led by {group.leader}</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Group Progress</span>
                    <span>{group.progress}%</span>
                  </div>
                  <Progress value={group.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.members}/{group.maxMembers}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">₹{group.price}<span className="text-muted-foreground font-normal">/mo</span></span>
                    <Button disabled={group.members >= group.maxMembers}>
                      {group.members >= group.maxMembers ? 'Full' : 'Join'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
