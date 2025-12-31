import { Trophy, Medal, Flame, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const leaderboardData = [
  { rank: 1, name: 'Rahul Sharma', xp: 12500, streak: 45, problems: 320 },
  { rank: 2, name: 'Priya Verma', xp: 11200, streak: 38, problems: 290 },
  { rank: 3, name: 'Amit Kumar', xp: 10800, streak: 52, problems: 275 },
  { rank: 4, name: 'Sneha Patel', xp: 9500, streak: 28, problems: 240 },
  { rank: 5, name: 'Vikram Singh', xp: 8900, streak: 33, problems: 220 },
  { rank: 6, name: 'Anita Desai', xp: 8200, streak: 21, problems: 195 },
  { rank: 7, name: 'Karan Mehta', xp: 7800, streak: 19, problems: 180 },
  { rank: 8, name: 'Neha Gupta', xp: 7200, streak: 25, problems: 165 },
];

const getMedalColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-muted-foreground';
};

export default function Leaderboard() {
  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4"><Trophy className="h-3 w-3 mr-1" /> Rankings</Badge>
          <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
          <p className="text-muted-foreground">Compete with fellow learners and climb the ranks</p>
        </div>

        {/* Top 3 */}
        <div className="grid gap-4 md:grid-cols-3 mb-12 max-w-3xl mx-auto">
          {leaderboardData.slice(0, 3).map((user, i) => {
            const order = i === 0 ? 'md:order-2' : i === 1 ? 'md:order-1' : 'md:order-3';
            const scale = i === 0 ? 'md:scale-110' : '';
            return (
              <Card key={user.rank} className={`${order} ${scale} transition-transform`}>
                <CardContent className="p-6 text-center">
                  <div className={`text-4xl mb-2 ${getMedalColor(user.rank)}`}>
                    {user.rank === 1 ? '👑' : <Medal className="h-8 w-8 mx-auto" />}
                  </div>
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">{user.xp.toLocaleString()} XP</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-warning" /> {user.streak} day streak
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <Tabs defaultValue="weekly">
              <div className="flex items-center justify-between">
                <CardTitle>Rankings</CardTitle>
                <TabsList>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="alltime">All Time</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboardData.map((user) => (
                <div key={user.rank} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <span className={`w-8 text-center font-bold ${getMedalColor(user.rank)}`}>#{user.rank}</span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.problems} problems solved</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm"><Flame className="h-4 w-4 text-warning" /> {user.streak}</div>
                  <Badge variant="secondary">{user.xp.toLocaleString()} XP</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
