import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createGroupValidator, groupMemberValidator } from "../validators/group.validator.js";
import {
  createGroup,
  getMyGroups,
  getPublicGroups,
  getGroupById,
  updateGroup,
  addMember,
  removeMember,
  leaveGroup,
  promoteAdmin,
  demoteAdmin,
  deleteGroup,
  joinPublicGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroupValidator, createGroup);
router.get("/", protectRoute, getMyGroups);
router.get("/discover", protectRoute, getPublicGroups);
router.get("/:id", protectRoute, getGroupById);
router.put("/:id", protectRoute, updateGroup);
router.post("/:id/add-member", protectRoute, groupMemberValidator, addMember);
router.delete("/:id/remove-member/:memberId", protectRoute, removeMember);
router.post("/:id/promote", protectRoute, groupMemberValidator, promoteAdmin);
router.post("/:id/demote", protectRoute, groupMemberValidator, demoteAdmin);
router.post("/:id/leave", protectRoute, leaveGroup);
router.post("/:id/join", protectRoute, joinPublicGroup);
router.delete("/:id", protectRoute, deleteGroup);

export default router;

