import { useCallback, useEffect, useState } from 'react';
import { getRecentDocuments, pushRecentDocument, type RecentDocument } from '@/lib/recent-documents';

export function useRecentDocuments() {
  const [recent, setRecent] = useState<RecentDocument[]>(() => getRecentDocuments());

  useEffect(() => {
    const handler = () => setRecent(getRecentDocuments());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const recordVisit = useCallback((id: number, title: string) => {
    setRecent(pushRecentDocument(id, title));
  }, []);

  return { recent, recordVisit };
}
