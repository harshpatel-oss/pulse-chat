// src/components/chat/ChatSidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, Edit3 } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import ChatListItem from "./ChatListItem";
import { SidebarItemSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

export default function ChatSidebar({ onSelectUser, activeUserId }) {
  const {
    sidebarUsers,
    unseenMessages,
    onlineUserIds,
    typingFrom,
    isLoadingSidebar,
    loadSidebar,
  } = useChat();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadSidebar();
  }, [loadSidebar]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await userService.search(query.trim());
        setSearchResults((data.users ?? []).filter((u) => u._id !== currentUser?._id));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, currentUser?._id]);

  const sortedList = useMemo(() => {
    if (searchResults) return searchResults;
    return [...sidebarUsers].sort(
      (a, b) => (unseenMessages[b._id] ?? 0) - (unseenMessages[a._id] ?? 0)
    );
  }, [sidebarUsers, unseenMessages, searchResults]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Chats</h1>
        <button className="text-ink-dim hover:text-accent transition-colors p-1.5">
          <Edit3 size={18} />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full bg-elevated rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-ink-dim/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {isLoadingSidebar && !searchResults ? (
          Array.from({ length: 6 }).map((_, i) => <SidebarItemSkeleton key={i} />)
        ) : sortedList.length === 0 ? (
          <EmptyState
            title={searchResults ? "No people found" : "No conversations yet"}
            description={
              searchResults
                ? "Try a different name, username, or email."
                : "Search for someone to start chatting."
            }
          />
        ) : (
          sortedList.map((user) => (
            <ChatListItem
              key={user._id}
              user={user}
              isActive={activeUserId === user._id}
              isOnline={onlineUserIds.includes(user._id)}
              unreadCount={unseenMessages[user._id] ?? 0}
              isTyping={!!typingFrom[user._id]}
              onClick={() => {
                onSelectUser(user);
                setQuery("");
                setSearchResults(null);
              }}
            />
          ))
        )}
        {searching && <p className="text-center text-xs text-ink-dim py-3">Searching…</p>}
      </div>
    </div>
  );
}
