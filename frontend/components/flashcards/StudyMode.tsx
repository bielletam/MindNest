"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { BackendFlashcard, FlashcardStatus } from "@/lib/types";
import { StudyCompletionScreen } from "./StudyCompletionScreen";

interface Props {
  flashcards: BackendFlashcard[];
  onStatusChange: (id: string, status: FlashcardStatus) => void;
  onRestart: () => void;
  onBrowseOther: () => void;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LastAction {
  card: BackendFlashcard;
  previousStatus: FlashcardStatus;
  indexInQueue: number;
  wasRoundEnded: boolean;
}

export function StudyMode({ flashcards, onStatusChange, onRestart, onBrowseOther }: Props) {
  const [queue, setQueue] = useState<BackendFlashcard[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  // Tracks status changes applied in the current session so round-end
  // recomputation sees fresh data even if the parent re-render hasn't landed yet.
  const localStatuses = useRef<Map<string, FlashcardStatus>>(new Map());
  // Holds the next round's queue while the choice screen is shown.
  const pendingNextQueue = useRef<BackendFlashcard[]>([]);

  useEffect(() => {
    const initial = fisherYates(flashcards.filter((c) => c.status === "still_learning"));
    if (initial.length === 0) {
      setCompleted(true);
    } else {
      setQueue(initial);
      setQueueIndex(0);
      setFlipped(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function effectiveStatus(card: BackendFlashcard): FlashcardStatus {
    return localStatuses.current.get(card.id) ?? card.status;
  }

  function handleRoundEnd() {
    const next = fisherYates(
      flashcards.filter((c) => effectiveStatus(c) === "still_learning")
    );
    if (next.length === 0) {
      setCompleted(true);
    } else {
      // Pause and let the user choose: focus on still-learning or restart all.
      pendingNextQueue.current = next;
      setRoundEnded(true);
    }
  }

  function continueWithStillLearning() {
    setQueue(pendingNextQueue.current);
    setQueueIndex(0);
    setFlipped(false);
    setRoundEnded(false);
  }

  function handleMark(card: BackendFlashcard, newStatus: FlashcardStatus) {
    setApiError("");

    // Snapshot for undo — capture previous status BEFORE overwriting it.
    const previousStatus = effectiveStatus(card);
    localStatuses.current.set(card.id, newStatus);

    api.updateFlashcardStatus(card.id, newStatus).catch((err: Error) => {
      console.error("Failed to persist flashcard status:", err);
      setApiError("Could not save — check your connection.");
    });

    onStatusChange(card.id, newStatus);

    const nextIndex = queueIndex + 1;
    const isLastCard = nextIndex >= queue.length;

    // Save snapshot after we know whether this card ended the round.
    setLastAction({ card, previousStatus, indexInQueue: queueIndex, wasRoundEnded: isLastCard });

    if (!isLastCard) {
      setQueueIndex(nextIndex);
      setFlipped(false);
    } else {
      handleRoundEnd();
    }
  }

  function handleUndo() {
    if (!lastAction) return;
    const { card, previousStatus, indexInQueue, wasRoundEnded } = lastAction;

    // Revert local tracking so queue recomputation sees the old status.
    localStatuses.current.set(card.id, previousStatus);

    // Revert in DB (fire-and-forget).
    api.updateFlashcardStatus(card.id, previousStatus).catch(console.error);

    // Revert parent list so browse mode is consistent.
    onStatusChange(card.id, previousStatus);

    // Go back to the card that was just rated.
    setQueueIndex(indexInQueue);
    setFlipped(false);
    setLastAction(null);

    // If we were on the round-end screen, dismiss it.
    if (wasRoundEnded || roundEnded) setRoundEnded(false);
  }

  // ── Completion screen (all cards known) ──────────────────────────────────────
  if (completed) {
    return (
      <StudyCompletionScreen
        totalCards={flashcards.length}
        onRestart={onRestart}
        onBrowseOther={onBrowseOther}
      />
    );
  }

  // ── Round-end choice screen ───────────────────────────────────────────────────
  if (roundEnded) {
    const knowCount = flashcards.filter((c) => effectiveStatus(c) === "know").length;
    const stillCount = pendingNextQueue.current.length;

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: 40,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            background: "rgba(99,102,241,.15)",
            border: "1px solid var(--mn-accent-mid)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        {/* Heading + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
            Round complete!
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#86efac" }}>{knowCount}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mn-text-3)", textTransform: "uppercase", letterSpacing: ".07em" }}>Know</span>
            </div>
            <div style={{ width: 1, background: "var(--mn-border-2)", alignSelf: "stretch" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#fca5a5" }}>{stillCount}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mn-text-3)", textTransform: "uppercase", letterSpacing: ".07em" }}>Still learning</span>
            </div>
          </div>
        </div>

        {/* Choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
          {lastAction && (
            <button
              onClick={handleUndo}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 13,
                border: "1px solid var(--mn-border-2)",
                background: "transparent",
                color: "var(--mn-text-3)",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9a6 6 0 1 0 1.5-3.9" /><polyline points="3 4 3 9 8 9" />
              </svg>
              Undo last rating
            </button>
          )}
          <button
            onClick={continueWithStillLearning}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 13,
              border: "none",
              background: "var(--mn-accent-grad)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px var(--mn-accent-ring)",
            }}
          >
            Focus on still learning ({stillCount} card{stillCount !== 1 ? "s" : ""})
          </button>
          <button
            onClick={onRestart}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 13,
              border: "1px solid var(--mn-border-2)",
              background: "transparent",
              color: "#cbd5e1",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Restart — go through all {flashcards.length} cards
          </button>
        </div>
      </div>
    );
  }

  if (queue.length === 0) return null;

  const card = queue[queueIndex];
  const position = queueIndex + 1;
  const total = queue.length;

  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    padding: "36px 44px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 20,
    WebkitBackfaceVisibility: "hidden",
    backfaceVisibility: "hidden",
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 22px 22px",
      }}
    >
      {/* Progress bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mn-text-3)" }}>
            Card {position} of {total}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {apiError && (
              <span style={{ fontSize: 12, color: "#f87171" }}>{apiError}</span>
            )}
            {lastAction && (
              <button
                onClick={handleUndo}
                title="Undo last rating"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--mn-border-2)",
                  background: "transparent",
                  color: "var(--mn-text-3)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: ".15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mn-surface-2)"; e.currentTarget.style.color = "#cbd5e1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mn-text-3)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9a6 6 0 1 0 1.5-3.9" />
                  <polyline points="3 4 3 9 8 9" />
                </svg>
                Undo
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 4, background: "var(--mn-surface-2)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(position / total) * 100}%`,
              background: "var(--mn-accent-grad)",
              borderRadius: 4,
              transition: "width .3s ease",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{ flex: 1, minHeight: 0, perspective: 1500, cursor: flipped ? "default" : "pointer", userSelect: "none" }}
        onClick={() => { if (!flipped) setFlipped(true); }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform .55s cubic-bezier(.4,.2,.2,1)",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div style={{ ...faceBase, background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", boxShadow: "0 14px 40px rgba(0,0,0,.3)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Question</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.38, color: "#f1f5f9", maxWidth: 580 }}>{card.front}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 999, background: "var(--mn-surface)", border: "1px solid var(--mn-border-2)", color: "var(--mn-text-3)", fontSize: 12.5, fontWeight: 600 }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="9" r="7" /><path d="M9 12v-3" /><circle cx="9" cy="6" r=".6" fill="currentColor" stroke="none" />
              </svg>
              Tap to reveal answer
            </div>
          </div>

          {/* Back */}
          <div style={{ ...faceBase, transform: "rotateY(180deg)", background: "linear-gradient(150deg,rgba(99,102,241,.2),rgba(139,92,246,.12))", border: "1px solid var(--mn-accent-mid)", boxShadow: "0 14px 40px rgba(0,0,0,.3)", gap: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#a5b4fc" }}>Answer</div>
            <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.42, color: "#f4f6fb", maxWidth: 580 }}>{card.back}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleMark(card, "still_learning"); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 26px", borderRadius: 13, border: "1.5px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.1)", color: "#fca5a5", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: ".15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,.4)"; }}
              >
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l10 10M14 4L4 14" /></svg>
                Still learning
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleMark(card, "know"); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 26px", borderRadius: 13, border: "1.5px solid rgba(34,197,94,.4)", background: "rgba(34,197,94,.1)", color: "#86efac", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: ".15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,.2)"; e.currentTarget.style.borderColor = "rgba(34,197,94,.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,.1)"; e.currentTarget.style.borderColor = "rgba(34,197,94,.4)"; }}
              >
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,9 7,13 15,5" /></svg>
                Know it
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Count hint */}
      <div style={{ flexShrink: 0, textAlign: "center", fontSize: 12, color: "var(--mn-text-3)" }}>
        {flashcards.filter((c) => effectiveStatus(c) === "still_learning").length} still learning
        &nbsp;·&nbsp;
        {flashcards.filter((c) => effectiveStatus(c) === "know").length} know
      </div>
    </div>
  );
}
