import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  documentId: number;
  isReady: boolean;
}

export function ChatInterface({ documentId, isReady }: ChatInterfaceProps) {
  const { messages, isLoadingHistory, isStreaming, sendMessage } = useChat(documentId);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isReady) {
    return (
      <div className="flex-1 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat & Analysis
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground opacity-50" />
          </div>
          <h3 className="font-medium mb-1">Chat Disabled</h3>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Document processing is required before you can chat or generate insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex-1 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col transition-all duration-200",
        isMaximized 
          ? "fixed inset-4 z-50 shadow-2xl" 
          : "min-h-[400px] relative"
      )}
    >
      <div className="p-4 border-b font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat & Analysis
        </div>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5 bg-muted px-2 py-1 rounded-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI is thinking...
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth flex flex-col relative"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-60 p-6 text-center">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Start by asking a question about the document!</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {messages.map((msg, idx) => (
              <ChatMessage key={`${msg.id}-${idx}`} message={msg} />
            ))}
          </div>
        )}
      </div>

      <ChatInput 
        onSendMessage={sendMessage} 
        isStreaming={isStreaming} 
      />
    </div>
  );
}
