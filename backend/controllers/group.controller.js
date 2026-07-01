import { validationResult } from "express-validator";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { successResponse, errorResponse } from "../utils/response.js";
import cloudinary from "../lib/cloudinary.js";

const isAdmin = (group, userId) => group.admins.some((id) => id.equals(userId));

export const createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errorResponse(res, errors.array()[0].msg, 400);

  try {
    const { name, description, memberIds = [], isPrivate = true, onlyAdminsCanMessage = false, avatar } = req.body;
    const members = [req.user._id, ...new Set(memberIds.map((id) => id).filter(Boolean))];
    const admins = [req.user._id];
    const groupData = { name, description, members, admins, isPrivate, onlyAdminsCanMessage, createdBy: req.user._id };

    if (avatar?.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(avatar, { folder: "group_avatars" });
      groupData.avatar = upload.secure_url;
    }

    const group = await Group.create(groupData);
    return successResponse(res, { group }, 201);
  } catch (error) {
  console.error("CREATE GROUP ERROR:");
  console.error(error);
  return errorResponse(res, error.message, 500);
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate("members", "fullName profilePic").populate("admins", "fullName");
    return successResponse(res, { groups });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user._id }).populate("members", "fullName profilePic email").populate("admins", "fullName");
    if (!group) return errorResponse(res, "Group not found or access denied", 404);
    return successResponse(res, { group });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!isAdmin(group, req.user._id)) return errorResponse(res, "Only admins can update group", 403);

    const { name, description, isPrivate, onlyAdminsCanMessage } = req.body;
    if (name) group.name = name;
    if (description) group.description = description;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (onlyAdminsCanMessage !== undefined) group.onlyAdminsCanMessage = onlyAdminsCanMessage;

    if (req.body.avatar?.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(req.body.avatar, { folder: "group_avatars" });
      group.avatar = upload.secure_url;
    }

    await group.save();
    return successResponse(res, { group });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const addMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!isAdmin(group, req.user._id)) return errorResponse(res, "Only admins can add members", 403);

    if (!group.members.some((id) => id.equals(memberId))) {
      group.members.push(memberId);
    }
    await group.save();
    return successResponse(res, { group });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!isAdmin(group, req.user._id)) return errorResponse(res, "Only admins can remove members", 403);

    group.members = group.members.filter((id) => id.toString() !== memberId);
    group.admins = group.admins.filter((id) => id.toString() !== memberId);
    await group.save();
    return successResponse(res, { group });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);

    group.members = group.members.filter((id) => !id.equals(req.user._id));
    group.admins = group.admins.filter((id) => !id.equals(req.user._id));
    if (!group.members.length) {
      await group.remove();
      return successResponse(res, { message: "Group deleted because no members remained" });
    }
    await group.save();
    return successResponse(res, { group, message: "Left group successfully" });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const promoteAdmin = async (req, res) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!isAdmin(group, req.user._id)) return errorResponse(res, "Only admins can promote members", 403);
    if (!group.members.some((id) => id.equals(memberId))) return errorResponse(res, "Member must belong to group", 400);

    if (!group.admins.some((id) => id.equals(memberId))) group.admins.push(memberId);
    await group.save();
    return successResponse(res, { group });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return errorResponse(res, "Group not found", 404);
    if (!isAdmin(group, req.user._id)) return errorResponse(res, "Only admins can delete group", 403);

    await group.remove();
    return successResponse(res, { message: "Group deleted successfully" });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
