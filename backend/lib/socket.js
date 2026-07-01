import { Server } from "socket.io";
import User from "../models/user.model.js";

export const userSocketMap = {}; // { userId: Set(socketId) }
export const socketUserMap = {}; // { socketId: userId }

export const io = new Server({
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

export const attachSocketServer = (server) => {
  io.attach(server);

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    console.log("Socket connected:", userId);

    if (userId) {
      // Create set if first connection
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
      }

      userSocketMap[userId].add(socket.id);
      socketUserMap[socket.id] = userId;

      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });
      } catch (err) {
        console.error("Failed to update online status:", err);
      }
    }

    // Broadcast online users to all connected clients
    io.emit("onlineUsers", Object.keys(userSocketMap));

    // -------------------------------------------------
    // Group/Chat Room Management
    // -------------------------------------------------

    socket.on("joinRoom", ({ roomId, roomType }) => {
      // roomType: "group" or "direct"
      // roomId: groupId or "direct_${userId1}_${userId2}" (sorted)
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on("leaveRoom", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
    });

    // -------------------------------------------------
    // Typing
    // -------------------------------------------------

    socket.on("typing", ({ receiverId, groupId, isTyping }) => {
      if (groupId) {
        // Broadcast to group room only
        socket.to(groupId).emit("groupTyping", {
          groupId,
          userId,
          isTyping,
        });
        return;
      }

      // For direct messages, send to specific user's room
      // Direct room ID: "direct_${userId1}_${userId2}" (sorted)
      const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
      socket.to(directRoomId).emit("typing", {
        from: userId,
        isTyping,
      });
    });

    // -------------------------------------------------
    // Message Delivered (Direct & Group)
    // -------------------------------------------------

    socket.on("messageDelivered", ({ messageId, receiverId, groupId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageDelivered", {
          messageId,
          from: userId,
        });
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageDelivered", {
          messageId,
          from: userId,
        });
      }
    });

    // -------------------------------------------------
    // Message Read (Direct & Group)
    // -------------------------------------------------

    socket.on("messageRead", ({ messageId, receiverId, groupId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageRead", {
          messageId,
          from: userId,
        });
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageRead", {
          messageId,
          from: userId,
        });
      }
    });

    // -------------------------------------------------
    // Direct Message (received from API, emitted to room)
    // -------------------------------------------------

    socket.on("newDirectMessage", ({ message, receiverId }) => {
      // message: full message object from DB
      // Send to direct message room
      const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
      io.to(directRoomId).emit("newMessage", message);
    });

    // -------------------------------------------------
    // Group Message (received from API, emitted to group room)
    // -------------------------------------------------

    socket.on("newGroupMessage", ({ message, groupId }) => {
      // message: full message object from DB
      // Broadcast to all members in the group room EXCEPT sender
      socket.to(groupId).emit("groupMessage", message);
    });

    // -------------------------------------------------
    // Message Reactions (Direct & Group)
    // -------------------------------------------------

    socket.on("reaction", ({ messageId, reaction, receiverId, groupId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageReaction", {
          messageId,
          reaction,
          from: userId,
        });
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageReaction", {
          messageId,
          reaction,
          from: userId,
        });
      }
    });

    // -------------------------------------------------
    // Message Edited (Direct & Group)
    // -------------------------------------------------

    socket.on("messageEdited", ({ message, groupId, receiverId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageUpdated", message);
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageUpdated", message);
      }
    });

    // -------------------------------------------------
    // Message Deleted (Direct & Group)
    // -------------------------------------------------

    socket.on("messageDeleted", ({ messageId, groupId, receiverId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageDeleted", { messageId });
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageDeleted", { messageId });
      }
    });

    // -------------------------------------------------
    // Message Pinned (Direct & Group)
    // -------------------------------------------------

    socket.on("messagePinned", ({ message, groupId, receiverId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messagePinned", message);
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messagePinned", message);
      }
    });

    // -------------------------------------------------
    // Message Unpinned (Direct & Group)
    // -------------------------------------------------

    socket.on("messageUnpinned", ({ message, groupId, receiverId }) => {
      if (groupId) {
        // For group, notify group room
        socket.to(groupId).emit("messageUnpinned", message);
      } else {
        // For direct, notify room
        const directRoomId = `direct_${[userId, receiverId].sort().join("_")}`;
        socket.to(directRoomId).emit("messageUnpinned", message);
      }
    });

    // -------------------------------------------------
    // Group Update
    // -------------------------------------------------

    socket.on("groupUpdate", ({ groupId, group }) => {
      // Notify all members in the group
      socket.to(groupId).emit("groupUpdate", group);
    });

    // -------------------------------------------------
    // Group Member Added
    // -------------------------------------------------

    socket.on("groupMemberAdded", ({ groupId, member }) => {
      socket.to(groupId).emit("groupMemberAdded", member);
    });

    // -------------------------------------------------
    // Group Member Removed
    // -------------------------------------------------

    socket.on("groupMemberRemoved", ({ groupId, memberId }) => {
      socket.to(groupId).emit("groupMemberRemoved", memberId);
    });

    // -------------------------------------------------
    // Disconnect
    // -------------------------------------------------

    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", userId);

      if (!userId) return;

      // Remove only this socket
      userSocketMap[userId]?.delete(socket.id);
      delete socketUserMap[socket.id];

      // If another tab/device is still connected,
      // keep the user online.
      if (
        userSocketMap[userId] &&
        userSocketMap[userId].size > 0
      ) {
        io.emit("onlineUsers", Object.keys(userSocketMap));
        return;
      }

      // No active sockets left
      delete userSocketMap[userId];

      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("Failed to update lastSeen:", err);
      }

      io.emit("onlineUsers", Object.keys(userSocketMap));
    });
  });
};
