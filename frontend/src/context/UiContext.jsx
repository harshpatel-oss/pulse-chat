// src/context/UiContext.jsx
//
// Replaces store/uiStore.js. One subtlety carried over deliberately: many
// service/store call sites need to fire a toast from plain async functions,
// not React components, so they can't call useContext() directly. We solve
// this the same way the old Zustand version did — a module-level dispatcher
// that the provider registers itself into on mount — without pulling in a
// second state library.
import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";

const UiContext = createContext(null);

let dispatchToast = null; // set by the provider; used by the toast.* helpers below

export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mobileView, setMobileView] = useState("list");
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = ++idRef.current;
      const entry = { id, type: "info", duration: 3500, ...toast };
      setToasts((prev) => [...prev, entry]);
      setTimeout(() => dismissToast(id), entry.duration);
      return id;
    },
    [dismissToast]
  );

  // Register the module-level dispatcher exactly once per provider instance.
  dispatchToast = pushToast;

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast, mobileView, setMobileView }),
    [toasts, pushToast, dismissToast, mobileView]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within a UiProvider");
  return ctx;
}

// Non-component call sites (services, contexts reacting to socket events,
// etc.) use this instead of the hook.
export const toast = {
  success: (message) => dispatchToast?.({ type: "success", message }),
  error: (message) => dispatchToast?.({ type: "error", message }),
  info: (message) => dispatchToast?.({ type: "info", message }),
};
