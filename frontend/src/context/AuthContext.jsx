// src/context/AuthContext.jsx
//
// Replaces store/authStore.js. Key correctness fixes carried over from the
// previous patch round, now structural rather than patched:
//
//   1. There is exactly ONE call site for the cold-load refresh attempt
//      (the `init` effect below), guarded by a ref so React 19 StrictMode's
//      double-invoke can't fire it twice, AND it calls the same
//      `refreshAccessToken()` singleton that the axios 401 interceptor uses
//      — so a 401 that races with app boot shares the same in-flight
//      request instead of creating a second one.
//   2. A successful refresh NEVER logs the user out. Only `onAuthFailure`
//      (wired below, fired by axiosInstance only when a refresh attempt
//      itself fails) clears the session.
//   3. No second response interceptor is registered here — axiosInstance.js
//      owns interceptors exclusively now.
import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import authService from "../services/authService";
import {
  setAccessToken,
  refreshAccessToken,
  registerAuthFailureHandler,
} from "../api/axiosInstance";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initStarted = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    disconnectSocket();
    setUser(null);
    setIsAuthenticated(false);
    setIsInitializing(false);
  }, []);

  // Wire the auth-failure callback exactly once. This fires only when a
  // refresh attempt itself fails (expired/invalid/missing cookie) — never
  // on success.
  useEffect(() => {
    registerAuthFailureHandler(clearSession);
  }, [clearSession]);

  // Cold-load rehydration: attempt /auth/refresh exactly once per app
  // lifetime, guarded by a ref rather than a plain variable so this stays
  // correct even if AuthProvider ever remounts (e.g. hot reload).
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    (async () => {
      try {
        const data = await refreshAccessToken();
        setUser(data.user ?? null);
        setIsAuthenticated(true);
        if (data.user?._id) connectSocket(data.user._id);
      } catch {
        // No valid session to rehydrate — this is the expected, common case
        // for a logged-out visitor, not an error to surface.
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const signup = useCallback(async (payload) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const data = await authService.signup(payload);
      setAccessToken(data.accessToken);
      setUser(data.userData);
      setIsAuthenticated(true);
      if (data.userData?._id) connectSocket(data.userData._id);
      return { ok: true };
    } catch (error) {
      setAuthError(error.message);
      return { ok: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const login = useCallback(async (payload) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const data = await authService.login(payload);
      setAccessToken(data.accessToken);
      setUser(data.userData);
      setIsAuthenticated(true);
      if (data.userData?._id) connectSocket(data.userData._id);
      return { ok: true };
    } catch (error) {
      setAuthError(error.message);
      return { ok: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // clear the local session regardless of network outcome
    }
    clearSession();
  }, [clearSession]);

  const logoutAllDevices = useCallback(async () => {
    try {
      await authService.logoutAll();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUserLocal = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      authError,
      isSubmitting,
      signup,
      login,
      logout,
      logoutAllDevices,
      updateUserLocal,
      clearAuthError,
    }),
    [
      user,
      isAuthenticated,
      isInitializing,
      authError,
      isSubmitting,
      signup,
      login,
      logout,
      logoutAllDevices,
      updateUserLocal,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
