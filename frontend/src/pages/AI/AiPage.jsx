// src/pages/AI/AiPage.jsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import AiConversationList from "../../components/ai/AiConversationList";
import AiMessageBubble from "../../components/ai/AiMessageBubble";
import AiTypingIndicator from "../../components/ai/AiTypingIndicator";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { useAi } from "../../context/AiContext";
import { useAuth } from "../../context/AuthContext";
import { useUi, toast } from "../../context/UiContext";

export default function AiPage() {
  const { user: currentUser } = useAuth();
  const {
    conversations,
    isLoadingConversations,
    activeConversation,
    isAiTyping,
    loadConversations,
    openConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  } = useAi();

  const { mobileView, setMobileView } = useUi();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages?.length, isAiTyping]);

  const handleSelect = async (id) => {
    await openConversation(id);
    setMobileView("thread");
  };

  const handleCreate = async () => {
    try {
      await createConversation("New chat");
      setMobileView("thread");
    } catch (error) {
      toast.error(error.message || "Failed to create conversation");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id);
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete conversation");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendMessage(activeConversation._id, content);
    } catch (error) {
      toast.error(error.message || "The assistant couldn't respond. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div
        className={`w-full md:w-[320px] border-r border-border shrink-0 ${
          mobileView === "thread" ? "hidden md:block" : "block"
        }`}
      >
        <AiConversationList
          conversations={conversations}
          isLoading={isLoadingConversations}
          activeId={activeConversation?._id}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>

      <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<Sparkles size={26} />}
              title="Start a new conversation"
              description="Ask anything — the assistant remembers context within this chat."
              action={<Button onClick={handleCreate}>New chat</Button>}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/60 glass shrink-0">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden text-ink-dim hover:text-ink p-1 -ml-1"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-white">
                <Sparkles size={14} />
              </div>
              <p className="font-medium truncate flex-1">{activeConversation.title || "New chat"}</p>
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-6 space-y-6">
              {activeConversation.messages?.length === 0 ? (
                <EmptyState
                  icon={<Sparkles size={22} />}
                  title="Ask me anything"
                  description="Your conversation history is saved automatically."
                />
              ) : (
                activeConversation.messages?.map((msg, idx) => (
                  <AiMessageBubble
                    key={msg._id || idx}
                    message={msg}
                    userAvatar={currentUser?.profilePic}
                    userName={currentUser?.fullName}
                  />
                ))
              )}
              <AnimatePresence>{isAiTyping && <AiTypingIndicator />}</AnimatePresence>
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border bg-surface/60 glass p-3 md:p-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2">
                <div className="flex-1 bg-elevated rounded-2xl px-4 py-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    rows={1}
                    placeholder="Message the assistant…"
                    className="w-full bg-transparent resize-none outline-none text-sm py-2.5 max-h-32 placeholder:text-ink-dim/60"
                  />
                </div>
                <Button type="submit" size="icon" isLoading={sending} disabled={!input.trim()}>
                  <Send size={17} />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
