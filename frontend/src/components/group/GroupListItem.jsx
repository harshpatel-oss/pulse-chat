// src/components/group/GroupListItem.jsx
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "../../utils/misc";

export default function GroupListItem({ group, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left",
        isActive ? "bg-accent/10" : "hover:bg-elevated/50"
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-elevated flex items-center justify-center overflow-hidden shrink-0">
        {group.avatar ? (
          <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <Users size={20} className="text-ink-dim" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", isActive && "text-accent")}>{group.name}</p>
        <p className="text-xs text-ink-dim truncate">
          {group.members?.length ?? 0} member{group.members?.length === 1 ? "" : "s"}
        </p>
      </div>
    </motion.button>
  );
}
