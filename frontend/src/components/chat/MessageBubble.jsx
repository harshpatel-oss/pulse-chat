// src/components/chat/MessageBubble.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Reply,
  Smile,
} from "lucide-react";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { formatMessageTime } from "../../utils/formatTime";
import { cn } from "../../utils/misc";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
  onPin,
  onUnpin,
  replyToMessage,
}) {
  const [showReactions, setShowReactions] = useState(false);

  if (message.deletedForEveryone) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div className="px-4 py-2.5 rounded-2xl bg-elevated/60 text-ink-dim text-sm italic max-w-[70%]">
          This message was deleted
        </div>
      </div>
    );
  }

  const seenByOther = message.seenBy?.some((id) => id !== currentUserId);
  const myReaction = message.reactions?.find(
    (r) => r.userId === currentUserId,
  )?.reaction;

  const reactionCounts = (message.reactions ?? []).reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.28, bounce: 0.15 }}
      className={cn(
        "group flex items-end gap-1.5",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {isOwn && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1">
          <ActionButton
            icon={<Reply size={14} />}
            onClick={() => onReply?.(message)}
          />
          <Dropdown
            trigger={
              <button className="p-1.5 rounded-full hover:bg-elevated text-ink-dim hover:text-ink">
                <MoreHorizontal size={14} />
              </button>
            }
            align="right"
          >
            <DropdownItem
              icon={<Pencil size={14} />}
              onClick={() => onEdit?.(message)}
            >
              Edit
            </DropdownItem>
            {message.pinned ? (
              <DropdownItem
                icon={<Pin size={14} />}
                onClick={() => onUnpin?.(message)}
              >
                Unpin message
              </DropdownItem>
            ) : (
              <DropdownItem
                icon={<Pin size={14} />}
                onClick={() => onPin?.(message)}
              >
                Pin message
              </DropdownItem>
            )}
            <DropdownItem
              icon={<Trash2 size={14} />}
              danger
              onClick={() => onDelete?.(message, true)}
            >
              Delete for everyone
            </DropdownItem>
          </Dropdown>
        </div>
      )}

      <div
        className={cn("relative max-w-[72%] sm:max-w-[60%]")}
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => setShowReactions(false)}
      >
        {message.pinned && (
          <div className="flex items-center gap-1 mb-1 text-xs text-ink-dim">
            <Pin size={12} />
            <span>Pinned</span>
          </div>
        )}
        {replyToMessage && (
          <div
            className={cn(
              "mb-1 px-3 py-1.5 rounded-xl border-l-2 text-xs opacity-80",
              isOwn
                ? "bg-accent/20 border-accent"
                : "bg-elevated border-border",
            )}
          >
            <p className="font-medium">
              {replyToMessage.senderName || "Message"}
            </p>
            <p className="truncate text-ink-dim">
              {replyToMessage.text || "Photo"}
            </p>
          </div>
        )}

        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl animate-bubble-in shadow-sm",
            isOwn
              ? "bg-accent text-white rounded-br-md"
              : "bg-elevated text-ink rounded-bl-md",
          )}
        >
          {message.media && message.mediaType === "image" && (
            <img
              src={message.media}
              alt="Shared media"
              className="rounded-xl mb-1.5 max-h-72 object-cover"
              loading="lazy"
            />
          )}
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.text}
            </p>
          )}
          <div
            className={cn(
              "flex items-center gap-1 mt-1 text-[11px]",
              isOwn
                ? "text-white/70 justify-end"
                : "text-ink-dim justify-start",
            )}
          >
            {message.edited && <span className="italic">edited</span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn &&
              (seenByOther ? (
                <CheckCheck size={14} className="text-sky-300" />
              ) : (
                <Check size={14} />
              ))}
          </div>
        </div>

        {Object.keys(reactionCounts).length > 0 && (
          <div
            className={cn(
              "flex gap-1 mt-1",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className="text-xs bg-elevated rounded-full px-1.5 py-0.5 border border-border flex items-center gap-0.5"
              >
                {emoji}{" "}
                {count > 1 && (
                  <span className="text-[10px] text-ink-dim">{count}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute -top-9 glass-strong border border-border rounded-full px-1.5 py-1 flex gap-0.5 shadow-xl z-10",
              isOwn ? "right-0" : "left-0",
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message, emoji)}
                className={cn(
                  "text-sm hover:scale-125 transition-transform px-0.5",
                  myReaction === emoji && "scale-110",
                )}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {!isOwn && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1">
          <ActionButton
            icon={<Smile size={14} />}
            onClick={() => setShowReactions((s) => !s)}
          />
          <ActionButton
            icon={<Reply size={14} />}
            onClick={() => onReply?.(message)}
          />
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-full hover:bg-elevated text-ink-dim hover:text-ink transition-colors"
    >
      {icon}
    </button>
  );
}
