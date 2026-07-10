import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetDocumentQuery, useGetDocumentStatusQuery } from '@/api/documentApi';
import { MetadataPanel } from '@/components/documents/MetadataPanel';
import { Button } from '@/components/ui/button';

import { PDFViewer } from '@/components/documents/PDFViewer';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);
  const navigate = useNavigate();

  const { data: document, isError } = useGetDocumentQuery(documentId, {
    skip: !documentId,
  });

  const { data: statusData } = useGetDocumentStatusQuery(documentId, {
    skip: !documentId,
  });

  if (!documentId || isError) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Document not found</h2>
        <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const isReady = (statusData?.status || document?.status) === 'completed';

  return (
    <div className="container mx-auto p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold line-clamp-1 flex-1" title={document?.title}>
          {document?.title || 'Loading...'}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Column: Metadata and Chat (Chat is a placeholder for now) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full overflow-y-auto pr-2">
          <MetadataPanel documentId={documentId} />
          
          {/* Chat Interface */}
          <ChatInterface documentId={documentId} isReady={isReady} />
        </div>

        {/* Right Column: PDF Viewer */}
        <div className="w-full lg:w-2/3 h-full min-h-[500px]">
          <PDFViewer documentId={documentId} />
        </div>
      </div>
    </div>
  );
}
