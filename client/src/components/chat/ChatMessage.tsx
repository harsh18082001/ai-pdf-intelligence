import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage as IChatMessage } from '@/hooks/useChat';

interface ChatMessageProps {
  message: IChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  if (message.role === 'system') {
    return null; // Don't render system messages
  }

  return (
    <div className={cn(
      "flex w-full px-4 py-6 gap-4",
      isUser ? "bg-background" : "bg-muted/30"
    )}>
      <Avatar className={cn(
        "h-8 w-8 shrink-0 flex items-center justify-center border",
        isUser ? "bg-background border-primary/20 text-primary" : "bg-primary text-primary-foreground"
      )}>
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </Avatar>
      
      <div className="flex-1 space-y-2 overflow-hidden min-w-0">
        <div className="font-semibold text-sm">
          {isUser ? 'You' : 'DocIQ AI'}
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:text-sm overflow-x-auto">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : message.isStreaming ? (
            <div className="flex items-center text-muted-foreground gap-2 text-sm mt-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          ) : null}
          
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
