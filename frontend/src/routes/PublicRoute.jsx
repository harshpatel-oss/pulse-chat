// src/routes/PublicRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return null;
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <Outlet />;
}
