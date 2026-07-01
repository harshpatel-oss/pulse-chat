// src/services/authService.js
import axiosInstance from "../api/axiosInstance";
import { API_PATHS } from "../api/apiPaths";

export const authService = {
  signup: (payload) => axiosInstance.post(API_PATHS.AUTH.SIGNUP, payload).then((r) => r.data),

  login: (payload) => axiosInstance.post(API_PATHS.AUTH.LOGIN, payload).then((r) => r.data),

  logout: () => axiosInstance.post(API_PATHS.AUTH.LOGOUT).then((r) => r.data),

  logoutAll: () => axiosInstance.post(API_PATHS.AUTH.LOGOUT_ALL).then((r) => r.data),

  // NOTE: there is deliberately no refresh() method here. Refreshing the
  // access token must always go through axiosInstance.refreshAccessToken(),
  // which de-dupes concurrent calls behind a single in-flight promise. A
  // second, independent path to POST /auth/refresh (like this used to be)
  // would let a cold-load rehydration race a 401-triggered refresh and fire
  // two separate requests instead of sharing one.

  forgotPassword: (email) =>
    axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }).then((r) => r.data),

  resetPassword: (token, password) =>
    axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password }).then((r) => r.data),

  changePassword: (currentPassword, newPassword) =>
    axiosInstance
      .put(API_PATHS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword })
      .then((r) => r.data),

  // updateProfile controller expects base64 data URLs for images (it checks
  // `.startsWith("data:")`), not multipart/form-data. Caller is responsible
  // for converting a File to base64 before calling this.
  updateProfile: (payload) =>
    axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, payload).then((r) => r.data),
};

export default authService;
