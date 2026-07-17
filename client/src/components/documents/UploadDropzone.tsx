import { useState, useCallback } from 'react';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function UploadDropzone({ onFileSelect, isLoading }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        setSelectedFile(file);
      }
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  if (selectedFile) {
    return (
      <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-muted/30 w-full overflow-hidden">
        <div className="flex items-center gap-3 w-full bg-background p-4 rounded-md border overflow-hidden">
          <FileIcon className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClear} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleUpload} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Process Document'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-colors text-center cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
      )}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center gap-4 w-full cursor-pointer">
        <div className="p-4 rounded-full bg-primary/10">
          <UploadCloud className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground mt-1">PDF files only (max 50MB)</p>
        </div>
      </label>
    </div>
  );
}
