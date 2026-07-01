// src/api/socket.js
import { io } from "socket.io-client";

// Matches lib/socket.js exactly:
// connect with query.userId so the server can populate userSocketMap.
// Emits available: typing, messageDelivered, messageRead, reaction, messageEdited,
//   messageDeleted, messagePinned, messageUnpinned, newDirectMessage, newGroupMessage,
//   groupUpdate, groupMemberAdded, groupMemberRemoved, joinRoom, leaveRoom
//   Listens available: onlineUsers, typing, groupTyping, messageDelivered,
//   messageRead, messageReaction, newMessage, groupMessage, messageUpdated,
//   messageDeleted, messagePinned, messageUnpinned, groupUpdate, groupMemberAdded,
//   groupMemberRemoved, groupDeleted
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = (userId) => {
  if (!userId) return null;
  if (socket?.connected && socket.io.opts.query?.userId === userId) return socket;
  if (socket) {
    socket.disconnect();
  }
  socket = io(SOCKET_URL, {
    query: { userId },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Room management
export const emitJoinRoom = (roomId, roomType = "direct") =>
  socket?.emit("joinRoom", { roomId, roomType });

export const emitLeaveRoom = (roomId) => socket?.emit("leaveRoom", { roomId });

// Typing
export const emitTyping = (payload) => socket?.emit("typing", payload);

// Message delivery and read status
export const emitMessageDelivered = (payload) => socket?.emit("messageDelivered", payload);
export const emitMessageRead = (payload) => socket?.emit("messageRead", payload);

// Direct and group messages
export const emitDirectMessage = (payload) => socket?.emit("newDirectMessage", payload);
export const emitGroupMessage = (payload) => socket?.emit("newGroupMessage", payload);

// Message actions
export const emitReaction = (payload) => socket?.emit("reaction", payload);
export const emitMessageEdited = (payload) => socket?.emit("messageEdited", payload);
export const emitMessageDeleted = (payload) => socket?.emit("messageDeleted", payload);
export const emitMessagePinned = (payload) => socket?.emit("messagePinned", payload);
export const emitMessageUnpinned = (payload) => socket?.emit("messageUnpinned", payload);

// Group updates
export const emitGroupUpdate = (payload) => socket?.emit("groupUpdate", payload);
export const emitGroupMemberAdded = (payload) => socket?.emit("groupMemberAdded", payload);
export const emitGroupMemberRemoved = (payload) => socket?.emit("groupMemberRemoved", payload);