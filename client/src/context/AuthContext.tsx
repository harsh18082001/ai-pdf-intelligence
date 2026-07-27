import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  idToken: string;
}

interface AuthContextType {
  user: UserProfile | null;
  guestSessionId: string;
  isGuest: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string>('');

  useEffect(() => {
    // 1. Initialize or load Guest Session ID
    let guestId = localStorage.getItem('dociq_guest_session_id');
    if (!guestId) {
      guestId = 'guest_' + crypto.randomUUID();
      localStorage.setItem('dociq_guest_session_id', guestId);
    }
    setGuestSessionId(guestId);

    // 2. Load stored Google Token if present
    const storedToken = localStorage.getItem('dociq_google_token');
    if (storedToken) {
      const payload = parseJwt(storedToken);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        setUser({
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          idToken: storedToken,
        });
      } else {
        localStorage.removeItem('dociq_google_token');
      }
    }
  }, []);

  const loginWithGoogle = async (credential: string) => {
    const payload = parseJwt(credential);
    if (!payload || !payload.sub) return;

    localStorage.setItem('dociq_google_token', credential);
    const newUserProfile: UserProfile = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      idToken: credential,
    };

    setUser(newUserProfile);

    // Automatically migrate guest documents to this Google account
    const currentGuestId = localStorage.getItem('dociq_guest_session_id');
    if (currentGuestId) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        await fetch(`${baseUrl}/auth/migrate-guest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${credential}`,
          },
          body: JSON.stringify({ guestSessionId: currentGuestId }),
        });
      } catch (err) {
        console.error('Failed to migrate guest documents:', err);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('dociq_google_token');
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guestSessionId,
        isGuest: !user,
        loginWithGoogle,
        logout,
      }}
    >
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
