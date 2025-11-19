
'use client';
import { ErpSidebarNav } from '@/components/erp/erp-sidebar-nav';

interface ErpLayoutProps {
  children: React.ReactNode;
}

export default function ErpLayout({ children }: ErpLayoutProps) {
  return (
    <div className="grid h-[calc(100vh-4rem)] w-full md:grid-cols-[auto_1fr]">
      <ErpSidebarNav />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
