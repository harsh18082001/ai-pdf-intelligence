import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from './UploadDropzone';
import { useUploadDocumentMutation } from '@/api/documentApi';
import { savePDF } from '@/services/pdfStorage';
import { toast } from 'sonner';

interface UploadModalProps {
  /** Custom trigger element (e.g. a sidebar button). Defaults to the standard CTA button. */
  trigger?: ReactNode;
  /** Opt in to auto-opening from a `?upload=1` URL param (used by the command palette). Only one instance per page should set this. */
  autoOpenFromUrl?: boolean;
}

export function UploadModal({ trigger, autoOpenFromUrl }: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!autoOpenFromUrl) return;
    if (searchParams.get('upload') === '1') {
      setOpen(true);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('upload');
          return next;
        },
        { replace: true },
      );
    }
  }, [autoOpenFromUrl, searchParams, setSearchParams]);

  const handleUpload = async (file: File) => {
    try {
      const doc = await uploadDocument(file).unwrap();
      await savePDF(doc.id, file);

      toast.success('Document uploaded successfully');
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to upload document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="lg"
            className="gap-2 shadow-sm hover:shadow-md transition-shadow duration-(--duration-standard)"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogDescription>
            Upload a PDF document to extract insights, chat, and summarize.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 w-full overflow-hidden">
          <UploadDropzone onFileSelect={handleUpload} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
