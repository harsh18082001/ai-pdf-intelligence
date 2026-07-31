import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGetDocumentsQuery } from '@/api/documentApi';
import { DocumentCard } from './DocumentCard';
import { FileText, SearchX, AlertTriangle } from 'lucide-react';
import { UploadModal } from './UploadModal';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { StatusFilter, SortOption } from './DocumentToolbar';

interface DocumentListProps {
  search: string;
  statusFilter: StatusFilter;
  sortBy: SortOption;
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

export function DocumentList({ search, statusFilter, sortBy }: DocumentListProps) {
  const { data: documents = [], isLoading, error } = useGetDocumentsQuery();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = documents.filter((doc) => {
      const matchesSearch = !term || doc.title.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortBy === 'oldest' ? -diff : diff;
    });
  }, [documents, search, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load documents"
        description="Please check your connection and try again."
        className="py-24 border border-dashed rounded-lg"
      />
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload your first PDF document to start chatting, generating summaries, and extracting insights."
        action={<UploadModal />}
        className="py-24 border-2 border-dashed rounded-lg bg-muted/20"
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No matching documents"
        description="Try a different search term or clear the status filter."
        className="py-24 border border-dashed rounded-lg"
      />
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      variants={gridVariants}
      initial="hidden"
      animate="show"
    >
      {filtered.map((doc) => (
        <motion.div key={doc.id} variants={cardVariants}>
          <DocumentCard document={doc} />
        </motion.div>
      ))}
    </motion.div>
  );
}
