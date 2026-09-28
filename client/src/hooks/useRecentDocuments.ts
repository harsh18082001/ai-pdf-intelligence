import { useGetRecentDocumentsQuery } from '@/api/documentApi';

/** Recents are server-tracked (DB `lastAccessedAt`, scoped to the guest/user identity), so
 * they follow the same account across devices and survive a guest-to-account migration. */
export function useRecentDocuments() {
  const { data: recent = [] } = useGetRecentDocumentsQuery();
  return { recent };
}
