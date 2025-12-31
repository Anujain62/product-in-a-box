import { ThumbsUp, CheckCircle, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply, useUpvoteReply } from '@/hooks/useThreadDetail';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';

interface ReplyListProps {
  replies: Reply[];
  threadAuthorId: string;
  isThreadAuthor: boolean;
  onMarkBestAnswer: (replyId: string) => void;
}

export function ReplyList({ replies, threadAuthorId, isThreadAuthor, onMarkBestAnswer }: ReplyListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const upvoteMutation = useUpvoteReply();

  const handleUpvote = (replyId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    upvoteMutation.mutate({ replyId, threadId: threadId! });
  };

  if (replies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No replies yet. Be the first to respond!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <Card 
          key={reply.id} 
          className={`${reply.is_best_answer ? 'border-green-500 bg-green-500/5' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[50px]">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 ${reply.user_has_upvoted ? 'text-primary' : ''}`}
                  onClick={() => handleUpvote(reply.id)}
                  disabled={upvoteMutation.isPending}
                >
                  <ThumbsUp className={`h-4 w-4 ${reply.user_has_upvoted ? 'fill-current' : ''}`} />
                </Button>
                <span className="font-semibold">{reply.upvotes}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {reply.author?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{reply.author?.full_name || 'Anonymous'}</span>
                    {reply.author_id === threadAuthorId && (
                      <Badge variant="outline" className="text-xs">OP</Badge>
                    )}
                    {reply.is_best_answer && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" /> Best Answer
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{reply.content}</p>
                </div>

                {isThreadAuthor && !reply.is_best_answer && (
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onMarkBestAnswer(reply.id)}
                    >
                      <Award className="h-4 w-4 mr-2" /> Mark as Best Answer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
