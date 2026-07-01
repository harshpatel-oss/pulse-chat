import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getCurrentUser, getUserById, searchUsers, updatePrivacySettings, updateLastSeen, getUsersForSidebar, getUserChats } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protectRoute, getCurrentUser);
router.get("/search", protectRoute, searchUsers);
router.get("/sidebar", protectRoute, getUsersForSidebar);
router.get("/chats", protectRoute, getUserChats);
router.get("/:id", protectRoute, getUserById);
router.put("/settings", protectRoute, updatePrivacySettings);
router.patch("/last-seen", protectRoute, updateLastSeen);

export default router;