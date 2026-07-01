// src/components/chat/ChatHeader.jsx
import { useState } from "react";
import { ArrowLeft, Search, Image as ImageIcon, MoreVertical, Info } from "lucide-react";
import Avatar from "../ui/Avatar";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import InChatSearchModal from "./InChatSearchModal";
import { formatLastSeen } from "../../utils/formatTime";

export default function ChatHeader({
  user,
  isOnline,
  isTyping,
  onBack,
  onOpenMedia,
  onJumpToMessage,
  onOpenProfile,
}){
  // "View profile" and the search icon were previously dead — no onClick at
  // all on one, and a prop that nothing ever passed on the other. Both now
  // open real modals backed by working API calls.
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/60 glass shrink-0">
      <button onClick={onBack} className="md:hidden text-ink-dim hover:text-ink p-1 -ml-1">
        <ArrowLeft size={20} />
      </button>
      <button onClick={onOpenProfile} className="shrink-0">
        <Avatar
          src={user.profilePic}
          name={user.fullName}
          id={user._id}
          size={42}
          showRing
          online={isOnline}
        />
      </button>
      <button
        onClick={onOpenProfile}
        className="flex-1 min-w-0 text-left"
      >
        <p className="font-medium truncate">{user.fullName}</p>
        <p className="text-xs text-ink-dim truncate">
          {isTyping ? (
            <span className="text-accent font-medium">typing…</span>
          ) : isOnline ? (
            "Online"
          ) : (
            formatLastSeen(user.lastSeen)
          )}
        </p>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-full hover:bg-elevated text-ink-dim hover:text-ink transition-colors"
        >
          <Search size={18} />
        </button>
        <Dropdown
          trigger={
            <button className="p-2 rounded-full hover:bg-elevated text-ink-dim hover:text-ink transition-colors">
              <MoreVertical size={18} />
            </button>
          }
        >
          <DropdownItem icon={<ImageIcon size={15} />} onClick={onOpenMedia}>
            Shared media
          </DropdownItem>
          <DropdownItem icon={<Info size={15} />} onClick={onOpenProfile}>
            View profile
          </DropdownItem>
        </Dropdown>
      </div>
      <InChatSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        partnerId={user._id}
        onJumpToMessage={onJumpToMessage}
      />
    </div>
  );
}
