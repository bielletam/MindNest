"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDocContext } from "@/lib/document-context";
import { api } from "@/lib/api";
import type { ChatMessageRecord, ChatSessionWithMessages } from "@/lib/types";
import { ChatWindow } from "./ChatWindow";

export function ChatPageView({ docId }: { docId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");

  const { state, dispatch } = useDocContext();

  const [activeSession, setActiveSession] = useState<ChatSessionWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const loadedSessionId = useRef<string | null>(null);

  // Restore the session from the URL on mount, or when it changes — this is
  // also what reacts to the sidebar navigating between sessions / new chat,
  // and is what survives a page refresh.
  useEffect(() => {
    setSendError(null);
    dispatch({ type: "SET_FLASH_HI", payload: null });

    if (!sessionIdFromUrl) {
      setActiveSession(null);
      loadedSessionId.current = null;
      return;
    }
    if (loadedSessionId.current === sessionIdFromUrl) return;
    loadedSessionId.current = sessionIdFromUrl;
    api
      .fetchSession(sessionIdFromUrl)
      .then(setActiveSession)
      .catch(() => setActiveSession(null));
  }, [sessionIdFromUrl, dispatch]);

  async function handleSend(query: string) {
    setSendError(null);
    const contextDocIds = state.docs.filter((d) => d.inContext).map((d) => d.id);

    if (!activeSession) {
      // First message of a brand-new session — one round trip creates the
      // session and answers the question in a single backend call.
      setPendingUserMessage(query);
      setIsLoading(true);
      try {
        const session = await api.createChatSession(contextDocIds, query);
        loadedSessionId.current = session.id;
        setActiveSession(session);
        const targetDocId = docId || session.document_ids[0] || "";
        router.push(`/document/${targetDocId}/chat?session=${session.id}`);
      } catch {
        setSendError("Sorry, something went wrong. Please try again.");
      } finally {
        setPendingUserMessage(null);
        setIsLoading(false);
      }
      return;
    }

    // Follow-up message in an existing session — optimistically show the
    // user's bubble immediately, then append the assistant's reply.
    const optimisticUserMsg: ChatMessageRecord = {
      id: `local-${Date.now()}`,
      session_id: activeSession.id,
      role: "user",
      content: query,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setActiveSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticUserMsg] } : prev
    );
    setIsLoading(true);
    try {
      const assistantMsg = await api.sendMessage(activeSession.id, query);
      setActiveSession((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, assistantMsg], message_count: prev.message_count + 2 }
          : prev
      );
    } catch {
      const errorMsg: ChatMessageRecord = {
        id: `local-err-${Date.now()}`,
        session_id: activeSession.id,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        sources: null,
        created_at: new Date().toISOString(),
      };
      setActiveSession((prev) => (prev ? { ...prev, messages: [...prev.messages, errorMsg] } : prev));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ChatWindow
      activeSession={activeSession}
      isLoading={isLoading}
      pendingUserMessage={pendingUserMessage}
      sendError={sendError}
      onSend={handleSend}
    />
  );
}
