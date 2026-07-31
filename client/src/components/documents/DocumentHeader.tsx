import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  HardDrive,
  Hash,
  AlertCircle,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useGetDocumentQuery } from '@/api/documentApi';
import { useExecuteCommandMutation } from '@/api/commandApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AI_COMMANDS = [
  { command: 'summary', title: 'Document Summary', label: 'Generate Summary', icon: FileText },
  { command: 'key_points', title: 'Key Points', label: 'Extract Key Points', icon: Hash },
  {
    command: 'insights',
    title: 'Insights & Analysis',
    label: 'Generate Insights',
    icon: CheckCircle2,
  },
];

interface DocumentHeaderProps {
  documentId: number;
}

export function DocumentHeader({ documentId }: DocumentHeaderProps) {
  const { data: document, isLoading } = useGetDocumentQuery(documentId);
  const [executeCommand, { isLoading: isExecuting }] = useExecuteCommandMutation();
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [commandResult, setCommandResult] = useState('');

  const handleCommand = async (command: string, title: string) => {
    setActiveCommand(command);
    setDialogTitle(title);
    setCommandResult('');
    setIsDialogOpen(true);

    try {
      const result = await executeCommand({ documentId, command }).unwrap();
      setCommandResult(result.content);
      toast.success(`${title} generated successfully!`);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to execute command');
      setIsDialogOpen(false);
    } finally {
      setActiveCommand(null);
    }
  };

  if (isLoading || !document) {
    return (
      <div className="mb-4">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-9 w-72" />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate" title={document.title}>
          {document.title}
        </span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1
            className="font-serif text-2xl md:text-3xl font-semibold truncate"
            title={document.title}
          >
            {document.title}
          </h1>
          <DocumentStatusBadge status={document.status} className="shrink-0" />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {(document.fileSize / 1024 / 1024).toFixed(1)} MB
            </span>
            {document.pageCount > 0 && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {document.pageCount}p
                </span>
              </>
            )}
          </div>

          {document.status === 'completed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" disabled={isExecuting}>
                  {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {AI_COMMANDS.map(({ command, title, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={command}
                    onClick={() => handleCommand(command, title)}
                    disabled={isExecuting}
                  >
                    {isExecuting && activeCommand === command ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {document.errorMsg && (
        <div className="mt-3 flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{document.errorMsg}</span>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-2 prose prose-sm dark:prose-invert max-w-none">
            {commandResult ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{commandResult}</ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Generating...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
