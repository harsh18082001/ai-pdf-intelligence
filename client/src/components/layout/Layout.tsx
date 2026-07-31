import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { PageTransition } from './PageTransition';
import { Toaster } from '@/components/ui/sonner';

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-auto">
          <PageTransition />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
