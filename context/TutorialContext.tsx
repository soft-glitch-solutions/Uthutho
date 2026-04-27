import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { View } from 'react-native';

export interface TutorialRefs {
  headerRef?: React.RefObject<View>;
  nearbyRef?: React.RefObject<View>;
  servicesRef?: React.RefObject<View>;
  favoritesRef?: React.RefObject<View>;
  gamificationRef?: React.RefObject<View>;
  // Tab Bar Refs
  homeTabRef?: React.RefObject<View>;
  feedsTabRef?: React.RefObject<View>;
  trackerTabRef?: React.RefObject<View>;
  plannerTabRef?: React.RefObject<View>;
  // Screen elements
  trackerActionsRef?: React.RefObject<View>;
  feedsContentRef?: React.RefObject<View>;
}

interface TutorialContextType {
  refs: TutorialRefs;
  registerRef: (key: keyof TutorialRefs, ref: React.RefObject<View>) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  onStepChange: ((stepId: string) => void) | null;
  setOnStepChange: (fn: ((stepId: string) => void) | null) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false);

  // Use a ref to store the callback to avoid React's special handling of
  // setState(fn) which treats function arguments as updater functions.
  const onStepChangeRef = useRef<((stepId: string) => void) | null>(null);

  const setOnStepChange = (fn: ((stepId: string) => void) | null) => {
    onStepChangeRef.current = fn;
  };

  const refs = React.useMemo(() => ({
    headerRef: React.createRef<View>(),
    nearbyRef: React.createRef<View>(),
    servicesRef: React.createRef<View>(),
    favoritesRef: React.createRef<View>(),
    gamificationRef: React.createRef<View>(),
    homeTabRef: React.createRef<View>(),
    feedsTabRef: React.createRef<View>(),
    trackerTabRef: React.createRef<View>(),
    plannerTabRef: React.createRef<View>(),
    trackerActionsRef: React.createRef<View>(),
    feedsContentRef: React.createRef<View>(),
  }), []);

  const registerRef = (key: keyof TutorialRefs, ref: React.RefObject<View>) => {};

  // Create a stable context value that reads onStepChange from the ref
  const contextValue = React.useMemo(() => ({
    refs,
    registerRef,
    showTutorial,
    setShowTutorial,
    get onStepChange() { return onStepChangeRef.current; },
    setOnStepChange,
  }), [refs, showTutorial]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
