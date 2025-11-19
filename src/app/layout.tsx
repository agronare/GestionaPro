'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import { AssistantBot } from '@/components/ai/assistant-bot';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showAssistant = pathname !== '/login';

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn('font-sans antialiased', 'min-h-screen bg-background', inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <div className="flex min-h-screen w-full flex-col">
              <Header />
              <main className="flex flex-1 flex-col">
                {children}
              </main>
            </div>
            {showAssistant && <AssistantBot />}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
