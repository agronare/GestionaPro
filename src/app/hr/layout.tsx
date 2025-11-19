
'use client';
import { HrSidebarNav } from '@/components/hr/hr-sidebar-nav';
import { usePathname } from 'next/navigation';

interface HrLayoutProps {
  children: React.ReactNode;
}

export default function HrLayout({ children }: HrLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="grid h-[calc(100vh-4rem)] w-full md:grid-cols-[auto_1fr]">
      <HrSidebarNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
