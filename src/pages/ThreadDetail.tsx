import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useThread, useThreadReplies, useUpvoteThread, useMarkBestAnswer } from '@/hooks/useThreadDetail';
import { ReplyList } from '@/components/community/ReplyList';
import { ReplyForm } from '@/components/community/ReplyForm';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export default function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: thread, isLoading: threadLoading } = useThread(threadId!);
  const { data: replies, isLoading: repliesLoading } = useThreadReplies(threadId!);
  const upvoteMutation = useUpvoteThread();
  const markBestMutation = useMarkBestAnswer();

  const handleUpvote = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    upvoteMutation.mutate(threadId!);
  };

  const isAuthor = user?.id === thread?.author_id;

  if (threadLoading) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
          <Button onClick={() => navigate('/community')}>Back to Community</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/community')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Community
        </Button>

        {/* Thread */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-10 w-10 p-0 ${thread.user_has_upvoted ? 'text-primary' : ''}`}
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                >
                  <ThumbsUp className={`h-5 w-5 ${thread.user_has_upvoted ? 'fill-current' : ''}`} />
                </Button>
                <span className="font-bold text-lg">{thread.upvotes}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-2xl font-bold">{thread.title}</h1>
                  {thread.is_resolved && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={thread.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {thread.author?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{thread.author?.full_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </div>
                  {thread.subject && (
                    <Badge variant="secondary">{thread.subject.name}</Badge>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{thread.content}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {replies?.length || 0} Replies
            </h2>
          </div>

          <Separator />

          {repliesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <ReplyList 
              replies={replies || []} 
              threadAuthorId={thread.author_id}
              isThreadAuthor={isAuthor}
              onMarkBestAnswer={(replyId) => markBestMutation.mutate({ threadId: threadId!, replyId })}
            />
          )}

          <Separator />

          <ReplyForm threadId={threadId!} />
        </div>
      </div>
    </Layout>
  );
}
