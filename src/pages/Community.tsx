import { useState } from 'react';
import { MessageSquare, ThumbsUp, MessageCircle, Search, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sampleThreads = [
  { id: 1, title: 'How to approach Two Pointers problems?', author: 'Rahul', subject: 'DSA', upvotes: 45, replies: 12, isResolved: true, createdAt: '2h ago' },
  { id: 2, title: 'System Design: When to use Redis vs Memcached?', author: 'Priya', subject: 'System Design', upvotes: 32, replies: 8, isResolved: false, createdAt: '5h ago' },
  { id: 3, title: 'Best resources for OS interview prep?', author: 'Amit', subject: 'OS', upvotes: 28, replies: 15, isResolved: true, createdAt: '1d ago' },
  { id: 4, title: 'Difference between TCP and UDP - explained simply', author: 'Sneha', subject: 'CN', upvotes: 56, replies: 6, isResolved: true, createdAt: '2d ago' },
];

export default function Community() {
  const [search, setSearch] = useState('');

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
            <p className="text-muted-foreground">Ask questions, share knowledge, and help others</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" /> New Thread</Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search discussions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <Tabs defaultValue="trending">
              <TabsList className="mb-6">
                <TabsTrigger value="trending"><TrendingUp className="h-4 w-4 mr-2" /> Trending</TabsTrigger>
                <TabsTrigger value="recent"><Clock className="h-4 w-4 mr-2" /> Recent</TabsTrigger>
                <TabsTrigger value="unanswered"><MessageSquare className="h-4 w-4 mr-2" /> Unanswered</TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="space-y-4">
                {sampleThreads.map((thread) => (
                  <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ThumbsUp className="h-4 w-4" /></Button>
                          <span className="font-semibold">{thread.upvotes}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold hover:text-primary">{thread.title}</h3>
                            {thread.isResolved && <CheckCircle className="h-4 w-4 text-success" />}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="secondary">{thread.subject}</Badge>
                            <span>by {thread.author}</span>
                            <span>{thread.createdAt}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {thread.replies}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="recent"><p className="text-muted-foreground text-center py-8">Recent threads will appear here</p></TabsContent>
              <TabsContent value="unanswered"><p className="text-muted-foreground text-center py-8">Unanswered threads will appear here</p></TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Contributors</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['Rahul S.', 'Priya V.', 'Amit K.'].map((name, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{name[0]}</AvatarFallback></Avatar>
                    <span className="text-sm">{name}</span>
                    <Badge variant="secondary" className="ml-auto">{100 - i * 20} pts</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
