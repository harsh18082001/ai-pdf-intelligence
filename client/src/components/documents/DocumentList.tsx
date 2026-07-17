import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useGetDocumentsQuery, documentApi } from '@/api/documentApi';
import { supabase } from '@/lib/supabase';
import { DocumentCard } from './DocumentCard';
import { FileText, Loader2 } from 'lucide-react';
import { UploadModal } from './UploadModal';

export function DocumentList() {
  const dispatch = useAppDispatch();
  const { data: documents = [], isLoading, error } = useGetDocumentsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return;
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          // Manually update the RTK Query cache when the DB changes
          dispatch(
            documentApi.util.updateQueryData('getDocuments', undefined, (draft) => {
              const docIndex = draft.findIndex((d) => d.id === payload.new.id);
              if (docIndex !== -1) {
                draft[docIndex] = { ...draft[docIndex], ...payload.new };
              }
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-destructive text-center">
        <p className="mb-2 font-medium">Failed to load documents</p>
        <p className="text-sm opacity-80">Please check your connection and try again.</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Upload your first PDF document to start chatting, generating summaries, and extracting insights.
        </p>
        <UploadModal />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
