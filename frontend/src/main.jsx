/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { GOOGLE_CONFIG, ENABLE_GOOGLE_AUTH } from './config/google-oauth.js';
import './index.css';

// Disable StrictMode in development to prevent Google Auth double initialization warning
const isDevelopment = import.meta.env.DEV;
const Wrapper = isDevelopment ? ({ children }) => <>{children}</> : StrictMode;

const AppContent = (
  <Wrapper>
    <ThemeProvider>
      {ENABLE_GOOGLE_AUTH ? (
        <GoogleOAuthProvider clientId={GOOGLE_CONFIG.clientId}>
          <BrowserRouter>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      )}
    </ThemeProvider>
  </Wrapper>
);

createRoot(document.getElementById('root')).render(AppContent);
