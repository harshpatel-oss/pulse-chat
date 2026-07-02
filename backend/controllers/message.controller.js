import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../lib/socket.js";
import { successResponse, errorResponse } from "../utils/response.js";

const uploadMedia = async (media) => {
  if (!media) return { url: "", type: "" };
  const uploadResult = await cloudinary.uploader.upload(media, {
    folder: "chat_media",
  });
  return { url: uploadResult.secure_url, type: uploadResult.resource_type };
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select(
      "-password -refreshTokens",
    );
    const unseenMessages = {};

    await Promise.all(
      users.map(async (user) => {
        const count = await Message.countDocuments({
          senderId: user._id,
          receiverId: userId,
          seenBy: { $ne: userId },
        });
        if (count > 0) unseenMessages[user._id] = count;
      }),
    );

    return successResponse(res, { users, unseenMessages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 40);
    const skip = (page - 1) * limit;

    let messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
      groupId: { $exists: false },
    })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate("senderId", "fullName profilePic")
      .lean();

    // Display oldest -> newest within these latest 40
    messages.reverse();

    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
        seenBy: { $ne: myId },
      },
      {
        $addToSet: {
          seenBy: myId,
          deliveredTo: myId,
        },
      },
    );
    const directRoomId = `direct_${[myId.toString(), selectedUserId.toString()].sort().join("_")}`;
    io.to(directRoomId).emit("messagesSeen", { by: myId.toString() });
    return successResponse(res, { messages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 40);
    const skip = (page - 1) * limit;

    const group = await Group.findById(groupId);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!group.members.some((id) => id.equals(myId))) {
      return errorResponse(res, "You are not a member of this group", 403);
    }

    let messages = await Message.find({
      groupId: groupId,
      deletedForEveryone: { $ne: true },
    })
      .sort({ createdAt: -1 })   // newest first
      .skip(skip)
      .limit(limit)
      .populate("senderId", "fullName profilePic")
      .populate("replyTo", "text senderId media")
      .lean();

    messages.reverse();   // display oldest -> newest within this latest page

    await Message.updateMany(
      { groupId: groupId, seenBy: { $ne: myId } },
      { $addToSet: { seenBy: myId, deliveredTo: myId } },
    );

    return successResponse(res, { messages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, {
      $addToSet: { seenBy: req.user._id },
    });
    return successResponse(res, {});
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, groupId, replyTo } = req.body;
    const senderId = req.user._id;
    const selectedUserId = req.params.id;

    let mediaUrl = "";
    let mediaType = "";
    if (image) {
      const result = await uploadMedia(image);
      mediaUrl = result.url;
      mediaType = result.type;
    }

    const messagePayload = {
      senderId,
      text: text || "",
      replyTo,
      media: mediaUrl,
      mediaType,
    };

    if (groupId) {
      // Verify user is a member of the group
      const group = await Group.findById(groupId);
      if (!group) return errorResponse(res, "Group not found", 404);
      if (!group.members.some((id) => id.equals(senderId))) {
        return errorResponse(res, "You are not a member of this group", 403);
      }
      // Check if only admins can message
      if (
        group.onlyAdminsCanMessage &&
        !group.admins.some((id) => id.equals(senderId))
      ) {
        return errorResponse(
          res,
          "Only admins can send messages in this group",
          403,
        );
      }

      messagePayload.groupId = groupId;
      messagePayload.deliveredTo = group.members;
    } else {
      messagePayload.receiverId = selectedUserId;
    }

    const newMessage = await Message.create(messagePayload);
    await newMessage.populate("senderId", "fullName profilePic");

    if (groupId) {
      // Emit to group room
      console.log("Emitting groupMessage to room:", groupId, "clients in room:", io.sockets.adapter.rooms.get(groupId)?.size);
      io.to(groupId).emit("groupMessage", newMessage);
    } else {
      // Emit to direct message room
      const directRoomId = `direct_${[senderId.toString(), selectedUserId.toString()].sort().join("_")}`;
      io.to(directRoomId).emit("newMessage", newMessage);
    }

    return successResponse(res, { newMessage });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: id, senderId: req.user._id },
      { text, edited: true },
      { new: true },
    ).populate("senderId", "fullName profilePic");

    if (!message)
      return errorResponse(res, "Message not found or unauthorized", 404);

    if (message.groupId) {
      io.to(message.groupId.toString()).emit("messageUpdated", message);
    } else {
      // For direct messages, use room ID
      const directRoomId = `direct_${[req.user._id.toString(), message.receiverId.toString()].sort().join("_")}`;
      io.to(directRoomId).emit("messageUpdated", message);
    }

    return successResponse(res, { message });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { forEveryone } = req.body;

    const message = await Message.findById(id);
    if (!message) return errorResponse(res, "Message not found", 404);
    if (!message.senderId.equals(req.user._id))
      return errorResponse(res, "Unauthorized", 403);

    if (forEveryone) {
      message.deletedForEveryone = true;
      await message.save();

      if (message.groupId) {
        io.to(message.groupId.toString()).emit("messageDeleted", {
          messageId: id,
        });
      } else {
        const directRoomId = `direct_${[
          req.user._id.toString(),
          message.receiverId.toString(),
        ]
          .sort()
          .join("_")}`;
        io.to(directRoomId).emit("messageDeleted", { messageId: id });
      }
      return successResponse(res, { message: "Deleted for everyone" });
    }
    else {
  await Message.deleteOne({ _id: id });
  return successResponse(res, { message: "Deleted" });
}
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;
    const message = await Message.findById(id);
    if (!message) return errorResponse(res, "Message not found", 404);

    const existing = message.reactions.find((item) => item.userId.equals(req.user._id));
    if (existing) {
      if (existing.reaction === reaction) {
        message.reactions = message.reactions.filter(
          (item) => !item.userId.equals(req.user._id)
        );
      } else {
        existing.reaction = reaction;
      }
    } else {
      message.reactions.push({ userId: req.user._id, reaction });
    }
    await message.save();

    if (message.groupId) {
      io.to(message.groupId.toString()).emit("messageReaction", {
        messageId: id,
        reactions: message.reactions,
      });
    } else {
      const otherUserId = message.senderId.toString() === req.user._id.toString()
        ? message.receiverId.toString()
        : message.senderId.toString();
      const directRoomId = `direct_${[req.user._id.toString(), otherUserId].sort().join("_")}`;
      io.to(directRoomId).emit("messageReaction", {
        messageId: id,
        reactions: message.reactions,
      });
    }

    return successResponse(res, { message });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return errorResponse(res, "Message not found", 404);

    // Only the sender or group admin can pin
    if (message.senderId.toString() !== req.user._id.toString()) {
      if (message.groupId) {
        const group = await Group.findById(message.groupId);
        if (!group || !group.admins.some((id) => id.equals(req.user._id))) {
          return errorResponse(res, "Unauthorized", 403);
        }
      } else {
        return errorResponse(res, "Unauthorized", 403);
      }
    }

    message.pinned = true;
    await message.save();

    if (message.groupId) {
      io.to(message.groupId.toString()).emit("messagePinned", message);
    } else {
      // For direct messages, use room ID
      const directRoomId = `direct_${[req.user._id.toString(), message.receiverId.toString()].sort().join("_")}`;
      io.to(directRoomId).emit("messagePinned", message);
    }

    return successResponse(res, { message });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return errorResponse(res, "Message not found", 404);

    // Only the sender or group admin can unpin
    if (message.senderId.toString() !== req.user._id.toString()) {
      if (message.groupId) {
        const group = await Group.findById(message.groupId);
        if (!group || !group.admins.some((id) => id.equals(req.user._id))) {
          return errorResponse(res, "Unauthorized", 403);
        }
      } else {
        return errorResponse(res, "Unauthorized", 403);
      }
    }

    message.pinned = false;
    await message.save();

    if (message.groupId) {
      io.to(message.groupId.toString()).emit("messageUnpinned", message);
    } else {
      // For direct messages, use room ID
      const directRoomId = `direct_${[req.user._id.toString(), message.receiverId.toString()].sort().join("_")}`;
      io.to(directRoomId).emit("messageUnpinned", message);
    }

    return successResponse(res, { message });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;
    const keyword = q || "";
    const regex = new RegExp(keyword, "i");

    const messages = await Message.find({
      text: regex,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    }).sort({ createdAt: -1 });

    return successResponse(res, { messages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getSharedMedia = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const media = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
      media: { $ne: "" },
    }).sort({ createdAt: -1 });

    return successResponse(res, { media });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
