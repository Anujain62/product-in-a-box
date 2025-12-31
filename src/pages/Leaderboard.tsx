import { useState } from 'react';
import { Trophy, Medal, Flame, Target } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';

const getMedalColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-muted-foreground';
};

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');
  const { data: leaderboard, isLoading } = useLeaderboard(period);
  const { user } = useAuth();

  const currentUserRank = leaderboard?.find(entry => entry.user_id === user?.id);

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4"><Trophy className="h-3 w-3 mr-1" /> Rankings</Badge>
          <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
          <p className="text-muted-foreground">Compete with fellow learners and climb the ranks</p>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className={`w-10 text-center font-bold text-xl ${getMedalColor(currentUserRank.rank)}`}>
                  #{currentUserRank.rank}
                </span>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUserRank.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentUserRank.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">You</p>
                  <p className="text-sm text-muted-foreground">{currentUserRank.problems_solved} problems solved</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-warning" /> {currentUserRank.current_streak}
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {currentUserRank.total_xp.toLocaleString()} XP
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-12 max-w-3xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2" />
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
                    <Skeleton className="h-5 w-24 mx-auto" />
                    <Skeleton className="h-8 w-20 mx-auto mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Top 3 */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mb-12 max-w-3xl mx-auto">
            {leaderboard.slice(0, 3).map((entry, i) => {
              const order = i === 0 ? 'md:order-2' : i === 1 ? 'md:order-1' : 'md:order-3';
              const scale = i === 0 ? 'md:scale-110' : '';
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <Card 
                  key={entry.user_id} 
                  className={`${order} ${scale} transition-transform ${isCurrentUser ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`text-4xl mb-2 ${getMedalColor(entry.rank)}`}>
                      {entry.rank === 1 ? '👑' : <Medal className="h-8 w-8 mx-auto" />}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(entry.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{entry.full_name || 'Anonymous'}</h3>
                    <p className="text-2xl font-bold text-primary mt-2">{entry.total_xp.toLocaleString()} XP</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Flame className="h-4 w-4 text-warning" /> {entry.current_streak} day streak
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
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
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-8 h-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  return (
                    <div 
                      key={entry.user_id} 
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <span className={`w-8 text-center font-bold ${getMedalColor(entry.rank)}`}>
                        #{entry.rank}
                      </span>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(entry.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{entry.full_name || 'Anonymous'} {isCurrentUser && '(You)'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" /> {entry.problems_solved} problems solved
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Flame className="h-4 w-4 text-warning" /> {entry.current_streak}
                      </div>
                      <Badge variant="secondary">{entry.total_xp.toLocaleString()} XP</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rankings yet. Be the first to earn XP!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
