// src/components/chat/ChatListItem.jsx
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { formatChatListTime } from "../../utils/formatTime";
import { truncate, cn } from "../../utils/misc";

export default function ChatListItem({
  user,
  isActive,
  isOnline,
  unreadCount,
  isTyping,
  onClick,
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left relative",
        isActive ? "bg-accent/10" : "hover:bg-elevated/50"
      )}
    >
      <Avatar
        src={user.profilePic}
        name={user.fullName}
        id={user._id}
        size={48}
        showRing
        online={isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-medium truncate", isActive && "text-accent")}>
            {user.fullName}
          </span>
          {user.lastMessageAt && (
            <span className="text-[11px] text-ink-dim shrink-0">
              {formatChatListTime(user.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {isTyping ? (
            <span className="text-xs text-accent font-medium flex items-center gap-1">
              typing
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-accent animate-typing-dot"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </span>
          ) : (
            <span className="text-xs text-ink-dim truncate">
              {truncate(user.lastMessage || user.bio || "", 36)}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="bg-accent text-white text-[11px] font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
