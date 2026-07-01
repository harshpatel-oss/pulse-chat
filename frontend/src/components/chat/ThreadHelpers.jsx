// src/components/chat/ThreadHelpers.jsx
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { formatDayDivider } from "../../utils/formatTime";

export function DayDivider({ date }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-[11px] font-medium text-ink-dim bg-elevated px-3 py-1 rounded-full">
        {formatDayDivider(date)}
      </span>
    </div>
  );
}

export function TypingBubble({ user }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
      <Avatar src={user?.profilePic} name={user?.fullName} id={user?._id} size={28} />
      <div className="bg-elevated rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-typing-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
