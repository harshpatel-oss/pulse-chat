import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessages,
  getGroupMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  pinMessage,
  unpinMessage,
  searchMessages,
  getSharedMedia,
} from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/search", protectRoute, searchMessages);
messageRouter.get("/shared/:id", protectRoute, getSharedMedia);
messageRouter.get("/group/:groupId", protectRoute, getGroupMessages);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.put("/edit/:id", protectRoute, editMessage);
messageRouter.delete("/delete/:id", protectRoute, deleteMessage);
messageRouter.post("/react/:id", protectRoute, reactToMessage);
messageRouter.post("/pin/:id", protectRoute, pinMessage);
messageRouter.post("/unpin/:id", protectRoute, unpinMessage);

export default messageRouter;