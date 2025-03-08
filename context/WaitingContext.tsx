import React, { createContext, useState, useContext } from 'react';

const WaitingContext = createContext();

export const WaitingProvider = ({ children }) => {
  const [waitingStatus, setWaitingStatus] = useState(null); // { stopId, createdAt }
  const [countdown, setCountdown] = useState(5); // 5-second countdown for "Picked Up"
  const [autoDeleteCountdown, setAutoDeleteCountdown] = useState(300); // 5-minute countdown in seconds

  return (
    <WaitingContext.Provider
      value={{
        waitingStatus,
        setWaitingStatus,
        countdown,
        setCountdown,
        autoDeleteCountdown,
        setAutoDeleteCountdown,
      }}
    >
      {children}
    </WaitingContext.Provider>
  );
};

export const useWaiting = () => useContext(WaitingContext);