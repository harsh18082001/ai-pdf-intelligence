import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRefreshMutation, useLogoutMutation, type UserDTO } from '@/api/authApi';

interface AuthContextType {
  user: UserDTO | null;
  isGuest: boolean;
  /** True while the initial session-restore (via the refresh cookie) is in flight. */
  isLoading: boolean;
  setUser: (user: UserDTO | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh] = useRefreshMutation();
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    // Restore session from the httpOnly refresh cookie, if any — no tokens are ever read
    // from localStorage, so a guest with no account simply gets `null` back here.
    refresh()
      .unwrap()
      .then((restoredUser) => setUser(restoredUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await logoutMutation().unwrap().catch(() => undefined);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isGuest: user === null, isLoading, setUser, logout }}>
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
