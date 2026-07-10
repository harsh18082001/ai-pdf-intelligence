import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  return (
    <div 
      className={`flex flex-col h-full w-full bg-card border rounded-lg overflow-hidden transition-all duration-200 ${
        isMaximized ? 'fixed inset-4 z-50 shadow-2xl' : 'shadow-sm relative'
      }`}
    >
      {/* Controls Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/40">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center cursor-pointer hover:bg-muted/50 py-1 rounded" onClick={handleResetZoom} title="Reset Zoom">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 3.0} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={toggleMaximize} title={isMaximized ? "Minimize View" : "Maximize View"}>
            {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1 text-sm">
            <Input
              type="text"
              className="w-12 h-8 text-center px-1"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
            />
            <span className="text-muted-foreground whitespace-nowrap">/ {numPages || '-'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto bg-muted/20 relative flex justify-center p-4">
        <Document
          file={`/api/documents/${documentId}/download`}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <span className="animate-pulse">Loading PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              Failed to load PDF.
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
      </div>
    </div>
  );
}
