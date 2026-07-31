import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  UploadCloud,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { useGetDocumentsQuery } from '@/api/documentApi';
import { useRecentDocuments } from '@/hooks/useRecentDocuments';
import { useTheme } from '@/components/theme-provider';
import { UploadModal } from '@/components/documents/UploadModal';
import { CommandPalette } from '@/components/command-palette';
import { MobileSidebarSheet } from './MobileSidebarSheet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { StatusFilter } from '@/components/documents/DocumentToolbar';

const SIDEBAR_COLLAPSED_KEY = 'dociq-sidebar-collapsed';

const STATUS_NAV: { status: StatusFilter; label: string; icon: LucideIcon; tone: string }[] = [
  { status: 'completed', label: 'Ready', icon: CheckCircle2, tone: 'text-success' },
  { status: 'processing', label: 'Processing', icon: Loader2, tone: 'text-info' },
  { status: 'ocr_required', label: 'Needs OCR', icon: AlertCircle, tone: 'text-warning' },
  { status: 'failed', label: 'Failed', icon: AlertCircle, tone: 'text-destructive' },
  { status: 'pending', label: 'Pending', icon: Clock, tone: 'text-muted-foreground' },
];

function bucketOf(status: string): StatusFilter {
  if (
    status === 'completed' ||
    status === 'processing' ||
    status === 'failed' ||
    status === 'ocr_required'
  ) {
    return status;
  }
  return 'pending';
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

function MaybeTooltip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: ReactNode;
}) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Fades/collapses a label's width as the sidebar toggles, instead of mounting/unmounting it. */
function SidebarLabel({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'overflow-hidden whitespace-nowrap transition-all duration-(--duration-standard) ease-out',
        collapsed ? 'max-w-0 opacity-0' : 'max-w-[11rem] opacity-100',
        className,
      )}
    >
      {children}
    </span>
  );
}

interface SidebarContentProps {
  activeStatus: StatusFilter | 'all';
  isHome: boolean;
  counts: Record<StatusFilter | 'all', number>;
  onOpenPalette: () => void;
  collapsed: boolean;
}

function SidebarContent({
  activeStatus,
  isHome,
  counts,
  onOpenPalette,
  collapsed,
}: SidebarContentProps) {
  const { recent } = useRecentDocuments();
  const { setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link to="/" className="group flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm transition-transform duration-(--duration-standard) group-hover:scale-105">
            <FileText className="h-4 w-4" />
          </span>
          <SidebarLabel collapsed={collapsed} className="font-serif text-xl font-semibold tracking-tight">
            DocIQ
          </SidebarLabel>
        </Link>
      </div>

      <div className="flex flex-col gap-3 px-3">
        <MaybeTooltip show={collapsed} label="Upload Document">
          <UploadModal
            trigger={
              <Button className="w-full justify-start gap-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-(--duration-standard)">
                <UploadCloud className="h-4 w-4 shrink-0" />
                <SidebarLabel collapsed={collapsed}>Upload Document</SidebarLabel>
              </Button>
            }
          />
        </MaybeTooltip>

        <MaybeTooltip show={collapsed} label={`Search... (${isMac ? '⌘K' : 'Ctrl K'})`}>
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex w-full items-center gap-2 overflow-hidden rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Search className="h-4 w-4 shrink-0" />
            <SidebarLabel collapsed={collapsed} className="flex-1 text-left">
              Search...
            </SidebarLabel>
            <SidebarLabel collapsed={collapsed} className="shrink-0">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </SidebarLabel>
          </button>
        </MaybeTooltip>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto overflow-x-hidden px-3">
        <SidebarLabel
          collapsed={collapsed}
          className="mb-1 block px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Library
        </SidebarLabel>
        <div className="flex flex-col gap-0.5">
          <MaybeTooltip show={collapsed} label={`All Documents (${counts.all})`}>
            <Link to="/" className="relative block">
              {isHome && activeStatus === 'all' && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-sm">
                <FileText
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isHome && activeStatus === 'all' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <SidebarLabel
                  collapsed={collapsed}
                  className={cn(
                    'flex-1',
                    isHome && activeStatus === 'all' && 'font-medium text-foreground',
                  )}
                >
                  All Documents
                </SidebarLabel>
                <SidebarLabel collapsed={collapsed} className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {counts.all}
                </SidebarLabel>
              </span>
            </Link>
          </MaybeTooltip>

          {STATUS_NAV.map((item) => {
            const isActive = isHome && activeStatus === item.status;
            return (
              <MaybeTooltip
                key={item.status}
                show={collapsed}
                label={`${item.label} (${counts[item.status]})`}
              >
                <Link to={`/?status=${item.status}`} className="relative block">
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-md bg-primary/10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-sm">
                    <item.icon
                      className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : item.tone)}
                    />
                    <SidebarLabel
                      collapsed={collapsed}
                      className={cn('flex-1', isActive && 'font-medium text-foreground')}
                    >
                      {item.label}
                    </SidebarLabel>
                    <SidebarLabel
                      collapsed={collapsed}
                      className="shrink-0 text-xs tabular-nums text-muted-foreground"
                    >
                      {counts[item.status]}
                    </SidebarLabel>
                  </span>
                </Link>
              </MaybeTooltip>
            );
          })}
        </div>

        {recent.length > 0 && (
          <div className={cn('mt-6', collapsed && 'hidden')}>
            <div className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </div>
            <div className="flex flex-col gap-0.5">
              {recent.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center gap-2 truncate rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t p-3">
        <DropdownMenu>
          <MaybeTooltip show={collapsed} label="Theme">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 overflow-hidden text-muted-foreground">
                <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                  <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </span>
                <SidebarLabel collapsed={collapsed}>Theme</SidebarLabel>
              </Button>
            </DropdownMenuTrigger>
          </MaybeTooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function AppSidebar({ mobileOpen, onMobileOpenChange }: AppSidebarProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: documents = [] } = useGetDocumentsQuery();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const isHome = location.pathname === '/';
  const activeStatus = (searchParams.get('status') as StatusFilter) || 'all';

  const counts = useMemo(() => {
    const base: Record<StatusFilter | 'all', number> = {
      all: documents.length,
      completed: 0,
      processing: 0,
      ocr_required: 0,
      failed: 0,
      pending: 0,
    };
    for (const doc of documents) {
      base[bucketOf(doc.status)]++;
    }
    return base;
  }, [documents]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const contentProps: SidebarContentProps = {
    activeStatus,
    isHome,
    counts,
    onOpenPalette: () => setPaletteOpen(true),
    collapsed: false,
  };

  return (
    <>
      <aside
        className={cn(
          'relative hidden shrink-0 border-r bg-sidebar transition-[width] duration-(--duration-standard) lg:flex lg:flex-col',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-(--duration-standard)',
              collapsed && 'rotate-180',
            )}
          />
        </button>
        <SidebarContent {...contentProps} collapsed={collapsed} />
      </aside>

      <MobileSidebarSheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SidebarContent {...contentProps} collapsed={false} />
      </MobileSidebarSheet>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
