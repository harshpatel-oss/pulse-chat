// src/api/apiPaths.js
//
// This file is provided by the backend owner and is treated as ground truth
// for every route this frontend calls. Do not add, rename, or guess endpoints
// beyond what's listed here.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_PATHS = {
  // AUTH
  AUTH: {
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    LOGOUT_ALL: `${API_BASE_URL}/auth/logout-all`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile`,
  },
  // USERS
  USERS: {
    ME: `${API_BASE_URL}/users/me`,
    SEARCH: `${API_BASE_URL}/users/search`,
    SIDEBAR: `${API_BASE_URL}/users/sidebar`,
    CHATS: `${API_BASE_URL}/users/chats`,
    BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
    SETTINGS: `${API_BASE_URL}/users/settings`,
    LAST_SEEN: `${API_BASE_URL}/users/last-seen`,
  },
  // MESSAGES
  MESSAGES: {
    USERS: `${API_BASE_URL}/messages/users`,
    SEARCH: `${API_BASE_URL}/messages/search`,
    SHARED_MEDIA: (id) => `${API_BASE_URL}/messages/shared/${id}`,
    GET_MESSAGES: (id) => `${API_BASE_URL}/messages/${id}`,
    GET_GROUP_MESSAGES: (groupId) => `${API_BASE_URL}/messages/group/${groupId}`,
    MARK_SEEN: (id) => `${API_BASE_URL}/messages/mark/${id}`,
    SEND: (id) => `${API_BASE_URL}/messages/send/${id}`,
    EDIT: (id) => `${API_BASE_URL}/messages/edit/${id}`,
    DELETE: (id) => `${API_BASE_URL}/messages/delete/${id}`,
    REACT: (id) => `${API_BASE_URL}/messages/react/${id}`,
    PIN: (id) => `${API_BASE_URL}/messages/pin/${id}`,
    UNPIN: (id) => `${API_BASE_URL}/messages/unpin/${id}`,
  },
  // GROUPS
  GROUPS: {
    CREATE: `${API_BASE_URL}/groups`,
    ALL: `${API_BASE_URL}/groups`,
    DISCOVER: `${API_BASE_URL}/groups/discover`,
    BY_ID: (id) => `${API_BASE_URL}/groups/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/groups/${id}`,
    ADD_MEMBER: (id) => `${API_BASE_URL}/groups/${id}/add-member`,
    REMOVE_MEMBER: (id, memberId) => `${API_BASE_URL}/groups/${id}/remove-member/${memberId}`,
    PROMOTE: (id) => `${API_BASE_URL}/groups/${id}/promote`,
    DEMOTE: (id) => `${API_BASE_URL}/groups/${id}/demote`,
    LEAVE: (id) => `${API_BASE_URL}/groups/${id}/leave`,
    JOIN: (id) => `${API_BASE_URL}/groups/${id}/join`,
    DELETE: (id) => `${API_BASE_URL}/groups/${id}`,
  },
  // AI CHAT
  AI: {
    CONVERSATIONS: `${API_BASE_URL}/chat/ai`,
    CREATE_CONVERSATION: `${API_BASE_URL}/chat/ai`,
    SEND_MESSAGE: `${API_BASE_URL}/chat/ai/message`,
    BY_ID: (id) => `${API_BASE_URL}/chat/ai/${id}`,
    DELETE: (id) => `${API_BASE_URL}/chat/ai/${id}`,
  },
};

export default API_PATHS;
