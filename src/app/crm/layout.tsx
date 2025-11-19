
'use client';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { CrmSidebarNav } from '@/components/crm/crm-sidebar-nav';

interface CrmLayoutProps {
  children: React.ReactNode;
}

export default function CrmLayout({ children }: CrmLayoutProps) {
  return (
    <div className="grid h-[calc(100vh-4rem)] w-full md:grid-cols-[auto_1fr]">
      <CrmSidebarNav />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
