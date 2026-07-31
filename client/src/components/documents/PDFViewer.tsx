import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Upload,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { loadPDF, savePDF } from '@/services/pdfStorage';
import { toast } from 'sonner';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  documentId: number;
}

export function PDFViewer({ documentId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>('1');
  const [isMaximized, setIsMaximized] = useState(false);
  const [pdfFile, setPdfFile] = useState<Blob | null>(null);
  const [loadingLocal, setLoadingLocal] = useState(true);

  useEffect(() => {
    const fetchLocalPDF = async () => {
      setLoadingLocal(true);
      const file = await loadPDF(documentId);
      setPdfFile(file);
      setLoadingLocal(false);
    };
    fetchLocalPDF();
  }, [documentId]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setPageInput('1');
  }

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1.0);
  const toggleMaximize = () => setIsMaximized(!isMaximized);

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      setPageInput(String(pageNumber - 1));
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
      setPageInput(String(pageNumber + 1));
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
        setPageNumber(parsed);
      } else {
        setPageInput(String(pageNumber)); // Revert if invalid
      }
    }
  };

  const handleAttachPDF = async () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await savePDF(documentId, file);
        setPdfFile(file);
        toast.success('PDF preview loaded for this browser');
      } catch {
        toast.error('Failed to save PDF locally');
      }
    };
    input.click();
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-card border rounded-lg overflow-hidden transition-all duration-200 ${
        isMaximized ? 'fixed inset-4 z-50 shadow-2xl' : 'shadow-sm relative'
      }`}
    >
      {/* Controls Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/40 shadow-xs">
        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || !pdfFile}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span
            className="text-xs w-12 text-center cursor-pointer hover:bg-muted/50 py-1 rounded"
            onClick={handleResetZoom}
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || !pdfFile}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMaximize}
            title={isMaximized ? 'Minimize View' : 'Maximize View'}
          >
            {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || !pdfFile}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1 text-sm">
            <Input
              type="text"
              className="w-12 h-7 text-center px-1"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              disabled={!pdfFile}
            />
            <span className="text-muted-foreground whitespace-nowrap">/ {numPages || '-'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || !pdfFile}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto bg-muted/20 relative flex justify-center p-4">
        {loadingLocal ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="animate-pulse">Loading local PDF...</span>
          </div>
        ) : !pdfFile ? (
          <EmptyState
            icon={FileText}
            title="PDF preview not stored on this device"
            description="AI analysis, chat, and summaries are fully active. To preview the document visual layout here, attach your local PDF file."
            action={
              <Button onClick={handleAttachPDF} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Attach PDF to View Preview
              </Button>
            }
            className="h-full max-w-sm mx-auto"
          />
        ) : (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <span className="animate-pulse">Rendering PDF...</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-destructive">
                Failed to render PDF.
              </div>
            }
            className="flex flex-col items-center shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
