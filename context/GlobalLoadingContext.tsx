"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface GlobalLoadingContextValue {
  loading: boolean;
  loadingSources: Record<string, boolean>;
  setLoadingFor: (source: string, isLoading: boolean) => void;
  initialized: boolean; 
    isDeviceRegistered: boolean | null;
    setDeviceRegistered: (value: boolean) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(
  null
);

export const GlobalLoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loadingSources, setLoadingSources] = useState<Record<string, boolean>>(
    {}
  );
  const [initialized, setInitialized] = useState(false); // tracks first initialization
  const [isDeviceRegistered, setIsDeviceRegistered] = useState<boolean | null>(
    null
  );

  const setDeviceRegistered = (value: boolean) => setIsDeviceRegistered(value);

  const setLoadingFor = (source: string, isLoading: boolean) => {
    setLoadingSources((prev) => ({
      ...prev,
      [source]: isLoading,
    }));
    setInitialized(true);
    // mark initialized as soon as a source updates
  };

  const loading = !initialized || Object.values(loadingSources).some(Boolean);
  // ✅ loading is true until initialized and no sources are loading

  return (
    <GlobalLoadingContext.Provider
      value={{
        loading,
        loadingSources,
        setLoadingFor,
        initialized,
        isDeviceRegistered,
        setDeviceRegistered,
      }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context)
    throw new Error(
      "useGlobalLoading must be used inside GlobalLoadingProvider"
    );
  return context;
};
