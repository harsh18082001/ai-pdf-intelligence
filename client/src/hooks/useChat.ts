import { useState, useCallback } from 'react';
import { useGetChatHistoryQuery } from '@/api/chatApi';
import { useAppDispatch } from '@/store/hooks';
import { chatApi } from '@/api/chatApi';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export function useChat(documentId: number) {
  const { data: history = [], isLoading: isLoadingHistory } = useGetChatHistoryQuery(documentId, {
    skip: !documentId,
  });
  
  const dispatch = useAppDispatch();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Combine DB history with any temporary streamed messages
  const allMessages = [...history, ...messages];

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsgId = Date.now();
      const assistantMsgId = userMsgId + 1;

      // Add user message optimistically
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content },
        { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
      ]);
      
      setIsStreaming(true);

      const encodedMessage = encodeURIComponent(content);
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const eventSource = new EventSource(`${baseUrl}/documents/${documentId}/chat/stream?message=${encodedMessage}`);

      eventSource.onmessage = (event) => {
        const data = event.data;

        if (data === '[DONE]') {
          eventSource.close();
          setIsStreaming(false);
          // Refresh the history from the server to get the persisted messages
          dispatch(chatApi.util.invalidateTags([{ type: 'Message', id: documentId }]));
          setMessages([]); // Clear temporary messages
          return;
        }

        try {
          const chunk = JSON.parse(data);
          
          if (chunk.error) {
            toast.error(chunk.error);
            eventSource.close();
            setIsStreaming(false);
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
            return;
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        } catch (e) {
          console.error('Error parsing chunk', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        toast.error('Connection lost while streaming the response.');
        eventSource.close();
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      };
    },
    [documentId, isStreaming, dispatch]
  );

  return {
    messages: allMessages,
    isLoadingHistory,
    isStreaming,
    sendMessage,
  };
}
