import React, { createContext, useContext, useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'dociq_user_db';
const STORE_NAME = 'user_config';

async function initUserDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getStoredClientId(): Promise<string> {
  try {
    const db = await initUserDB();
    let clientId = await db.get(STORE_NAME, 'clientId');
    if (!clientId) {
      clientId = localStorage.getItem('dociq_client_id');
    }
    if (!clientId) {
      clientId = 'usr_' + crypto.randomUUID();
    }
    await db.put(STORE_NAME, clientId, 'clientId');
    localStorage.setItem('dociq_client_id', clientId);
    return clientId;
  } catch {
    let clientId = localStorage.getItem('dociq_client_id');
    if (!clientId) {
      clientId = 'usr_' + crypto.randomUUID();
      localStorage.setItem('dociq_client_id', clientId);
    }
    return clientId;
  }
}

interface AuthContextType {
  clientId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    getStoredClientId().then((id) => setClientId(id));
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
