"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { BackendFlashcard, FlashcardStatus } from "@/lib/types";
import { GenerationScopePicker } from "./GenerationScopePicker";
import { FlashcardDeck } from "./FlashcardDeck";
import { StudyMode } from "./StudyMode";

type Mode = "browse" | "study";

interface Props {
  docId: string;
}

export function FlashcardsView({ docId }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState<BackendFlashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("browse");
  // Incrementing this key remounts StudyMode, resetting its internal queue/state.
  const [studyKey, setStudyKey] = useState(0);

  useEffect(() => {
    api
      .fetchFlashcards(docId)
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  function handleGenerated(newCards: BackendFlashcard[]) {
    setCards((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const fresh = newCards.filter((c) => !existingIds.has(c.id));
      return [...prev, ...fresh];
    });
  }

  // Called by StudyMode each time a card's status is rated.
  const handleStatusChange = useCallback((id: string, status: FlashcardStatus) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }, []);

  // Called by StudyCompletionScreen → "Restart all flashcards".
  async function handleRestart() {
    try {
      const reset = await api.resetFlashcards(docId);
      setCards(reset);
      // Bump key so StudyMode remounts with a fresh queue (all cards again).
      setStudyKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to reset flashcards:", err);
    }
  }

  const tabBtn = (label: string, target: Mode): React.ReactNode => {
    const active = mode === target;
    return (
      <button
        onClick={() => setMode(target)}
        style={{
          padding: "7px 18px",
          borderRadius: 999,
          border: "none",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: ".15s",
          background: active ? "var(--mn-accent-grad)" : "var(--mn-surface-2)",
          color: active ? "#fff" : "var(--mn-text-2)",
          boxShadow: active ? "0 2px 10px var(--mn-accent-ring)" : "none",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 18,
        overflow: "hidden",
      }}
    >
      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexShrink: 0,
          background: "var(--mn-surface)",
          border: "1px solid var(--mn-border)",
          borderRadius: 18,
          padding: "12px 16px",
        }}
      >
        {tabBtn("Browse all cards", "browse")}
        {tabBtn("Study", "study")}
      </div>

      {mode === "browse" && (
        <>
          <GenerationScopePicker docId={docId} onGenerated={handleGenerated} />
          <FlashcardDeck
            docId={docId}
            cards={cards}
            loading={loading}
            onCardsChange={setCards}
          />
        </>
      )}

      {mode === "study" && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: "var(--mn-surface)",
            border: "1px solid var(--mn-border)",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Study panel header */}
          <div
            style={{
              height: 52,
              flexShrink: 0,
              borderBottom: "1px solid var(--mn-border)",
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              gap: 8,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6,4 14,9 6,14" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mn-text-3)" }}>
              Study mode
            </span>
            <span style={{ fontSize: 12, color: "#56627a", marginLeft: 4 }}>
              · {cards.filter((c) => c.status === "still_learning").length} still learning
            </span>
          </div>

          <StudyMode
            key={studyKey}
            flashcards={cards}
            onStatusChange={handleStatusChange}
            onRestart={handleRestart}
            onBrowseOther={() => router.push("/dashboard")}
          />
        </div>
      )}
    </div>
  );
}
