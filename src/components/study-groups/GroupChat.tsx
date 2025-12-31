import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudyGroupMessages, useSendGroupMessage, StudyGroupMessage } from '@/hooks/useStudyGroupDetail';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface GroupChatProps {
  groupId: string;
}

export function GroupChat({ groupId }: GroupChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = useStudyGroupMessages(groupId);
  const sendMutation = useSendGroupMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMutation.mutate(
      { groupId, content: message.trim() },
      {
        onSuccess: () => setMessage(''),
      }
    );
  };

  const groupMessagesByDate = (msgs: StudyGroupMessage[]) => {
    const groups: { [key: string]: StudyGroupMessage[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-lg">Group Chat</CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupMessagesByDate(messages)).map(([date, dayMessages]) => (
              <div key={date}>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="space-y-4">
                  {dayMessages.map((msg) => {
                    const isOwnMessage = msg.user_id === user?.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {msg.profile?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-medium">
                              {isOwnMessage ? 'You' : msg.profile?.full_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                          <div 
                            className={`rounded-lg px-3 py-2 inline-block ${
                              isOwnMessage 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </ScrollArea>

      <CardContent className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
