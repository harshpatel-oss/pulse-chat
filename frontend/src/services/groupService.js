// src/services/groupService.js
import axiosInstance from "../api/axiosInstance";
import { API_PATHS } from "../api/apiPaths";

export const groupService = {
  create: (payload) => axiosInstance.post(API_PATHS.GROUPS.CREATE, payload).then((r) => r.data),

  getMyGroups: () => axiosInstance.get(API_PATHS.GROUPS.ALL).then((r) => r.data),

  discoverPublicGroups: (page = 1, limit = 20, search = "") =>
    axiosInstance
      .get(API_PATHS.GROUPS.DISCOVER, { params: { page, limit, search } })
      .then((r) => r.data),

  getById: (id) => axiosInstance.get(API_PATHS.GROUPS.BY_ID(id)).then((r) => r.data),

  update: (id, payload) =>
    axiosInstance.put(API_PATHS.GROUPS.UPDATE(id), payload).then((r) => r.data),

  addMember: (id, memberId) =>
    axiosInstance.post(API_PATHS.GROUPS.ADD_MEMBER(id), { memberId }).then((r) => r.data),

  removeMember: (id, memberId) =>
    axiosInstance.delete(API_PATHS.GROUPS.REMOVE_MEMBER(id, memberId)).then((r) => r.data),

  promote: (id, memberId) =>
    axiosInstance.post(API_PATHS.GROUPS.PROMOTE(id), { memberId }).then((r) => r.data),

  demote: (id, memberId) =>
    axiosInstance.post(API_PATHS.GROUPS.DEMOTE(id), { memberId }).then((r) => r.data),

  leave: (id) => axiosInstance.post(API_PATHS.GROUPS.LEAVE(id)).then((r) => r.data),

  join: (id) => axiosInstance.post(API_PATHS.GROUPS.JOIN(id)).then((r) => r.data),

  delete: (id) => axiosInstance.delete(API_PATHS.GROUPS.DELETE(id)).then((r) => r.data),
};

export default groupService;

