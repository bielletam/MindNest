"use client";

import { useRouter } from "next/navigation";
import { useDocContext } from "@/lib/document-context";

export function FlashcardDeck({ docId }: { docId: string }) {
  const { state, dispatch } = useDocContext();
  const router = useRouter();
  const cards = state.cards;

  return (
    <main
      style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        background: "var(--mn-surface)", border: "1px solid var(--mn-border)",
        borderRadius: 18, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--mn-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            onClick={() => router.push(`/document/${docId}/chat`)}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4l-5 5 5 5" /></svg>
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.01em", color: "#f8fafc" }}>Flashcards</div>
            <div style={{ fontSize: 11.5, color: "var(--mn-text-3)" }}>{cards.length} cards · tap a card to flip</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <button
            onClick={() => dispatch({ type: "SHUFFLE_CARDS" })}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", color: "#cbd5e1", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
            Shuffle
          </button>
          <button
            onClick={() => dispatch({ type: "TOGGLE_STUDY_MODE" })}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 15px", borderRadius: 999,
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              ...(state.studyMode
                ? { background: "var(--mn-accent-grad)", color: "#fff", border: "1px solid transparent", boxShadow: "0 3px 12px var(--mn-accent-ring)" }
                : { background: "var(--mn-surface-2)", color: "#cbd5e1", border: "1px solid var(--mn-border-2)" }),
            }}
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="6,4 14,9 6,14" /></svg>
            Study Mode
          </button>
        </div>
      </div>

      {/* Browse mode */}
      {!state.studyMode && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, maxWidth: 800, margin: "0 auto", padding: "24px 26px 40px" }}>
            {cards.map((card) => {
              const flipped = !!state.flipped[card.id];
              return (
                <div
                  key={card.id}
                  onClick={() => dispatch({ type: "TOGGLE_FLIP", payload: card.id })}
                  style={{ perspective: 1100, height: 178, cursor: "pointer", userSelect: "none" }}
                >
                  <div
                    style={{
                      position: "relative", width: "100%", height: "100%",
                      transition: "transform .55s cubic-bezier(.4,.2,.2,1)",
                      transformStyle: "preserve-3d",
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden",
                        background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", borderRadius: 16,
                        padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: card.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Question</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#e8edf5" }}>{card.q}</div>
                      <div style={{ fontSize: 10.5, color: "var(--mn-text-3)" }}>Tap to flip ↩</div>
                    </div>
                    {/* Back */}
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "linear-gradient(150deg,rgba(99,102,241,.2),rgba(139,92,246,.12))",
                        border: "1px solid var(--mn-accent-mid)", borderRadius: 16,
                        padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#a5b4fc" }}>Answer</div>
                      <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.46, color: "#eef1f8" }}>{card.a}</div>
                      <div style={{ fontSize: 10.5, color: "var(--mn-text-2)" }}>{card.src}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Study mode */}
      {state.studyMode && cards.length > 0 && (() => {
        const cur = cards[state.studyIndex];
        return (
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, padding: 28 }}>
            <div
              onClick={() => dispatch({ type: "STUDY_FLIP" })}
              style={{ perspective: 1500, width: "100%", maxWidth: 540, height: 330, cursor: "pointer", userSelect: "none" }}
            >
              <div
                style={{
                  position: "relative", width: "100%", height: "100%",
                  transition: "transform .6s cubic-bezier(.4,.2,.2,1)",
                  transformStyle: "preserve-3d",
                  transform: state.studyFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  style={{
                    position: "absolute", inset: 0,
                    WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden",
                    background: "var(--mn-surface-2)", border: "1px solid var(--mn-border-2)", borderRadius: 22,
                    padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20,
                    boxShadow: "0 14px 40px rgba(0,0,0,.32)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cur.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--mn-text-3)" }}>Question</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.35, color: "#f1f5f9" }}>{cur.q}</div>
                  <div style={{ fontSize: 12, color: "var(--mn-text-3)" }}>Click to reveal answer</div>
                </div>
                <div
                  style={{
                    position: "absolute", inset: 0,
                    WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: "linear-gradient(150deg,rgba(99,102,241,.22),rgba(139,92,246,.14))",
                    border: "1px solid var(--mn-accent-mid)", borderRadius: 22,
                    padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 18,
                    boxShadow: "0 14px 40px rgba(0,0,0,.32)",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#a5b4fc" }}>Answer</div>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.4, color: "#f4f6fb" }}>{cur.a}</div>
                  <div style={{ fontSize: 12, color: "var(--mn-text-2)" }}>{cur.src}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => dispatch({ type: "STUDY_PREV" })}
                style={{ width: 42, height: 42, borderRadius: 13, border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4l-5 5 5 5" /></svg>
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", minWidth: 68, textAlign: "center" }}>
                {state.studyIndex + 1} / {cards.length}
              </span>
              <button
                onClick={() => dispatch({ type: "STUDY_NEXT" })}
                style={{ width: 42, height: 42, borderRadius: 13, border: "1px solid var(--mn-border-2)", background: "var(--mn-surface-2)", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l5 5-5 5" /></svg>
              </button>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
