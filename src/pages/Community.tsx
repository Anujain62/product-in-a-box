import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ThumbsUp, MessageCircle, Search, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscussionThreads, useTopContributors } from '@/hooks/useCommunity';
import { CreateThreadDialog } from '@/components/community/CreateThreadDialog';
import { formatDistanceToNow } from 'date-fns';

export default function Community() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'trending' | 'recent' | 'unanswered'>('trending');
  const { data: threads, isLoading } = useDiscussionThreads(filter);
  const { data: topContributors } = useTopContributors();

  const filteredThreads = threads?.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
            <p className="text-muted-foreground">Ask questions, share knowledge, and help others</p>
          </div>
          <CreateThreadDialog />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search discussions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="mb-6">
                <TabsTrigger value="trending"><TrendingUp className="h-4 w-4 mr-2" /> Trending</TabsTrigger>
                <TabsTrigger value="recent"><Clock className="h-4 w-4 mr-2" /> Recent</TabsTrigger>
                <TabsTrigger value="unanswered"><MessageSquare className="h-4 w-4 mr-2" /> Unanswered</TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="space-y-4">
                {isLoading ? (
                  [1,2,3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
                ) : filteredThreads && filteredThreads.length > 0 ? (
                  filteredThreads.map((thread) => (
                    <Card 
                      key={thread.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/community/${thread.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                            <div className="h-8 w-8 flex items-center justify-center">
                              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="font-semibold">{thread.upvotes}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold hover:text-primary">{thread.title}</h3>
                              {thread.is_resolved && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {thread.subject && <Badge variant="secondary">{thread.subject.name}</Badge>}
                              <span>by {thread.author?.full_name || 'Anonymous'}</span>
                              <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {thread.reply_count}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No threads yet. Be the first to start a discussion!</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Contributors</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topContributors && topContributors.length > 0 ? topContributors.map((c: any) => (
                  <div key={c.user_id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{c.full_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{c.full_name}</span>
                    <Badge variant="secondary" className="ml-auto">{c.points} pts</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No contributors yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
