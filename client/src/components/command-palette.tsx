import { useNavigate } from 'react-router-dom';
import { FileText, Home, Moon, Sun, Monitor, UploadCloud } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useGetDocumentsQuery } from '@/api/documentApi';
import { useTheme } from '@/components/theme-provider';
import { getDocumentStatusConfig } from '@/lib/document-status';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { data: documents = [] } = useGetDocumentsQuery();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a document or run an action"
    >
      <CommandInput placeholder="Search documents or run a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem value="Go to Home" onSelect={() => go('/')}>
            <Home /> Go to Home
          </CommandItem>
          <CommandItem value="Upload Document" onSelect={() => go('/?upload=1')}>
            <UploadCloud /> Upload Document
          </CommandItem>
          <CommandItem
            value="Light Theme"
            onSelect={() => {
              setTheme('light');
              onOpenChange(false);
            }}
          >
            <Sun /> Light Theme
          </CommandItem>
          <CommandItem
            value="Dark Theme"
            onSelect={() => {
              setTheme('dark');
              onOpenChange(false);
            }}
          >
            <Moon /> Dark Theme
          </CommandItem>
          <CommandItem
            value="System Theme"
            onSelect={() => {
              setTheme('system');
              onOpenChange(false);
            }}
          >
            <Monitor /> System Theme
          </CommandItem>
        </CommandGroup>
        {documents.length > 0 && (
          <CommandGroup heading="Documents">
            {documents.map((doc) => {
              const status = getDocumentStatusConfig(doc.status);
              return (
                <CommandItem
                  key={doc.id}
                  value={doc.title}
                  onSelect={() => go(`/documents/${doc.id}`)}
                >
                  <FileText />
                  <span className="truncate">{doc.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {status.label}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
