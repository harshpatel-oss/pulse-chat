// src/components/ai/AiConversationList.jsx
import { Plus, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SidebarItemSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import { truncate, cn } from "../../utils/misc";
import { formatChatListTime } from "../../utils/formatTime";

export default function AiConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">AI Chat</h1>
        <button
          onClick={onCreate}
          className="p-2 rounded-full bg-accent text-white hover:bg-accent-dim transition-colors shadow-md shadow-accent/20"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SidebarItemSkeleton key={i} />)
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="No AI chats yet"
            description="Start a new conversation with the assistant."
          />
        ) : (
          conversations.map((conv) => (
            <motion.div
              key={conv._id}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(conv._id)}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors",
                activeId === conv._id ? "bg-accent/10" : "hover:bg-elevated/50"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-white shrink-0">
                <Sparkles size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm truncate",
                    activeId === conv._id && "text-accent"
                  )}
                >
                  {conv.title || "New chat"}
                </p>
                <p className="text-xs text-ink-dim truncate">
                  {truncate(
                    conv.messages?.[conv.messages.length - 1]?.content || "No messages yet",
                    38
                  )}
                </p>
              </div>
              <span className="text-[10px] text-ink-dim shrink-0">
                {formatChatListTime(conv.updatedAt)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv._id);
                }}
                className="opacity-0 group-hover:opacity-100 text-ink-dim hover:text-danger p-1 transition-opacity shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
