import { startTransition, useEffect, useState } from 'react';
import { authApi } from '../api/client.js';
import { AuthContext } from './context.js';

const initialState = Object.freeze({
  status: 'loading',
  user: null,
  error: null,
});

function normalizeUser(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const profilePhotoUrl = typeof input.profile_photo_url === 'string'
    ? input.profile_photo_url.replace(/^\/rentease\/backend/, '/backend')
    : null;

  return {
    user_id: input.user_id ?? null,
    full_name: input.full_name ?? '',
    email: input.email ?? '',
    role: input.role ?? null,
    contact_number: input.contact_number ?? '',
    account_status: input.account_status ?? 'inactive',
    profile_photo: input.profile_photo ?? null,
    profile_photo_url: profilePhotoUrl,
    emergency_contact_name: input.emergency_contact_name ?? '',
    emergency_contact_number: input.emergency_contact_number ?? '',
    school_or_workplace: input.school_or_workplace ?? '',
    created_at: input.created_at ?? null,
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);

  async function refreshSession({ silent = false } = {}) {
    if (!silent) {
      startTransition(() => {
        setAuthState((current) => ({
          ...current,
          status: 'loading',
          error: null,
        }));
      });
    }

    try {
      const payload = await authApi.me();
      const user = normalizeUser(payload.data);

      startTransition(() => {
        setAuthState({
          status: 'authenticated',
          user,
          error: null,
        });
      });
    } catch {
      startTransition(() => {
        setAuthState({
          status: 'unauthenticated',
          user: null,
          error: null,
        });
      });
    }
  }

  async function login(credentials) {
    startTransition(() => {
      setAuthState((current) => ({
        ...current,
        status: 'loading',
        error: null,
      }));
    });

    try {
      const payload = await authApi.login(credentials);
      const user = normalizeUser(payload.data);

      startTransition(() => {
        setAuthState({
          status: 'authenticated',
          user,
          error: null,
        });
      });

      return {
        success: true,
      };
    } catch (error) {
      const message = error?.message || 'Login failed.';

      startTransition(() => {
        setAuthState({
          status: 'unauthenticated',
          user: null,
          error: message,
        });
      });

      return {
        success: false,
        message,
        errors: Array.isArray(error?.errors) ? error.errors : [],
      };
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Session can already be invalidated on server.
    }

    startTransition(() => {
      setAuthState({
        status: 'unauthenticated',
        user: null,
        error: null,
      });
    });
  }

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
