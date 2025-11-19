
'use client';
import { LogisticsSidebarNav } from '@/components/logistics/logistics-sidebar-nav';
import { LogisticsProvider } from './context';

export default function LogisticsLayout({ children }: {children: React.ReactNode}) {
  return (
    <LogisticsProvider>
      <div className="grid h-[calc(100vh-4rem)] w-full md:grid-cols-[auto_1fr]">
        <LogisticsSidebarNav />
        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-muted/30">
          {children}
        </div>
      </div>
    </LogisticsProvider>
  );
}
