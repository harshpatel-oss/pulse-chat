// src/layouts/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import NavRail from "./NavRail";
import MobileTabBar from "./MobileTabBar";
import ToastContainer from "../components/ui/ToastContainer";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

export default function AppLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      userService.pingLastSeen().catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-base">
      <NavRail />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      <MobileTabBar />
      <ToastContainer />
    </div>
  );
}
