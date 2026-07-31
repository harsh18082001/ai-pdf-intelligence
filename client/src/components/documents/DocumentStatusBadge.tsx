import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getDocumentStatusConfig } from '@/lib/document-status';

interface DocumentStatusBadgeProps {
  status: string;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const { label, icon: Icon, tone, spin } = getDocumentStatusConfig(status);

  return (
    <Badge variant={tone} className={cn(className)}>
      <Icon className={cn('h-3 w-3', spin && 'animate-spin')} />
      {label}
    </Badge>
  );
}
