'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The provider now gets the initialized services from the module scope.
  // This simplifies the client provider significantly.
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
