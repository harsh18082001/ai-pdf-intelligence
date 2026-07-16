import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetDocumentQuery, documentApi } from '@/api/documentApi';
import { MetadataPanel } from '@/components/documents/MetadataPanel';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { supabase } from '@/lib/supabase';

import { PDFViewer } from '@/components/documents/PDFViewer';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: document, isError } = useGetDocumentQuery(documentId, {
    skip: !documentId,
  });

  useEffect(() => {
    if (!documentId || !import.meta.env.VITE_SUPABASE_URL) return;

    const channel = supabase
      .channel(`document-${documentId}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${documentId}`
        },
        (payload) => {
          // Instantly update the RTK Query cache when the DB changes
          dispatch(
            documentApi.util.updateQueryData('getDocument', documentId, (draft) => {
              Object.assign(draft, payload.new);
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, dispatch]);

  if (!documentId || isError) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Document not found</h2>
        <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const isReady = document?.status === 'completed';

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
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

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-8 lg:pb-0">
        {/* Left Column: Metadata and Chat */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 h-[700px] lg:h-full lg:overflow-y-auto pr-0 lg:pr-2">
          <MetadataPanel documentId={documentId} />
          
          {/* Chat Interface */}
          <ChatInterface documentId={documentId} isReady={isReady} />
        </div>

        {/* Right Column: PDF Viewer */}
        <div className="w-full lg:w-2/3 h-[600px] lg:h-full">
          <PDFViewer documentId={documentId} />
        </div>
      </div>
    </div>
  );
}
