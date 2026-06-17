"use client";

interface Props {
  totalCards: number;
  onRestart: () => void;
  onBrowseOther: () => void;
}

export function StudyCompletionScreen({ totalCards, onRestart, onBrowseOther }: Props) {
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
      {/* Trophy icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.2))",
          border: "1px solid var(--mn-accent-mid)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 32px var(--mn-accent-ring)",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
          <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
          <path d="M6 9a6 6 0 0 0 12 0V3H6v6z" />
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>
          You know all {totalCards} flashcard{totalCards !== 1 ? "s" : ""}!
        </div>
        <div style={{ fontSize: 14, color: "var(--mn-text-3)", maxWidth: 320 }}>
          Great work. Come back to keep the knowledge fresh, or start over to drill them again.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        <button
          onClick={onRestart}
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
          Restart all flashcards
        </button>
        <button
          onClick={onBrowseOther}
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
          Study a different document
        </button>
      </div>
    </div>
  );
}
