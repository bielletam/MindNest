"use client";

interface Props {
  score: number;
  total: number;
  onRetake: () => void;
  onBrowse: () => void;
}

export function QuizResultScreen({ score, total, onRetake, onBrowse }: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const message =
    pct >= 80
      ? "Great work!"
      : pct >= 60
      ? "Good effort — review the ones you missed."
      : "Keep studying — try again after reviewing the material.";

  const accentColor = pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171";

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
      {/* Score circle */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: `4px solid ${accentColor}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `${accentColor}14`,
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 900, color: accentColor, lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mn-text-3)", marginTop: 2 }}>
          {score} / {total}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{message}</div>
        <div style={{ fontSize: 14, color: "var(--mn-text-3)", lineHeight: 1.6 }}>
          You answered {score} out of {total} question{total !== 1 ? "s" : ""} correctly.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onRetake}
          style={{
            padding: "11px 26px",
            borderRadius: 12,
            border: "none",
            background: "var(--mn-accent-grad)",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 3px 12px var(--mn-accent-ring)",
          }}
        >
          Retake quiz
        </button>
        <button
          onClick={onBrowse}
          style={{
            padding: "11px 26px",
            borderRadius: 12,
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
          Browse quizzes
        </button>
      </div>
    </div>
  );
}
