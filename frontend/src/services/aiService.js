// src/services/aiService.js
import axiosInstance from "../api/axiosInstance";
import { API_PATHS } from "../api/apiPaths";

export const aiService = {
  getConversations: () =>
    axiosInstance.get(API_PATHS.AI.CONVERSATIONS).then((r) => r.data),

  getConversationById: (id) =>
    axiosInstance.get(API_PATHS.AI.BY_ID(id)).then((r) => r.data),

  createConversation: (title) =>
    axiosInstance.post(API_PATHS.AI.CREATE_CONVERSATION, { title }).then((r) => r.data),

  // addAIMessage is a single blocking call — Gemini responds synchronously,
  // there's no SSE/streaming endpoint on the backend. Returns
  // { conversation, aiResponse } once the full reply is ready. The "typing"
  // animation in the UI is therefore a client-side simulated delay/shimmer,
  // not a real token stream.
  sendMessage: (conversationId, content) =>
    axiosInstance
      .post(API_PATHS.AI.SEND_MESSAGE, { conversationId, content })
      .then((r) => r.data),

  deleteConversation: (id) =>
    axiosInstance.delete(API_PATHS.AI.DELETE(id)).then((r) => r.data),
};

export default aiService;
