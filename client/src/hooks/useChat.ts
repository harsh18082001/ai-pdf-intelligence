import { useState, useCallback, useEffect, useRef } from 'react';
import { useGetChatHistoryQuery } from '@/api/chatApi';
import { useAppDispatch } from '@/store/hooks';
import { chatApi } from '@/api/chatApi';
import { getAccessToken } from '@/lib/token-store';
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
  const abortRef = useRef<AbortController | null>(null);

  // Combine DB history with any temporary streamed messages
  const allMessages = [...history, ...messages];

  // When the server history updates, clear the temporary messages to prevent flickering
  useEffect(() => {
    setMessages([]);
  }, [history]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsgId = Date.now();
      const assistantMsgId = userMsgId + 1;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content },
        { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
      ]);
      setIsStreaming(true);

      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const encodedMessage = encodeURIComponent(content);
      const controller = new AbortController();
      abortRef.current = controller;

      const finishStream = () => {
        setIsStreaming(false);
        // Refresh the history from the server; the useEffect above clears temp messages.
        dispatch(chatApi.util.invalidateTags([{ type: 'Message', id: documentId }]));
      };

      try {
        const accessToken = getAccessToken();
        const response = await fetch(
          `${baseUrl}/documents/${documentId}/chat/stream?message=${encodedMessage}`,
          {
            credentials: 'include',
            signal: controller.signal,
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          },
        );

        if (!response.ok || !response.body) {
          throw new Error(`Stream request failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice('data:'.length).trim();

            if (data === '[DONE]') {
              finishStream();
              return;
            }

            try {
              const chunk = JSON.parse(data);
              if (chunk && typeof chunk === 'object' && chunk.error) {
                toast.error(chunk.error);
                setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
                setIsStreaming(false);
                return;
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg,
                ),
              );
            } catch (e) {
              console.error('Error parsing chunk', e);
            }
          }
        }

        finishStream();
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Chat stream failed:', error);
        toast.error('Connection lost while streaming the response.');
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg)),
        );
      }
    },
    [documentId, isStreaming, dispatch],
  );

  return {
    messages: allMessages,
    isLoadingHistory,
    isStreaming,
    sendMessage,
  };
}
