import React, { createContext, useState, useContext } from 'react';

// Define the interface for waiting status
interface WaitingStatus {
  stopId: string;
  createdAt: string;
  routeId?: string;          // Added for route tracking
  transportType?: string;    // Added for transport type
  routeName?: string;        // Optional: for display purposes
  stopName?: string;         // Optional: for display purposes
}

// Define the context interface
interface WaitingContextType {
  waitingStatus: WaitingStatus | null;
  setWaitingStatus: (status: WaitingStatus | null) => void;
  countdown: number;
  setCountdown: (value: number) => void;
  autoDeleteCountdown: number;
  setAutoDeleteCountdown: (value: number) => void;
  selectedRoute: Route | null;         // Added for route selection
  setSelectedRoute: (route: Route | null) => void; // Added
}

// Define the Route interface
interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
}

// Create the context with TypeScript type
const WaitingContext = createContext<WaitingContextType | undefined>(undefined);

export const WaitingProvider = ({ children }) => {
  const [waitingStatus, setWaitingStatus] = useState<WaitingStatus | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [autoDeleteCountdown, setAutoDeleteCountdown] = useState(300);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null); // New state for selected route

  return (
    <WaitingContext.Provider
      value={{
        waitingStatus,
        setWaitingStatus,
        countdown,
        setCountdown,
        autoDeleteCountdown,
        setAutoDeleteCountdown,
        selectedRoute,         // Add to context
        setSelectedRoute,       // Add to context
      }}
    >
      {children}
    </WaitingContext.Provider>
  );
};

export const useWaiting = () => {
  const context = useContext(WaitingContext);
  if (context === undefined) {
    throw new Error('useWaiting must be used within a WaitingProvider');
  }
  return context;
};