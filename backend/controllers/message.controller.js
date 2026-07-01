import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../lib/socket.js";
import { successResponse, errorResponse } from "../utils/response.js";

const uploadMedia = async (media) => {
  if (!media) return { url: "", type: "" };
  const uploadResult = await cloudinary.uploader.upload(media, { folder: "chat_media" });
  return { url: uploadResult.secure_url, type: uploadResult.resource_type };
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select("-password -refreshTokens");
    const unseenMessages = {};

    await Promise.all(
      users.map(async (user) => {
        const count = await Message.countDocuments({ senderId: user._id, receiverId: userId, seenBy: { $ne: userId } });
        if (count > 0) unseenMessages[user._id] = count;
      })
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

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    await Message.updateMany({ senderId: selectedUserId, receiverId: myId, seenBy: { $ne: myId } }, { $addToSet: { seenBy: myId, deliveredTo: myId } });

    return successResponse(res, { messages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { $addToSet: { seenBy: req.user._id } });
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
      messagePayload.groupId = groupId;
    } else {
      messagePayload.receiverId = selectedUserId;
    }

    const newMessage = await Message.create(messagePayload);
    await newMessage.populate("senderId", "fullName profilePic");

    if (groupId) {
      io.emit("groupMessage", newMessage);
    } else {
      const receiverSocketId = userSocketMap[selectedUserId];
      if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);
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
    const message = await Message.findOneAndUpdate({ _id: id, senderId: req.user._id }, { text, edited: true }, { new: true });
    if (!message) return errorResponse(res, "Message not found or unauthorized", 404);
    io.emit("messageUpdated", message);
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
    if (!message.senderId.equals(req.user._id)) return errorResponse(res, "Unauthorized", 403);

    if (forEveryone) {
      message.deletedForEveryone = true;
      await message.save();
      io.emit("messageDeleted", { messageId: id });
      return successResponse(res, { message: "Deleted for everyone" });
    }

    await message.remove();
    io.emit("messageDeleted", { messageId: id });
    return successResponse(res, { message: "Deleted" });
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
      existing.reaction = reaction;
    } else {
      message.reactions.push({ userId: req.user._id, reaction });
    }
    await message.save();
    io.emit("messageReaction", { messageId: id, reactions: message.reactions });
    return successResponse(res, { message });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndUpdate(id, { pinned: true }, { new: true });
    if (!message) return errorResponse(res, "Message not found", 404);
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
      $or: [{ text: regex }, { media: regex }],
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
      $or: [{ senderId: req.user._id, receiverId: userId }, { senderId: userId, receiverId: req.user._id }],
      media: { $ne: "" },
    }).sort({ createdAt: -1 });
    return successResponse(res, { media });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
