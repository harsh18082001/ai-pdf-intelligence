import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useGetDocumentQuery } from '@/api/documentApi';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentHeader } from '@/components/documents/DocumentHeader';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRecentDocuments } from '@/hooks/useRecentDocuments';

import { PDFViewer } from '@/components/documents/PDFViewer';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { recordVisit } = useRecentDocuments();

  const { data: document, isError } = useGetDocumentQuery(documentId, {
    skip: !documentId,
  });

  useEffect(() => {
    if (document?.title) {
      recordVisit(documentId, document.title);
    }
  }, [documentId, document?.title, recordVisit]);

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
