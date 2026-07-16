import { useState } from 'react';
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

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

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
        <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 rounded-full px-6 py-5 text-sm font-semibold">
          Upload Document
        </Button>
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
