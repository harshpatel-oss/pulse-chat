import { queryGemini } from "../ai/gemini.js";
import AIConversation from "../models/aiconversation.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getAIConversations = async (req, res) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return successResponse(res, { conversations });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getAIConversationById = async (req, res) => {
  try {
    const conversation = await AIConversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return errorResponse(res, "Conversation not found", 404);
    return successResponse(res, { conversation });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const createAIConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await AIConversation.create({ userId: req.user._id, title, messages: [] });
    return successResponse(res, { conversation }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const addAIMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const conversation = await AIConversation.findOne({ _id: conversationId, userId: req.user._id });
    if (!conversation) return errorResponse(res, "Conversation not found", 404);
    
    conversation.messages.push({
  role: "user",
  content
});

const history = conversation.messages
.slice(-20)
.map((msg) => ({
role: msg.role === "assistant" ? "model" : "user",
parts: [{ text: msg.content }],
}));

const aiResponse = await queryGemini(history);

    console.log(aiResponse)
    conversation.messages.push({ role: "assistant", content: aiResponse });
    await conversation.save();
   
    return successResponse(res, { conversation, aiResponse });
  } catch (error) {
    return errorResponse(res, error.message, 500);
    console.log(error);
  }
};

export const deleteAIConversation = async (req, res) => {
  try {
    const conversation = await AIConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return errorResponse(res, "Conversation not found", 404);
    return successResponse(res, { message: "Conversation deleted" });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
