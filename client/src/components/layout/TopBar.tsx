import { Link } from 'react-router-dom';
import { Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  return (
    <header className="glass sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4 lg:hidden">
      <Button variant="ghost" size="icon" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight">DocIQ</span>
      </Link>
    </header>
  );
}
