import { Moon, Sun, FileText, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

export function Header() {
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link to="/" className="flex items-center gap-2 transition-colors hover:text-primary">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">DocIQ</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Private Session Indicator */}
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
            Private Session
          </span>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
