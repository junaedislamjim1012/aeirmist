import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  wasOffline: false,
});

export const useNetworkStatus = () => useContext(NetworkStatusContext);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // We don't reset wasOffline here, we'll let the banner handle the "Back online" transition
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, wasOffline }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};
