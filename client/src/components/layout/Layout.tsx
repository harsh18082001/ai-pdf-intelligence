import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from '@/components/ui/sonner';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 overflow-auto animate-fade-in">
        <Outlet />
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
