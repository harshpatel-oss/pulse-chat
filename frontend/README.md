# Pulse — Chat Frontend

A React 19 + Vite frontend built against the provided Express/MongoDB/Socket.IO
backend, using React Context + custom hooks for all client-side state.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL / VITE_SOCKET_URL if needed
npm run dev
```

Requires your backend running locally on the port referenced in `.env`
(default assumes `http://localhost:5000`).

## Architecture

### State management: React Context, not Zustand

Every store was migrated to a Context + custom hook pair under `src/context/`:

- `ThemeContext` — light/dark mode
- `UiContext` — toasts, mobile single-pane view state
- `AuthContext` — session, login/signup/logout, profile
- `ChatContext` — direct-message sidebar, active thread, messages, typing, presence
- `AiContext` — AI conversation list + active conversation
- `GroupContext` — groups list, active group, group messages, member management

**Tradeoff, stated plainly:** Context re-renders every consumer of a given
provider when any value in that provider's state changes. A single new
chat message or a typing-indicator flicker re-renders every component that
calls `useChat()`, not just the message list. Zustand (the previous
implementation) only re-renders components that subscribed to the specific
slice that changed. This is a real performance regression for a chat app
that updates frequently — it was requested explicitly and implemented as
asked, with `useCallback`/`useMemo` used throughout to at least keep
function/object identity stable for memoized children, but it does not
eliminate the broader re-render cost. If message-list scroll performance
or typing-indicator responsiveness degrades noticeably under load, this is
the first place to look.

`ChatContext` and `GroupContext` both use a ref-mirror pattern
(`activeChatUserRef` / `activeGroupRef`) to avoid stale closures inside their
socket event listeners, which are attached once per provider lifetime rather
than once per active conversation. `useState` closures do not automatically
see updated values the way Zustand's `get()` does — this is the explicit fix
for that gap.

### Axios client: single request interceptor, single response interceptor

`src/api/axiosInstance.js` was rewritten from scratch:

- Exactly one request interceptor (attaches the in-memory access token).
- Exactly one response interceptor (unwraps the response envelope, and on a
  401 retries the original request after a refresh).
- A single shared `refreshPromise` ensures that if multiple requests fail
  with 401 simultaneously, only one `POST /auth/refresh` call is made — every
  other failing request awaits the same in-flight promise and retries once
  it resolves.
- `AuthContext`'s cold-load rehydration (the one-time refresh attempt on app
  boot) calls the exact same `refreshAccessToken()` singleton the
  interceptor uses internally, so a 401 that races with app boot shares one
  request instead of firing two.
- A successful refresh never logs the user out. Only a *failed* refresh
  attempt (expired/invalid/missing cookie) triggers `onAuthFailure`, which
  clears the session.
- `authService.js` deliberately has no `refresh()` method anymore — there is
  exactly one way to get a new access token, and it isn't reachable from
  arbitrary call sites.

### Theme: fixed dark-mode-stuck bug

The previous implementation added a `.light` class for light mode while
`tailwind.config.js` declared `darkMode: "class"` — which only activates
Tailwind's `dark:` variant when a `dark` class is present. The two
conventions directly contradicted each other. Rewritten to the standard
convention: `html.dark` means dark mode, its absence means light mode.
Colors are now CSS variables (`--color-base`, `--color-surface`, etc.) that
flip based on the `dark` class, so existing semantic Tailwind classes
(`bg-base`, `text-ink`, etc.) work correctly in both themes without needing
per-component `dark:` prefixes.

## Removed: Notifications feature

Deleted entirely, frontend-side:
- `src/services/notificationService.js`
- `src/store/notificationStore.js` (the whole `store/` directory is gone)
- `src/components/notification/` (entire directory)
- `src/pages/Settings/NotificationsPage.jsx`
- The `/notifications` route, the nav-rail "Alerts" item, the mobile tab,
  and the bell-icon unread badge.
- `API_PATHS.NOTIFICATIONS` removed from `src/api/apiPaths.js`.

**This was not removed on the backend** — I don't have your backend project
open in this environment, only the controller/model files you shared earlier
as reference. If you want it gone server-side too, based on those files:

- Delete `notification.controller.js`, `notification.model.js`, and whatever
  `notification.route.js` mounts `/api/notifications`.
- Remove the `app.use("/api/notifications", notificationRouter)` line (and
  its import) from `server.js`.
- Nothing else in any other controller ever calls `Notification.create()`,
  so there's no creation logic elsewhere to clean up — the feature was only
  ever read/update on the backend, never actually triggered by anything.

## Fixed in this pass

- **"View profile" was a dead button** — `ChatHeader.jsx` had a "View
  profile" menu item with no `onClick` at all. Now opens
  `UserProfileModal`, backed by the real `GET /api/users/:id` endpoint.
- **The in-chat search icon was a dead button** — it had `onClick={onOpenSearch}`
  but no parent component ever passed an `onOpenSearch` prop, so clicking it
  silently did nothing. Now opens `InChatSearchModal`, which calls
  `messageService.search` and scopes results to the open conversation
  client-side (see the `searchMessages` backend bug note below).
- **Edit Profile appeared broken/frozen** — `react-hook-form`'s
  `defaultValues` are captured once at first render. Since `AuthContext`
  resolves its cold-load session check asynchronously, `user` was often
  still `null` on `SettingsPage`'s first render, freezing the form at empty
  strings even after the real profile data arrived. Fixed with a
  `useEffect` that calls `profileForm.reset(...)` whenever `user` changes.
- **Change Password** now validates the new password's minimum length
  client-side before submitting, and surfaces field-level errors instead of
  only a generic toast.
- Removed the "Push notifications" settings toggle, since it gated a feature
  that no longer exists on the frontend (it controlled `settings.notifications`,
  a boolean the backend still accepts — see below — but nothing in this
  frontend reads or acts on it anymore).
- **Socket listener attachment could silently never happen.** `ChatContext`
  and `GroupContext` each attach their socket listeners in a `useEffect`
  that bailed out permanently if `getSocket()` returned `null` on the first
  run — and since none of that effect's dependencies change when the socket
  later connects, the listeners would simply never attach for that session
  if the timing was ever off (online presence, incoming messages, and
  typing indicators would all silently stop working until a full page
  reload). In practice the existing render order usually avoided this
  (`ProtectedRoute` only mounts these providers after the cold-load session
  check — and therefore `connectSocket()` — has already resolved), but
  relying on that ordering forever is fragile. Both effects now retry on a
  short interval until the socket exists, rather than giving up silently.

## Known backend issues (reference-only — I don't have your backend project
open here, so these are documented for you to patch, not fixed directly)

- **`changePassword` in `auth.controller.js` has no try/catch** around its
  body, unlike every other function in that file. If `bcrypt.compare`,
  `bcrypt.hash`, or `user.save()` throws, Express has nothing to catch it
  here — the request can hang or crash instead of returning a clean 500.
- **No route files were ever provided** — `src/api/apiPaths.js` is treated
  as ground truth per your explicit instruction; some paths/methods are
  best-effort matches against the controllers shared and have not been
  verified against an actual `*.route.js` file.
- **Group message history**: there is no REST endpoint that returns a
  group's past messages (`getMessages` only filters by
  `senderId`/`receiverId`, never `groupId`). The Groups page only shows
  messages received live via Socket.IO while connected, and says so in the UI.
- **`Message.remove()` / `Group.remove()`**: `deleteMessage` (for
  `forEveryone:false`), `leaveGroup`, and `deleteGroup` call the Mongoose v6
  `.remove()` API, removed in Mongoose 7+. On a modern Mongoose version
  these will throw a 500. The frontend surfaces a toast rather than
  crashing, but the action itself won't succeed server-side until the
  backend swaps in `deleteOne()` / `findByIdAndDelete()`.
- **`searchMessages` keyword filter is dead code**: a duplicate `$or` key
  in one object literal means the second `$or` (sender/receiver scoping)
  silently overwrites the first (text/media keyword match) — the keyword
  filter is never actually applied server-side; the endpoint just returns
  all of the user's messages. The frontend applies a client-side filter on
  top as a correctness safety net.
- **Empty-string updates are silently ignored** in both `updateProfile`
  (`auth.controller.js`) and `updateGroup` (`group.controller.js`) — both
  use `if (field) target.field = field`, so saving an empty string to clear
  `bio`, `status`, or a group's `description` does nothing. The field keeps
  its old value. Not something the frontend can route around; needs
  `if (field !== undefined)` server-side.
- **Password reset email link** points at the backend's own host
  (`forgotPassword` builds it from `req.protocol`/`req.get('host')`, not
  `CLIENT_URL`), so the emailed link may open the API server instead of this
  frontend unless that's changed server-side. `ResetPassword.jsx` still
  works correctly as long as the `?token=` query string reaches this app
  however the person gets here.
- **Response envelope** wasn't visible (`utils/response.js` not provided);
  `src/api/axiosInstance.js` defensively unwraps both
  `{ success, data: {...} }` and `{ success, ...fields }` shapes.

## Tech stack

React 19, Vite, React Router, Axios, Tailwind CSS, React Context (no external
state library), Socket.IO client, React Hook Form, Framer Motion,
React Markdown + remark-gfm, react-syntax-highlighter.
