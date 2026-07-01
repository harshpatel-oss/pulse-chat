// src/services/messageService.js
import axiosInstance from "../api/axiosInstance";
import { API_PATHS } from "../api/apiPaths";

export const messageService = {
  getUsersForSidebar: () => axiosInstance.get(API_PATHS.MESSAGES.USERS).then((r) => r.data),

  search: (query) =>
    axiosInstance.get(API_PATHS.MESSAGES.SEARCH, { params: { q: query } }).then((r) => {
      const messages = r.data?.messages ?? [];
      if (!query) return { messages };
      const needle = query.toLowerCase();
      return { messages: messages.filter((m) => m.text?.toLowerCase().includes(needle)) };
    }),

  getSharedMedia: (userId) =>
    axiosInstance.get(API_PATHS.MESSAGES.SHARED_MEDIA(userId)).then((r) => r.data),

  getMessages: (userId, page = 1, limit = 40) =>
    axiosInstance
      .get(API_PATHS.MESSAGES.GET_MESSAGES(userId), { params: { page, limit } })
      .then((r) => r.data),

  getGroupMessages: (groupId, page = 1, limit = 40) =>
    axiosInstance
      .get(API_PATHS.MESSAGES.GET_GROUP_MESSAGES(groupId), { params: { page, limit } })
      .then((r) => r.data),

  markSeen: (messageId) =>
    axiosInstance.put(API_PATHS.MESSAGES.MARK_SEEN(messageId)).then((r) => r.data),

  sendDirect: (receiverId, { text, image, replyTo }) =>
    axiosInstance
      .post(API_PATHS.MESSAGES.SEND(receiverId), { text, image, replyTo })
      .then((r) => r.data),

  sendGroup: (groupId, { text, image, replyTo }) =>
    axiosInstance
      .post(API_PATHS.MESSAGES.SEND(groupId), { text, image, replyTo, groupId })
      .then((r) => r.data),

  editMessage: (messageId, text) =>
    axiosInstance.put(API_PATHS.MESSAGES.EDIT(messageId), { text }).then((r) => r.data),

  deleteMessage: (messageId, forEveryone) =>
    axiosInstance
      .delete(API_PATHS.MESSAGES.DELETE(messageId), { data: { forEveryone } })
      .then((r) => r.data),

  react: (messageId, reaction) =>
    axiosInstance.post(API_PATHS.MESSAGES.REACT(messageId), { reaction }).then((r) => r.data),

  pin: (messageId) => axiosInstance.post(API_PATHS.MESSAGES.PIN(messageId)).then((r) => r.data),

  unpin: (messageId) =>
    axiosInstance.post(API_PATHS.MESSAGES.UNPIN(messageId)).then((r) => r.data),
};

export default messageService;

