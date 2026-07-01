// src/layouts/MobileTabBar.jsx
import { NavLink } from "react-router-dom";
import { MessageCircle, Sparkles, Users, Settings } from "lucide-react";
import { cn } from "../utils/misc";

// Notifications tab removed per refactor.
const tabs = [
  { to: "/chat", icon: MessageCircle, label: "Chats" },
  { to: "/ai", icon: Sparkles, label: "AI" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileTabBar() {
  return (
    <nav className="md:hidden flex items-center justify-around border-t border-border bg-surface/95 glass px-2 py-2 shrink-0">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl",
              isActive ? "text-accent" : "text-ink-dim"
            )
          }
        >
          <span className="relative">
            <Icon size={20} />
          </span>
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
