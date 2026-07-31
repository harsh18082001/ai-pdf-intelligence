import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type StatusFilter = 'all' | 'completed' | 'processing' | 'failed' | 'ocr_required' | 'pending';
export type SortOption = 'newest' | 'oldest' | 'name';

interface DocumentToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'ocr_required', label: 'Needs OCR' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
];

const selectClasses =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export function DocumentToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
}: DocumentToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search documents..."
          className="pl-9"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
        className={selectClasses}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortOption)}
        className={selectClasses}
        aria-label="Sort documents"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
