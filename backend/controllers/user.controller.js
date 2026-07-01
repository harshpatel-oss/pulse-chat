import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getCurrentUser = async (req, res) => {
  return successResponse(res, { user: req.user });
};
  
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshTokens");
    if (!user) return errorResponse(res, "User not found", 404);
    return successResponse(res, { user });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const regex = new RegExp(keyword, "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ fullName: regex }, { email: regex }, { username: regex }],
    }).select("-password -refreshTokens");
    return successResponse(res, { users });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select("-password -refreshTokens");
    const unseenMessages = {};
    const promises = users.map(async (user) => {
      const count = await Message.countDocuments({ senderId: user._id, receiverId: userId, seenBy: { $ne: userId } });
      if (count > 0) unseenMessages[user._id] = count;
    });
    await Promise.all(promises);
    return successResponse(res, { users, unseenMessages });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const { theme, notifications, privacy } = req.body;
    const update = {};
    if (theme) update["settings.theme"] = theme;
    if (notifications !== undefined) update["settings.notifications"] = notifications;
    if (privacy) update["settings.privacy"] = privacy;
    const updatedUser = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password -refreshTokens");
    return successResponse(res, { user: updatedUser });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updateLastSeen = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { lastSeen: Date.now() }, { new: true }).select("-password -refreshTokens");
    return successResponse(res, { user: updatedUser });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $project: {
          participants: ["$senderId", "$receiverId"],
          text: 1,
          media: 1,
          createdAt: 1,
          seenBy: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$participants",
          lastMessage: { $first: "$text" },
          media: { $first: "$media" },
          updatedAt: { $first: "$createdAt" },
        },
      },
    ]);
    return successResponse(res, { chats });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
