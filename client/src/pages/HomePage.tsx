import { DocumentList } from '@/components/documents/DocumentList';
import { UploadModal } from '@/components/documents/UploadModal';

export function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-gentle" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-gentle stagger-2" />
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center justify-center py-12 md:py-20 mb-8 glass rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0" />
          
          <div className="relative z-10 space-y-4 max-w-3xl px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
              Unlock Your Documents
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload your PDFs and let AI instantly analyze, summarize, and extract the most valuable insights for you.
            </p>
            <div className="animate-scale-in stagger-3">
              <UploadModal />
            </div>
          </div>
        </div>
        
        <div className="mb-6 flex items-center justify-between animate-slide-in-right stagger-1">
          <h2 className="text-2xl font-bold tracking-tight">Recent Documents</h2>
        </div>
        
        <DocumentList />
      </div>
    </div>
  );
}
