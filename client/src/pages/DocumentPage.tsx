import { useParams, useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useGetDocumentQuery } from '@/api/documentApi';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentHeader } from '@/components/documents/DocumentHeader';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useDocumentHead } from '@/hooks/useDocumentHead';

import { PDFViewer } from '@/components/documents/PDFViewer';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Fetching the document also marks it as recently accessed server-side (`lastAccessedAt`),
  // so there's no separate client-side "record a visit" call needed anymore.
  const { data: document, isError } = useGetDocumentQuery(documentId, {
    skip: !documentId,
  });

  // Document content is private per-account/guest — never index it.
  useDocumentHead({
    title: document?.title ? `${document.title} — DocIQ` : 'DocIQ',
    robots: 'noindex, nofollow',
  });

  if (!documentId || isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 md:p-8">
        <EmptyState
          icon={FileQuestion}
          title="Document not found"
          description="The document you're looking for doesn't exist or was deleted."
          action={<Button onClick={() => navigate('/')}>Return Home</Button>}
        />
      </div>
    );
  }

  const isReady = document?.status === 'completed';

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <DocumentHeader documentId={documentId} />

      {isDesktop ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={42} minSize={28} maxSize={55}>
            <div className="flex h-full flex-col">
              <ChatInterface documentId={documentId} isReady={isReady} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="mx-2" />
          <ResizablePanel defaultSize={58} minSize={40}>
            <div className="h-full">
              <PDFViewer documentId={documentId} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col gap-6 pb-8">
          <ChatInterface documentId={documentId} isReady={isReady} />
          <div className="h-[600px]">
            <PDFViewer documentId={documentId} />
          </div>
        </div>
      )}
    </div>
  );
}
