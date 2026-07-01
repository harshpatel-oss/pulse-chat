// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

import ChatPage from "./pages/Chat/ChatPage";
import AiPage from "./pages/AI/AiPage";
import GroupsPage from "./pages/Groups/GroupsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

import { ThemeProvider } from "./context/ThemeContext";
import { UiProvider } from "./context/UiContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { AiProvider } from "./context/AiContext";
import { GroupProvider } from "./context/GroupContext";

// Providers that only matter once a session exists (chat/ai/groups all
// fetch data and attach socket listeners that need an authenticated user).
// Mounting them only inside the protected tree means a logged-out visitor
// never pays for sockets or API calls these contexts would otherwise make.
function AuthenticatedProviders({ children }) {
  return (
    <ChatProvider>
      <AiProvider>
        <GroupProvider>{children}</GroupProvider>
      </AiProvider>
    </ChatProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UiProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <AuthenticatedProviders>
                      <AppLayout />
                    </AuthenticatedProviders>
                  }
                >
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/ai" element={<AiPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </UiProvider>
    </ThemeProvider>
  );
}
