// src/api/axiosInstance.js
//
// REWRITE NOTES (item 6 + item 4):
//
// The previous version attached a SECOND response interceptor from inside
// authStore.init() (via initRefreshInterceptor), on top of the base
// interceptor already registered here. Two separate response interceptors
// both reacting to errors is exactly the kind of duplication that causes
// unpredictable double-handling. This version registers exactly one request
// interceptor and exactly one response interceptor, both defined in this
// file, at module load time, permanently — nothing external attaches a
// second one.
//
// Refresh-token contract (item 4):
//   - The access token lives only in memory (see tokenStore below). It is
//     never read from or written to localStorage/sessionStorage.
//   - The refresh token is an httpOnly cookie this code never touches
//     directly; it travels automatically via `withCredentials: true`.
//   - POST /auth/refresh is called from exactly one place: the 401 handler
//     in the response interceptor below. AuthContext calls it once on cold
//     load to rehydrate a session, and that is the ONLY other call site —
//     everything else reaches refresh exclusively through a 401.
//   - If two or more requests fail with 401 at the same time, only one
//     refresh call is made; every other failing request awaits the same
//     in-flight promise and retries once it resolves. This is the
//     `refreshPromise` singleton below.
//   - A successful refresh updates the token and retries the original
//     request — it never logs the user out. Only a FAILED refresh logs the
//     user out (via the registered onAuthFailure callback).
import axios from "axios";
import { API_PATHS } from "./apiPaths";

// ---------------------------------------------------------------------------
// In-memory token store. Deliberately not exported as a raw variable so
// every read/write goes through one place.
// ---------------------------------------------------------------------------
const tokenStore = { accessToken: null };
export const getAccessToken = () => tokenStore.accessToken;
export const setAccessToken = (token) => {
  tokenStore.accessToken = token;
};

// ---------------------------------------------------------------------------
// Auth failure callback — wired once by AuthProvider. Called only when a
// refresh attempt itself fails (expired/invalid/missing refresh cookie),
// never on a successful refresh.
// ---------------------------------------------------------------------------
let onAuthFailure = () => {};
export const registerAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // refresh token travels as an httpOnly cookie
  timeout: 40000,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Single request interceptor: attach the in-memory access token.
// ---------------------------------------------------------------------------
axiosInstance.interceptors.request.use((config) => {
  if (tokenStore.accessToken) {
    config.headers.Authorization = `Bearer ${tokenStore.accessToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response envelope unwrapping.
// The backend's utils/response.js wasn't provided; successResponse(res, x)
// is called as successResponse(res, { user, message }) throughout the
// controllers you shared, so the body is most likely either
// { success, data: {...} } or { success, ...fieldsSpreadAtTopLevel }. We
// support both shapes defensively rather than guessing one.
// ---------------------------------------------------------------------------
const unwrap = (responseData) => {
  if (!responseData || typeof responseData !== "object") return responseData;
  if (responseData.data && typeof responseData.data === "object") {
    return responseData.data;
  }
  const { success, message, ...rest } = responseData;
  if (Object.keys(rest).length > 0) return { ...rest, message };
  return responseData;
};

export const normalizeError = (error) => {
  const status = error.response?.status;
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again.";
  return { status, message, raw: error };
};

// ---------------------------------------------------------------------------
// Refresh queue: at most one /auth/refresh call in flight at any time,
// regardless of how many requests fail with 401 simultaneously.
// ---------------------------------------------------------------------------
let refreshPromise = null;

const performRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = axiosInstance
      .post(API_PATHS.AUTH.REFRESH)
      .then((res) => {
        const data = unwrap(res.data);
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// ---------------------------------------------------------------------------
// Single response interceptor: unwrap success, refresh-and-retry on 401.
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => {
    response.data = unwrap(response.data);
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isRefreshCall = original?.url === API_PATHS.AUTH.REFRESH;

    if (status === 401 && original && !original._retried && !isRefreshCall) {
      original._retried = true;
      try {
        const data = await performRefresh();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        // Refresh itself failed (expired/invalid/missing cookie) — this is
        // the ONLY path that logs the user out. A successful refresh never
        // reaches this branch.
        onAuthFailure();
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

// Exposed only for AuthContext's one legitimate extra call site: the
// cold-load rehydration attempt on app start.
export const refreshAccessToken = () => performRefresh();

export default axiosInstance;
