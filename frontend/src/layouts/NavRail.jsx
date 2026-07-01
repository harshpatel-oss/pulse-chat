// src/layouts/NavRail.jsx
import { NavLink } from "react-router-dom";
import { MessageCircle, Sparkles, Users, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Avatar from "../components/ui/Avatar";
import ThemeToggle from "../components/common/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/misc";

// Notifications nav item removed per refactor — the feature (and every
// route/store/component behind it) has been deleted from the frontend.
const navItems = [
  { to: "/chat", icon: MessageCircle, label: "Chats" },
  { to: "/ai", icon: Sparkles, label: "AI" },
  { to: "/groups", icon: Users, label: "Groups" },
];

export default function NavRail() {
  const { user, logout } = useAuth();

  return (
    <nav className="hidden md:flex flex-col items-center w-[76px] py-5 border-r border-border bg-surface gap-2 shrink-0">
      <div className="mb-4">
        <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center font-display font-bold text-white text-lg shadow-lg shadow-accent/30">
          P
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 w-full px-2.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors group",
                isActive ? "text-accent" : "text-ink-dim hover:text-ink hover:bg-elevated/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-accent/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                  />
                )}
                <span className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className="relative text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 w-full px-2.5">
        <ThemeToggle />
        <NavLink to="/settings" title="Settings">
          {({ isActive }) => (
            <Avatar
              src={user?.profilePic}
              name={user?.fullName}
              id={user?._id}
              size={38}
              className={cn(
                "ring-2 transition-all",
                isActive ? "ring-accent" : "ring-transparent hover:ring-border"
              )}
            />
          )}
        </NavLink>
        <button
          onClick={logout}
          title="Log out"
          className="text-ink-dim hover:text-danger transition-colors p-1.5"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
