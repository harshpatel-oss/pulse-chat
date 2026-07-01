// src/components/chat/InChatSearchModal.jsx
//
// Wires up the previously dead search icon in ChatHeader, which had
// onClick={onOpenSearch} but no parent ever passed an onOpenSearch prop —
// so clicking it was a silent no-op.
//
// Uses messageService.search, which already works around a real backend
// bug: searchMessages in message.controller.js has a duplicate `$or` key
// in one object literal, so the second `$or` (sender/receiver scoping)
// silently overwrites the first (text/media keyword match) at the
// JavaScript object-literal level — the keyword filter is never actually
// applied server-side. messageService.search applies the keyword filter
// client-side over whatever the endpoint returns, scoped to the open
// conversation, so search behaves correctly from the user's perspective
// regardless of that backend bug.
import { useState } from "react";
import { Search, X } from "lucide-react";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import messageService from "../../services/messageService";
import { formatChatListTime } from "../../utils/formatTime";
import { toast } from "../../context/UiContext";

export default function InChatSearchModal({ open, onClose, partnerId, onJumpToMessage }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    try {
      const data = await messageService.search(value.trim());
      const scoped = (data.messages ?? []).filter((m) => {
        const senderId = m.senderId?._id ?? m.senderId;
        const receiverId = m.receiverId?._id ?? m.receiverId;
        return senderId === partnerId || receiverId === partnerId;
      });
      setResults(scoped);
      setHasSearched(true);
    } catch (error) {
      toast.error(error.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        onClose();
      }}
      title="Search in conversation"
      className="max-w-md"
    >
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim" />
        <input
          autoFocus
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Search messages…"
          className="w-full bg-elevated rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/20"
        />
        {query && (
          <button
            onClick={() => runSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto scroll-thin space-y-1">
        {searching ? (
          <p className="text-center text-xs text-ink-dim py-4">Searching…</p>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState title="No messages found" description="Try a different search term." />
        ) : (
          results.map((message) => (
            <button
              key={message._id}
              onClick={() => {
                onJumpToMessage?.(message);
                onClose();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-elevated/60 transition-colors"
            >
              <p className="text-sm truncate">{message.text || "Photo"}</p>
              <p className="text-xs text-ink-dim mt-0.5">{formatChatListTime(message.createdAt)}</p>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
