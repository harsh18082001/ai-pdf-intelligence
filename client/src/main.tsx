import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './store/store';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '54549530675-r89i6oe9ljaoidrlssjiivujc642cjd0.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <AuthProvider>
          <BrowserRouter>
            <ThemeProvider defaultTheme="system" storageKey="dociq-theme">
              <App />
            </ThemeProvider>
          </BrowserRouter>
        </AuthProvider>
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
