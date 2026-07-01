// src/services/userService.js
import axiosInstance from "../api/axiosInstance";
import { API_PATHS } from "../api/apiPaths";

export const userService = {
  getMe: () => axiosInstance.get(API_PATHS.USERS.ME).then((r) => r.data),

  search: (query) =>
    axiosInstance.get(API_PATHS.USERS.SEARCH, { params: { q: query } }).then((r) => r.data),

  // Sidebar returns { users, unseenMessages }. unseenMessages is keyed by
  // the OTHER user's id -> count, per getUsersForSidebar in user.controller.js.
  getSidebar: () => axiosInstance.get(API_PATHS.USERS.SIDEBAR).then((r) => r.data),

  // getUserChats aggregation returns items shaped like:
  // { _id: [senderId, receiverId], lastMessage, media, updatedAt }
  // _id is NOT a clean partner id — it's the unordered pair from $group.
  // chatStore is responsible for resolving the "other" participant.
  getChats: () => axiosInstance.get(API_PATHS.USERS.CHATS).then((r) => r.data),

  getUserById: (id) => axiosInstance.get(API_PATHS.USERS.BY_ID(id)).then((r) => r.data),

  // updatePrivacySettings only accepts { theme, notifications, privacy } —
  // NOT name/bio/avatar. Use authService.updateProfile for those.
  updateSettings: (payload) =>
    axiosInstance.put(API_PATHS.USERS.SETTINGS, payload).then((r) => r.data),

  pingLastSeen: () => axiosInstance.patch(API_PATHS.USERS.LAST_SEEN).then((r) => r.data),
};

export default userService;
