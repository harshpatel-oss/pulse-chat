// src/context/AiContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import aiService from "../services/aiService";

const AiContext = createContext(null);

export function AiProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const data = await aiService.getConversations();
      setConversations(data.conversations ?? []);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const openConversation = useCallback(async (id) => {
    setIsLoadingActive(true);
    setActiveConversation(null);
    try {
      const data = await aiService.getConversationById(id);
      setActiveConversation(data.conversation);
    } finally {
      setIsLoadingActive(false);
    }
  }, []);

  const createConversation = useCallback(async (title = "New chat") => {
    const data = await aiService.createConversation(title);
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveConversation(data.conversation);
    return data.conversation;
  }, []);

  const deleteConversation = useCallback(async (id) => {
    await aiService.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    setActiveConversation((prev) => (prev?._id === id ? null : prev));
  }, []);

  // The backend call is a single blocking request (no streaming endpoint
  // exists). We optimistically push the user's message immediately, then
  // show a typing indicator while we wait for the full reply.
  const sendMessage = useCallback(async (conversationId, content) => {
    setActiveConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              { role: "user", content, createdAt: new Date().toISOString(), _optimistic: true },
            ],
          }
        : prev
    );
    setIsAiTyping(true);

    try {
      const data = await aiService.sendMessage(conversationId, content);
      setActiveConversation(data.conversation);
      setConversations((prev) =>
        prev.map((c) => (c._id === data.conversation._id ? data.conversation : c))
      );
      return data;
    } finally {
      setIsAiTyping(false);
    }
  }, []);

  const clearActive = useCallback(() => setActiveConversation(null), []);

  const value = useMemo(
    () => ({
      conversations,
      isLoadingConversations,
      activeConversation,
      isLoadingActive,
      isAiTyping,
      loadConversations,
      openConversation,
      createConversation,
      deleteConversation,
      sendMessage,
      clearActive,
    }),
    [
      conversations,
      isLoadingConversations,
      activeConversation,
      isLoadingActive,
      isAiTyping,
      loadConversations,
      openConversation,
      createConversation,
      deleteConversation,
      sendMessage,
      clearActive,
    ]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAi must be used within an AiProvider");
  return ctx;
}
