'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { AssistantBot } from '@/components/ai/assistant-bot';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showAssistant = pathname !== '/login';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      {showAssistant && <AssistantBot />}
    </div>
  );
}
