// src/context/GroupContext.jsx
//
// Same ref-mirror pattern as ChatContext, for the same reason: the socket
// listener effect below subscribes once and must always read the CURRENT
// activeGroup, not whatever it was when the effect first ran.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import groupService from "../services/groupService";
import messageService from "../services/messageService";
import { getSocket, emitJoinRoom, emitLeaveRoom } from "../api/socket";

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [hasMoreGroupMessages, setHasMoreGroupMessages] = useState(true);
  const [groupMessagesPage, setGroupMessagesPage] = useState(1);
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const [unseenGroupMessages, setUnseenGroupMessages] = useState({});
 
  // const receiveGroupMessage = useCallback((message) => {
  //   const current = activeGroupRef.current;
  //   if (current && message.groupId === current._id) {
  //     setGroupMessages((prev) => [...prev, message]);
  //     return;
  //   }
  //   setUnseenGroupMessages((prev) => ({
  //     ...prev,
  //     [message.groupId]: (prev[message.groupId] ?? 0) + 1,
  //   }));
  // }, []);
  const activeGroupRef = useRef(null);
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const data = await groupService.getMyGroups();
      setGroups(data.groups ?? []);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const createGroup = useCallback(async (payload) => {
    const data = await groupService.create(payload);
    setGroups((prev) => [data.group, ...prev]);
    return data.group;
  }, []);

  const openGroup = useCallback(async (groupId) => {
    setIsLoadingGroupMessages(true);
    setGroupMessages([]);
    setHasMoreGroupMessages(true);
    setGroupMessagesPage(1);
    setActiveGroup(null);

    // Join first, so nothing that lands mid-fetch (or fires because the
    // socket only just connected) gets missed.
    emitJoinRoom(groupId, "group");

    try {
      const [groupData, messagesData] = await Promise.all([
        groupService.getById(groupId),
        messageService.getGroupMessages(groupId, 1, 40),
      ]);
      setActiveGroup(groupData.group);
      setGroupMessages(messagesData.messages ?? []);
      setHasMoreGroupMessages((messagesData.messages ?? []).length === 40);
    } finally {
      setIsLoadingGroupMessages(false);
    }
  }, []);

  const loadOlderGroupMessages = useCallback(async () => {
    const current = activeGroupRef.current;
    if (!current) return;
    const nextPage = groupMessagesPage + 1;
    try {
      const data = await messageService.getGroupMessages(
        current._id,
        nextPage,
        40,
      );
      const older = data.messages ?? [];
      setGroupMessages((prev) => [...older, ...prev]);
      setGroupMessagesPage(nextPage);
      setHasMoreGroupMessages(older.length === 40);
    } catch {
      // keep current state on failure
    }
  }, [groupMessagesPage]);

  const closeGroup = useCallback(() => {
    const current = activeGroupRef.current;
    if (current) {
      emitLeaveRoom(current._id);
    }
    setActiveGroup(null);
    setGroupMessages([]);
  }, []);

  const sendGroupMessage = useCallback(async ({ text, image, replyTo }) => {
    const current = activeGroupRef.current;
    if (!current) return;

    const data = await messageService.sendGroup(current._id, {
      text,
      image,
      replyTo,
    });

    // Do NOT update state here.
    // The socket "groupMessage" event will add it exactly once.

    return data.newMessage;
  }, []);

  const applyMessageUpdate = useCallback((updated) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m._id === updated._id ? updated : m)),
    );
  }, []);

  const applyMessageDelete = useCallback(({ messageId }) => {
    setGroupMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const applyMessageReaction = useCallback(({ messageId, reactions }) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
    );
  }, []);

  const applyMessagePinned = useCallback((message) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m._id === message._id ? message : m)),
    );
  }, []);

  const applyMessageUnpinned = useCallback((message) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m._id === message._id ? message : m)),
    );
  }, []);
    const receiveGroupMessage = useCallback((message) => {
  const current = activeGroupRef.current;
  console.log("receiveGroupMessage check:", {
    currentGroupId: current?._id,
    currentGroupIdType: typeof current?._id,
    messageGroupId: message.groupId,
    messageGroupIdType: typeof message.groupId,
    isEqual: current?._id === message.groupId,
  });
  if (current && message.groupId === current._id) {
    setGroupMessages((prev) => [...prev, message]);
  }
}, []);
  const applyGroupUpdate = useCallback((updatedGroup) => {
    const current = activeGroupRef.current;
    if (current && updatedGroup._id === current._id) {
      setActiveGroup(updatedGroup);
    }
    setGroups((prev) =>
      prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
    );
  }, []);

  const updateGroup = useCallback(async (id, payload) => {
    const data = await groupService.update(id, payload);
    setGroups((prev) => prev.map((g) => (g._id === id ? data.group : g)));
    setActiveGroup((prev) => (prev?._id === id ? data.group : prev));
    return data.group;
  }, []);

  const addMember = useCallback(async (id, memberId) => {
    const data = await groupService.addMember(id, memberId);
    setGroups((prev) => prev.map((g) => (g._id === id ? data.group : g)));
    setActiveGroup((prev) => (prev?._id === id ? data.group : prev));
  }, []);

  const removeMember = useCallback(async (id, memberId) => {
    const data = await groupService.removeMember(id, memberId);
    setGroups((prev) => prev.map((g) => (g._id === id ? data.group : g)));
    setActiveGroup((prev) => (prev?._id === id ? data.group : prev));
  }, []);

  const promoteAdmin = useCallback(async (id, memberId) => {
    const data = await groupService.promote(id, memberId);
    setGroups((prev) => prev.map((g) => (g._id === id ? data.group : g)));
    setActiveGroup((prev) => (prev?._id === id ? data.group : prev));
  }, []);

  const demoteAdmin = useCallback(async (id, memberId) => {
    const data = await groupService.demote(id, memberId);
    setGroups((prev) => prev.map((g) => (g._id === id ? data.group : g)));
    setActiveGroup((prev) => (prev?._id === id ? data.group : prev));
  }, []);

  const leaveGroup = useCallback(async (id) => {
    await groupService.leave(id);
    setGroups((prev) => prev.filter((g) => g._id !== id));
    setActiveGroup((prev) => (prev?._id === id ? null : prev));
  }, []);

  const joinPublicGroup = useCallback(async (id) => {
    const data = await groupService.join(id);
    setGroups((prev) => [data.group, ...prev]);
    return data.group;
  }, []);

  const deleteGroup = useCallback(async (id) => {
    await groupService.delete(id);
    setGroups((prev) => prev.filter((g) => g._id !== id));
    setActiveGroup((prev) => (prev?._id === id ? null : prev));
  }, []);

  const setGroupTyping = useCallback((groupId, userId, isTyping) => {
    setGroupTypingUsers((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], [userId]: isTyping },
    }));
  }, []);

  // See the matching comment in ChatContext.jsx for why this retries
  // instead of giving up permanently if getSocket() returns null on the
  // first effect run.
  useEffect(() => {
    let socket = getSocket();
    let retryTimer = null;

    const attach = (s) => {
      const onGroupMessage = (msg) => {
         console.log("received groupMessage", msg);
        receiveGroupMessage(msg);
      }
      const onGroupTyping = ({ groupId, userId, isTyping }) =>
        setGroupTyping(groupId, userId, isTyping);
      const onMessageUpdated = (msg) => applyMessageUpdate(msg);
      const onMessageDeleted = (payload) => applyMessageDelete(payload);
      const onMessageReaction = (payload) => applyMessageReaction(payload);
      const onMessagePinned = (msg) => applyMessagePinned(msg);
      const onMessageUnpinned = (msg) => applyMessageUnpinned(msg);
      const onGroupUpdate = (updatedGroup) => applyGroupUpdate(updatedGroup);

      s.on("groupMessage", onGroupMessage);
      s.on("groupTyping", onGroupTyping);
      s.on("messageUpdated", onMessageUpdated);
      s.on("messageDeleted", onMessageDeleted);
      s.on("messageReaction", onMessageReaction);
      s.on("messagePinned", onMessagePinned);
      s.on("messageUnpinned", onMessageUnpinned);
      s.on("groupUpdate", onGroupUpdate);

      return () => {
        s.off("groupMessage", onGroupMessage);
        s.off("groupTyping", onGroupTyping);
        s.off("messageUpdated", onMessageUpdated);
        s.off("messageDeleted", onMessageDeleted);
        s.off("messageReaction", onMessageReaction);
        s.off("messagePinned", onMessagePinned);
        s.off("messageUnpinned", onMessageUnpinned);
        s.off("groupUpdate", onGroupUpdate);
      };
    };

    let detach = null;
    if (socket) {
      detach = attach(socket);
    } else {
      retryTimer = setInterval(() => {
        socket = getSocket();
        if (socket) {
          clearInterval(retryTimer);
          retryTimer = null;
          detach = attach(socket);
        }
      }, 300);
    }

    return () => {
      if (retryTimer) clearInterval(retryTimer);
      detach?.();
    };
  }, [
    receiveGroupMessage,
    setGroupTyping,
    applyMessageUpdate,
    applyMessageDelete,
    applyMessageReaction,
    applyMessagePinned,
    applyMessageUnpinned,
    applyGroupUpdate,
  ]);

  const value = useMemo(
    () => ({
      groups,
      isLoadingGroups,
      activeGroup,
      groupMessages,
      isLoadingGroupMessages,
      hasMoreGroupMessages,
      groupTypingUsers,
      loadGroups,
      createGroup,
      openGroup,
      closeGroup,
      loadOlderGroupMessages,
      sendGroupMessage,
      applyMessageUpdate,
      applyMessageDelete,
      applyMessageReaction,
      applyMessagePinned,
      applyMessageUnpinned,
      updateGroup,
      addMember,
      removeMember,
      promoteAdmin,
      demoteAdmin,
      leaveGroup,
      joinPublicGroup,
      deleteGroup,
    }),
    [
      groups,
      isLoadingGroups,
      activeGroup,
      groupMessages,
      isLoadingGroupMessages,
      hasMoreGroupMessages,
      groupTypingUsers,
      loadGroups,
      createGroup,
      openGroup,
      closeGroup,
      loadOlderGroupMessages,
      sendGroupMessage,
      applyMessageUpdate,
      applyMessageDelete,
      applyMessageReaction,
      applyMessagePinned,
      applyMessageUnpinned,
      updateGroup,
      addMember,
      removeMember,
      promoteAdmin,
      demoteAdmin,
      leaveGroup,
      joinPublicGroup,
      deleteGroup,
    ],
  );

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within a GroupProvider");
  return ctx;
}
