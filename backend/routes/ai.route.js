import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";

import {
  getAIConversations,
  getAIConversationById,
  createAIConversation,
  addAIMessage,
  deleteAIConversation
} from "../controllers/ai.controller.js";

const router = express.Router();


router.use((req, res, next) => {
  console.log("AI ROUTER HIT:", req.method, req.url);
  next();
});

router.get("/", protectRoute, getAIConversations);
router.post("/", protectRoute, createAIConversation);

router.post("/message", protectRoute, addAIMessage);
// router.post("/message", (req, res) => {
//   res.send("ROUTE WORKS");
// });

router.get("/:id", protectRoute, getAIConversationById);
router.delete("/:id", protectRoute, deleteAIConversation);

export default router;