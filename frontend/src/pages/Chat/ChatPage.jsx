import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageBubble from "../../components/chat/MessageBubble";
import MessageComposer from "../../components/chat/MessageComposer";

import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useUi, toast } from "../../context/UiContext";
import UserProfileModal from "../../components/chat/UserProfileModal";
import SharedMediaModal from "../../components/chat/SharedMediaModal";
import messageService from "../../services/messageService";

export default function ChatPage() {
  const { user: currentUser } = useAuth();

  const {
    activeChatUser,
    messages,
    onlineUserIds,
    typingFrom,
    openChat,
    sendMessage,
    sendTyping,
  } = useChat();

  const { mobileView, setMobileView } = useUi();

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const messageRefs = useRef({});

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    if (!activeChatUser) return;

    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [activeChatUser?._id]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;

    const senderId = last.senderId?._id ?? last.senderId;

    // auto scroll only if own message OR new incoming
    if (senderId === currentUser?._id) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, currentUser?._id]);

  /* ---------------- SELECT CHAT ---------------- */
  const handleSelectUser = (user) => {
    openChat(user);
    setMobileView("thread");
    setReplyingTo(null);
    setEditingMessage(null);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async (payload) => {
    await sendMessage(payload);
    setReplyingTo(null);
  };

  /* ---------------- EDIT MESSAGE ---------------- */
  const handleSaveEdit = async (message, text) => {
    try {
      await messageService.editMessage(message._id, text);
      setEditingMessage(null);
      toast.success("Message updated");
    } catch (err) {
      toast.error(err.message || "Failed to edit");
    }
  };

  /* ---------------- DELETE MESSAGE ---------------- */
  const handleDelete = async (message, forEveryone) => {
    try {
      await messageService.deleteMessage(message._id, forEveryone);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  /* ---------------- REACT ---------------- */
  const handleReact = async (message, emoji) => {
    try {
      await messageService.react(message._id, emoji);
    } catch (err) {
      toast.error(err.message || "Failed to react");
    }
  };

  /* ---------------- PIN ---------------- */
  const handlePin = async (message) => {
    try {
      await messageService.pin(message._id);
    } catch (err) {
      toast.error(err.message || "Failed to pin");
    }
  };

  const handleUnpin = async (message) => {
    try {
      await messageService.unpin(message._id);
    } catch (err) {
      toast.error(err.message || "Failed to unpin");
    }
  };

  /* ---------------- FIND REPLY MESSAGE ---------------- */
  const findReplyMessage = (id) => {
    return messages.find((m) => m._id === id);
  };
  const handleOpenProfile = () => {
    setProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
  };

  const handleOpenMedia = () => {
    setMediaOpen(true);
  };

  const handleCloseMedia = () => {
    setMediaOpen(false);
  };
  const handleJumpToMessage = useCallback((messageId) => {
    const node = messageRefs.current[messageId];

    if (!node) return;

    node.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    node.classList.add("ring-2", "ring-accent");

    setTimeout(() => {
      node.classList.remove("ring-2", "ring-accent");
    }, 2000);
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="flex h-full overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`w-full md:w-[340px] border-r border-border shrink-0 ${
          mobileView === "thread" ? "hidden md:block" : "block"
        }`}
      >
        <ChatSidebar
          onSelectUser={handleSelectUser}
          activeUserId={activeChatUser?._id}
        />
      </div>

      {/* CHAT AREA */}
      <div
        className={`flex-1 flex flex-col ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeChatUser ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={28} />
            <p className="mt-2">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <ChatHeader
              user={activeChatUser}
              isOnline={onlineUserIds.includes(activeChatUser._id)}
              isTyping={!!typingFrom[activeChatUser._id]}
              onBack={() => setMobileView("list")}
              onOpenProfile={handleOpenProfile}
              onOpenMedia={handleOpenMedia}
              onJumpToMessage={handleJumpToMessage}
            />

            {/* MESSAGES */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
            >
              {messages.map((message) => {
                const senderId = message.senderId?._id ?? message.senderId;
                const isOwn = senderId === currentUser?._id;

                const replyMsg = message.replyTo
                  ? findReplyMessage(message.replyTo)
                  : null;

                return (
                  <div
                    key={message._id}
                    ref={(el) => {
                      if (el) {
                        messageRefs.current[message._id] = el;
                      }
                    }}
                  >
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      currentUserId={currentUser?._id}
                      onEdit={setEditingMessage}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      onReply={setReplyingTo}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      replyToMessage={replyMsg}
                    />
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* COMPOSER */}
            <MessageComposer
              onSend={handleSend}
              onTypingChange={sendTyping}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onSaveEdit={handleSaveEdit}
            />
            <UserProfileModal
              open={profileOpen}
              onClose={handleCloseProfile}
              userId={activeChatUser?._id}
              fallbackUser={activeChatUser}
            />

            <SharedMediaModal
              open={mediaOpen}
              onClose={handleCloseMedia}
              userId={activeChatUser?._id}
            />
          </>
        )}
      </div>
    </div>
  );
}
