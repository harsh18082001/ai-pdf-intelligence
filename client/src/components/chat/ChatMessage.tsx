import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage as IChatMessage } from '@/hooks/useChat';

interface ChatMessageProps {
  message: IChatMessage;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (message.role === 'system') {
    return null; // Don't render system messages
  }

  return (
    <div
      className={cn(
        'flex w-full px-4 py-6 gap-4',
        isUser ? 'bg-background' : 'bg-muted/30 border-l-2 border-primary',
      )}
    >
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0 flex items-center justify-center border',
          isUser
            ? 'bg-background border-primary/20 text-primary'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden min-w-0">
        <div className="font-semibold text-sm">{isUser ? 'You' : 'DocIQ AI'}</div>

        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:text-sm overflow-x-auto">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : message.isStreaming ? (
            <TypingIndicator />
          ) : null}

          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
