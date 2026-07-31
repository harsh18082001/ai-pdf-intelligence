import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetDocumentsQuery } from '@/api/documentApi';
import { DocumentList } from '@/components/documents/DocumentList';
import { UploadModal } from '@/components/documents/UploadModal';
import {
  DocumentToolbar,
  type StatusFilter,
  type SortOption,
} from '@/components/documents/DocumentToolbar';

const STAT_CHIPS = [
  { key: 'total', label: 'Documents', icon: FileText, tone: 'bg-primary/10 text-primary' },
  { key: 'ready', label: 'Ready', icon: CheckCircle2, tone: 'bg-success/10 text-success' },
  { key: 'processing', label: 'Processing', icon: Loader2, tone: 'bg-info/10 text-info' },
] as const;

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: documents = [] } = useGetDocumentsQuery();

  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest';

  function updateParam(key: string, value: string, defaultValue: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === defaultValue) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  const stats = useMemo(
    () => ({
      total: documents.length,
      ready: documents.filter((d) => d.status === 'completed').length,
      processing: documents.filter((d) => d.status === 'processing').length,
    }),
    [documents],
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 pb-8 border-b">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Unlock your documents
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a PDF and let AI summarize it, answer questions, and surface the insights that
            matter.
          </p>
        </div>
        <UploadModal />
      </div>

      {stats.total > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {STAT_CHIPS.filter((chip) => chip.key === 'total' || stats[chip.key] > 0).map((chip) => (
            <div
              key={chip.key}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', chip.tone)}>
                <chip.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-serif text-xl font-semibold leading-none">
                  {stats[chip.key]}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{chip.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold tracking-tight mb-4">Documents</h2>

      <DocumentToolbar
        search={search}
        onSearchChange={(v) => updateParam('q', v, '')}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => updateParam('status', v, 'all')}
        sortBy={sortBy}
        onSortByChange={(v) => updateParam('sort', v, 'newest')}
      />

      <DocumentList search={search} statusFilter={statusFilter} sortBy={sortBy} />
    </div>
  );
}
