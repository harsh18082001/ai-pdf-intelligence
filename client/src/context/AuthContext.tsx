import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'dociq_client_id';

export function getStoredClientId(): string {
  let clientId = localStorage.getItem(STORAGE_KEY);
  if (!clientId || clientId.trim().length === 0) {
    clientId = 'usr_' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, clientId);
  }
  return clientId;
}

interface AuthContextType {
  clientId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientId, setClientId] = useState<string>(() => getStoredClientId());

  useEffect(() => {
    const id = getStoredClientId();
    setClientId(id);
  }, []);

  return (
    <AuthContext.Provider value={{ clientId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
