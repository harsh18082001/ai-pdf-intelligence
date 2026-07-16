import { FileText, Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { DocumentDTO } from '@/types';
import { useDeleteDocumentMutation } from '@/api/documentApi';
import { deletePDF } from '@/services/pdfStorage';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: DocumentDTO;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(document.id).unwrap();
        await deletePDF(document.id);
        toast.success('Document deleted');
      } catch (error: any) {
        toast.error(error?.data?.error || 'Failed to delete document');
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500/15 text-green-700 dark:text-green-400', icon: CheckCircle2, label: 'Ready' };
      case 'processing':
        return { color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: Loader2, label: 'Processing' };
      case 'failed':
        return { color: 'bg-destructive/15 text-destructive', icon: AlertCircle, label: 'Failed' };
      case 'ocr_required':
        return { color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400', icon: AlertCircle, label: 'Needs OCR' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pending' };
    }
  };

  const statusConfig = getStatusConfig(document.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Link to={`/documents/${document.id}`}>
      <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer border-muted-foreground/20 glass relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 relative z-10">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="outline" className={`ml-2 border-transparent ${statusConfig.color}`}>
            <StatusIcon className={`mr-1 h-3 w-3 ${statusConfig.icon === Loader2 ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-1">
          <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors" title={document.title}>
            {document.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Uploaded {new Date(document.createdAt).toLocaleDateString()}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-muted px-2 py-1 rounded-md">
              {(document.fileSize / 1024 / 1024).toFixed(1)} MB
            </span>
            {document.pageCount > 0 && (
              <span className="bg-muted px-2 py-1 rounded-md">
                {document.pageCount} Pages
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
