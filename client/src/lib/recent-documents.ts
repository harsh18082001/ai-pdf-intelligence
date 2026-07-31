const STORAGE_KEY = 'dociq-recent-documents';
const MAX_RECENT = 5;

export interface RecentDocument {
  id: number;
  title: string;
  visitedAt: number;
}

export function getRecentDocuments(): RecentDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentDocument(id: number, title: string): RecentDocument[] {
  const existing = getRecentDocuments().filter((doc) => doc.id !== id);
  const next = [{ id, title, visitedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
