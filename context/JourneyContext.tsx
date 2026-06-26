import React, { createContext, useContext, ReactNode } from 'react';
import { useJourney } from '@/hook/useJourney';

type JourneyContextValue = ReturnType<typeof useJourney>;

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const journey = useJourney();
  return (
    <JourneyContext.Provider value={journey}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourneyContext(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) {
    throw new Error('useJourneyContext must be used inside JourneyProvider');
  }
  return ctx;
}
