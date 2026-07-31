import { CheckCircle2, Loader2, AlertCircle, Clock, type LucideIcon } from 'lucide-react';

export type StatusTone = 'success' | 'info' | 'danger' | 'warning' | 'neutral';

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  tone: StatusTone;
  spin?: boolean;
}

export function getDocumentStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'completed':
      return { label: 'Ready', icon: CheckCircle2, tone: 'success' };
    case 'processing':
      return { label: 'Processing', icon: Loader2, tone: 'info', spin: true };
    case 'failed':
      return { label: 'Failed', icon: AlertCircle, tone: 'danger' };
    case 'ocr_required':
      return { label: 'Needs OCR', icon: AlertCircle, tone: 'warning' };
    default:
      return { label: 'Pending', icon: Clock, tone: 'neutral' };
  }
}
