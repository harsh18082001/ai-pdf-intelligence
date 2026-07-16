import { useGetDocumentQuery } from '@/api/documentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Calendar, HardDrive, Hash, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { documentApi } from '@/api/documentApi';
import { useAppDispatch } from '@/store/hooks';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useExecuteCommandMutation } from '@/api/commandApi';

interface MetadataPanelProps {
  documentId: number;
}

export function MetadataPanel({ documentId }: MetadataPanelProps) {
  const { data: document, isLoading } = useGetDocumentQuery(documentId);
  const [executeCommand, { isLoading: isExecuting }] = useExecuteCommandMutation();
  const dispatch = useAppDispatch();
  
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

  const currentStatus = document?.status || 'pending';

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

  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;

  if (isLoading || !document) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-16 bg-muted/20" />
        <CardContent className="space-y-4 py-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Document Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Title</span>
          <span className="text-sm font-medium line-clamp-2" title={document.title}>{document.title}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date
            </span>
            <span className="text-sm">{new Date(document.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Size
            </span>
            <span className="text-sm">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
              <Hash className="h-3 w-3" /> Pages
            </span>
            <span className="text-sm">{document.pageCount || '-'}</span>
          </div>

          <div className="flex flex-col space-y-1 items-start">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</span>
            <Badge variant="outline" className={cn("border-transparent", statusConfig.color)}>
              <StatusIcon className={cn("mr-1 h-3 w-3", statusConfig.icon === Loader2 && "animate-spin")} />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {document.errorMsg && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{document.errorMsg}</span>
            </p>
          </div>
        )}

        {/* AI Commands Section */}
        {document.status === 'completed' && (
          <div className="mt-6 pt-4 border-t space-y-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-2">
              AI Actions
            </span>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal" 
                onClick={() => handleCommand('summary', 'Document Summary')}
                disabled={isExecuting}
              >
                {isExecuting && activeCommand === 'summary' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4 text-primary" />}
                Generate Summary
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleCommand('key_points', 'Key Points')}
                disabled={isExecuting}
              >
                {isExecuting && activeCommand === 'key_points' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hash className="mr-2 h-4 w-4 text-primary" />}
                Extract Key Points
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => handleCommand('insights', 'Insights & Analysis')}
                disabled={isExecuting}
              >
                {isExecuting && activeCommand === 'insights' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />}
                Generate Insights
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-2 prose prose-sm dark:prose-invert max-w-none">
            {commandResult ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {commandResult}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Generating...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
