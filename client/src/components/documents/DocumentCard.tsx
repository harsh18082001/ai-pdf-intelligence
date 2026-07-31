import { useState } from 'react';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDocumentStatusConfig } from '@/lib/document-status';

const ICON_TONE_CLASSES: Record<string, string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { tone } = getDocumentStatusConfig(document.status);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument(document.id).unwrap();
      await deletePDF(document.id);
      toast.success('Document deleted');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to delete document');
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Link to={`/documents/${document.id}`}>
        <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-(--duration-standard) group flex flex-col cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-(--duration-standard) pointer-events-none" />
          <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 relative z-10">
            <div className={cn('p-2 rounded-md shrink-0', ICON_TONE_CLASSES[tone])}>
              <FileText className="h-6 w-6" />
            </div>
            <DocumentStatusBadge status={document.status} className="ml-2" />
          </CardHeader>
          <CardContent className="p-4 pt-2 flex-1">
            <h3
              className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors"
              title={document.title}
            >
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
                <span className="bg-muted px-2 py-1 rounded-md">{document.pageCount} Pages</span>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your document and remove
              the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
