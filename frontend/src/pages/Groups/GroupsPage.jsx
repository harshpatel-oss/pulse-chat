// src/pages/Groups/GroupsPage.jsx
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Users, Info, AlertCircle } from "lucide-react";
import GroupSidebar from "../../components/group/GroupSidebar";
import CreateGroupModal from "../../components/group/CreateGroupModal";
import GroupDetailsPanel from "../../components/group/GroupDetailsPanel";
import MessageBubble from "../../components/chat/MessageBubble";
import MessageComposer from "../../components/chat/MessageComposer";
import EmptyState from "../../components/ui/EmptyState";
import Avatar from "../../components/ui/Avatar";
import { useGroup } from "../../context/GroupContext";
import { useAuth } from "../../context/AuthContext";
import { useUi, toast } from "../../context/UiContext";
import messageService from "../../services/messageService";
import {
  emitMessageEdited,
  emitMessageDeleted,
  emitReaction,
  emitMessagePinned,
  emitMessageUnpinned,
} from "../../api/socket";

export default function GroupsPage() {
  const { user: currentUser } = useAuth();
  const {
    activeGroup,
    groupMessages,
    groupTypingUsers,
    loadGroups,
    createGroup,
    openGroup,
    sendGroupMessage,
    leaveGroup,
    deleteGroup,
    applyMessageUpdate,
    applyMessageDelete,
  } = useGroup();

  // NOTE: group socket listeners (groupMessage, groupTyping) are attached
  // once, internally, by GroupProvider — this page no longer attaches them.
  const { mobileView, setMobileView } = useUi();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages.length]);

  const handleSelect = async (groupId) => {
    await openGroup(groupId);
    setMobileView("thread");
  };

  const handleSend = async (payload) => {
    if (editingMessage) {
      await handleSaveEdit(editingMessage, payload.text);
      return;
    }
    await sendGroupMessage(payload);
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(activeGroup._id);
      setDetailsOpen(false);
      toast.success("You left the group");
    } catch (error) {
      toast.error(error.message || "Failed to leave group");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(activeGroup._id);
      setDetailsOpen(false);
      toast.success("Group deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete group");
    }
  };

  const handleEdit = (message) => setEditingMessage(message);

  const handleSaveEdit = async (message, text) => {
    try {
      const data = await messageService.editMessage(message._id, text);
      // Emit socket event
      //emitMessageEdited({ message: data.message, groupId: activeGroup._id, receiverId: null });
      setEditingMessage(null);
    } catch (error) {
      toast.error(error.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (message, forEveryone) => {
    try {
      await messageService.deleteMessage(message._id, forEveryone);
      //emitMessageDeleted({ messageId: message._id, groupId: activeGroup._id, receiverId: null });
    } catch (error) {
      toast.error(error.message || "Failed to delete message");
    }
  };

  const handleReact = async (message, emoji) => {
    try {
      const data = await messageService.react(message._id, emoji);
      //emitReaction({ messageId: message._id, reaction: emoji, groupId: activeGroup._id, receiverId: null });
    } catch (error) {
      toast.error(error.message || "Failed to react");
    }
  };

  const handlePin = async (message) => {
    try {
      const data = await messageService.pin(message._id);
      //emitMessagePinned({ message: data.message, groupId: activeGroup._id, receiverId: null });
      toast.success("Message pinned");
    } catch (error) {
      toast.error(error.message || "Failed to pin message");
    }
  };
   const handleUnpin = async (message) => {
    try {
      const data = await messageService.unpin(message._id);
  
      emitMessageUnpinned({
        message: data.message,
        groupId: null,
        receiverId: activeChatUser._id,
      });
  
      applyMessageUpdate(data.message);
  
      toast.success("Message unpinned");
    } catch (error) {
      toast.error(error.message || "Failed to unpin message");
    }
  }; 
  const handleTyping = (isTyping) => {
    // Emit typing event to group
    if (activeGroup) {
      //emitGroupTyping({ groupId: activeGroup._id, userId: currentUser._id, isTyping });
    }
  }; 

  const typingUserIds = Object.entries(groupTypingUsers[activeGroup?._id] || {})
    .filter(([, isTyping]) => isTyping)
    .map(([id]) => id);
  // console.log(typingUserIds)
  return (
    <div className="flex h-full overflow-hidden">
      <div
        className={`w-full md:w-[320px] border-r border-border shrink-0 ${
          mobileView === "thread" ? "hidden md:block" : "block"
        }`}
      >
        <GroupSidebar
          onSelect={handleSelect}
          activeId={activeGroup?._id}
          onCreate={() => setCreateOpen(true)}
        />
      </div>

      <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {!activeGroup ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<Users size={26} />}
              title="Select a group"
              description="Choose a group from the list, or create a new one."
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
              <Avatar src={activeGroup.avatar} name={activeGroup.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activeGroup.name}</p>
                <p className="text-xs text-ink-dim truncate">
                  {activeGroup.members?.length ?? 0} members
                  {typingUserIds.length > 0 && <span className="text-accent ml-1">· typing…</span>}
                </p>
              </div>
              <button
                onClick={() => setDetailsOpen(true)}
                className="p-2 rounded-full hover:bg-elevated text-ink-dim hover:text-ink transition-colors"
              >
                <Info size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-1.5">
              {/* <div className="bg-warn/10 border border-warn/30 text-warn text-xs rounded-xl px-3 py-2 flex items-start gap-2 mb-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Group message history loads only for messages sent while you're connected —
                  the backend doesn't currently expose a history endpoint for groups.
                </span>
              </div> */}

              {groupMessages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Messages sent in this group will appear here in real time."
                />
              ) : (
                groupMessages.map((message) => {
                  const senderId = message.senderId?._id ?? message.senderId;
                  const isOwn = senderId === currentUser?._id;
                  const senderName =
                    message.senderId?.fullName ||
                    (isOwn ? "You" : "Unknown");
                  return (
                    <div
                      key={message._id}
                      className="mb-2"
                    >
                      {!isOwn && (
                        <p className="text-xs text-ink-dim font-medium px-3 mb-0.5">
                          {senderName}
                        </p>
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        currentUserId={currentUser?._id}
                        onEdit={handleEdit}
                        onDelete={handleDeleteMessage}
                        onReact={handleReact}
                        onReply={setReplyingTo}
                        onPin={handlePin}
                        onUnpin={handleUnpin}
                      />
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <MessageComposer
              onSend={handleSend}
              onTypingChange={handleTyping}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onSaveEdit={handleSaveEdit}
            />

            <GroupDetailsPanel
              open={detailsOpen}
              onClose={() => setDetailsOpen(false)}
              group={activeGroup}
              onLeave={handleLeave}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createGroup} />
    </div>
  );
}
