import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

import userService from "../services/userService";
import messageService from "../services/messageService";

import {
  connectSocket,
  getSocket,
  emitJoinRoom,
  emitLeaveRoom,
  emitTyping,
  emitMessageRead,
} from "../api/socket";

import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();

  const [sidebarUsers, setSidebarUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingFrom, setTypingFrom] = useState({});
 const [isLoadingSidebar, setIsLoadingSidebar] = useState(false);
  const activeChatRef = useRef(null);
  const openRequestIdRef = useRef(0);

  useEffect(() => {
    activeChatRef.current = activeChatUser;
  }, [activeChatUser]);

  /* ---------------- SIDEBAR ---------------- */
  

const loadSidebar = useCallback(async () => {
  setIsLoadingSidebar(true);
  try {
    const data = await userService.getSidebar();
    setSidebarUsers(data.users ?? []);
    setUnseenMessages(data.unseenMessages ?? {});
  } finally {
    setIsLoadingSidebar(false);
  }
}, []);
  /* ---------------- OPEN CHAT ---------------- */
  const openChat = useCallback(
    async (selectedUser) => {
      const myId = user?._id;

      setActiveChatUser(selectedUser);
      setMessages([]);

      // Join the socket room BEFORE awaiting history. If we join after the
      // fetch below, any message sent while history is still loading gets
      // saved to the DB but broadcast to a room we haven't joined yet, so
      // we never receive it over the socket.
      if (myId) {
        const roomId = `direct_${[myId, selectedUser._id].sort().join("_")}`;
        emitJoinRoom(roomId, "direct");
      }

      const requestId = ++openRequestIdRef.current;

      const data = await messageService.getMessages(selectedUser._id, 1, 40);

      // If the user has already switched to a different chat since this
      // fetch started, this response is stale — discard it.
      if (openRequestIdRef.current !== requestId) return;

      setMessages((prev) => {
        const fetched = data.messages ?? [];
        // The fetch was a snapshot taken when this call started. Any
        // message that arrived over the socket in the meantime (e.g. one
        // we just sent) won't be in `fetched` — merge instead of
        // overwriting so we don't wipe it back out.
        const fetchedIds = new Set(fetched.map((m) => m._id));
        const extras = prev.filter((m) => !fetchedIds.has(m._id));
        return [...fetched, ...extras];
      });

      setUnseenMessages((prev) => {
        const copy = { ...prev };
        delete copy[selectedUser._id];
        return copy;
      });
    },
    [user]
  );

  /* ---------------- CLOSE CHAT ---------------- */
  const closeChat = useCallback(() => {
    const current = activeChatRef.current;

    if (current && user?._id) {
      const roomId = `direct_${[user._id, current._id].sort().join("_")}`;
      emitLeaveRoom(roomId);
    }

    setActiveChatUser(null);
    setMessages([]);
  }, [user]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = useCallback(async ({ text, image, replyTo }) => {
    const current = activeChatRef.current;
    if (!current) return;

    const socket = getSocket();

    // 1. API call
    const res = await messageService.sendDirect(current._id, {
      text,
      image,
      replyTo,
    });

    const savedMessage = res?.message;

    // 2. Emit socket event AFTER save so the server can broadcast the
    //    saved (real _id, timestamps, etc.) message to the room, which
    //    both sender and receiver are listening on.
    socket?.emit("newDirectMessage", {
      message: savedMessage,
      receiverId: current._id,
    });
  }, []);

  /* ---------------- RECEIVE MESSAGE ---------------- */
  const receiveMessage = useCallback((msg) => {
    const current = activeChatRef.current;

    const senderId = msg.senderId?._id || msg.senderId;

    const isActive =
      current &&
      (senderId === current._id || msg.receiverId === current._id);

    if (!isActive) {
      setUnseenMessages((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] ?? 0) + 1,
      }));
      return;
    }

    setMessages((prev) => {
      const exists = prev.some((m) => m._id === msg._id);
      if (exists) return prev;

      // replace temp message if exists
      const filtered = prev.filter((m) => !m._id.startsWith("temp-"));
      return [...filtered, msg];
    });

    emitMessageRead({ messageId: msg._id, receiverId: senderId });
  }, []);

  /* ---------------- UPDATE HELPERS ---------------- */
  const applyUpdate = useCallback((updated) => {
    if (!updated?._id) return;

    setMessages((prev) =>
      prev.map((m) => (m._id === updated._id ? updated : m))
    );
  }, []);

  const applyDelete = useCallback((messageId) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const applyReaction = useCallback(({ messageId, reactions }) => {
  setMessages((prev) =>
    prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
  );
}, []);
   const applyMessageRead = useCallback(({ messageId, from }) => {
  setMessages((prev) =>
    prev.map((m) =>
      m._id === messageId
        ? { ...m, seenBy: m.seenBy?.includes(from) ? m.seenBy : [...(m.seenBy ?? []), from] }
        : m
    )
  );
}, []);
  /* ---------------- SOCKET LISTENERS ---------------- */
  // The socket may not exist yet the first time this effect runs (e.g. the
  // SOCKET INIT effect above is still waiting on user._id to resolve). If we
  // just bail out on a null socket and never retry, these listeners never
  // get attached for the lifetime of the provider — which is why messages
  // sometimes only ever show up when both tabs happen to have connected
  // before this effect first ran. Retry until the socket exists, same
  // pattern as GroupContext.jsx.
  useEffect(() => {
    let socket = getSocket();
    let retryTimer = null;

    const attach = (s) => {
      const handleOnline = (users) => setOnlineUserIds(users);
      const handleTyping = ({ from, isTyping }) =>
        setTypingFrom((p) => ({ ...p, [from]: isTyping }));
      const handleNewMessage = (msg) => receiveMessage(msg);
      const handleMessageUpdated = (msg) => applyUpdate(msg);
      const handleMessageDeleted = (d) => applyDelete(d.messageId);
      const handleMessageReaction = (payload) => applyReaction(payload);
      const handleMessagePinned = (msg) => applyUpdate(msg);
      const handleMessageUnpinned = (msg) => applyUpdate(msg);
      const handleMessageRead = (payload) => applyMessageRead(payload);
      s.on("onlineUsers", handleOnline);
      s.on("messageRead", handleMessageRead);
      s.on("typing", handleTyping);
      s.on("newMessage", handleNewMessage);
      // Server emits "messageUpdated" for edits (see lib/socket.js) —
      // listening for "messageEdited" here never fired.
      s.on("messageUpdated", handleMessageUpdated);
      s.on("messageDeleted", handleMessageDeleted);
      s.on("messageReaction", handleMessageReaction);
      // Server emits the message object directly for pin/unpin, not
      // wrapped in { message }.
      s.on("messagePinned", handleMessagePinned);
      s.on("messageUnpinned", handleMessageUnpinned);

      return () => {
        s.off("onlineUsers", handleOnline);
        s.off("typing", handleTyping);
        s.off("newMessage", handleNewMessage);
        s.off("messageUpdated", handleMessageUpdated);
        s.off("messageRead", handleMessageRead);
        s.off("messageDeleted", handleMessageDeleted);
        s.off("messageReaction", handleMessageReaction);
        s.off("messagePinned", handleMessagePinned);
        s.off("messageUnpinned", handleMessageUnpinned);
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
  }, [receiveMessage, applyUpdate, applyDelete, applyReaction]);

  /* ---------------- TYPING ---------------- */
  const sendTyping = useCallback((isTyping) => {
    const current = activeChatRef.current;
    if (!current) return;

    emitTyping({
      receiverId: current._id,
      isTyping,
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        sidebarUsers,
        unseenMessages,
        onlineUserIds,
        activeChatUser,
        messages,
        typingFrom,

        loadSidebar,
        openChat,
        closeChat,
        sendMessage,
        sendTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}